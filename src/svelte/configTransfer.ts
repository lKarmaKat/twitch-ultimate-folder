import type { UserConfigs, I_CONFIG } from '../service_worker/models/userStructure.js';

/**
 * Carries a config between machines: JSON -> gzip -> base64, so it survives any
 * text channel intact. Kept free of Svelte and chrome.* to stay testable.
 */

const ENVELOPE_VERSION = 1;
const ENCODING = 'gzip';

/** Base64 slice size, see bytesToBase64. */
const CHUNK_SIZE = 0x8000;

export type TransferErrorCode =
    | 'EMPTY'
    | 'BASE64'
    | 'GZIP'
    | 'JSON'
    | 'ENVELOPE'
    | 'VERSION'
    | 'CONFIG';

/** Carries a code so the UI can show a fitting message. */
export class ConfigTransferError extends Error {
    code: TransferErrorCode;
    constructor(code: TransferErrorCode, message: string) {
        super(message);
        this.name = 'ConfigTransferError';
        this.code = code;
    }
}

interface Envelope {
    v: number;
    exportedAt: string;
    data: UserConfigs;
}

/**
 * On an invalid stream write()/close() reject too; left floating that is an
 * unhandled rejection, while the useful error already surfaces from the read.
 */
function pump(writable: WritableStream<BufferSource>, byteArray: Uint8Array<ArrayBuffer>): void {
    const writer = writable.getWriter();
    writer.write(byteArray).catch(() => { });
    writer.close().catch(() => { });
}

/** Read the stream directly: no reason to pull in fetch for a data transform. */
async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array<ArrayBuffer>> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (; ;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

// Uint8Array<ArrayBuffer>, not Uint8Array: the buffer param is generic since
// TS 5.7 and BufferSource excludes SharedArrayBuffer.
async function compress(str: string): Promise<Uint8Array<ArrayBuffer>> {
    const cs = new CompressionStream(ENCODING);
    pump(cs.writable, new TextEncoder().encode(str));
    return readAll(cs.readable);
}

async function decompress(byteArray: Uint8Array<ArrayBuffer>): Promise<string> {
    const ds = new DecompressionStream(ENCODING);
    pump(ds.writable, byteArray);
    return new TextDecoder().decode(await readAll(ds.readable));
}

/**
 * btoa(String.fromCharCode(...bytes)) blows the argument limit past a few tens
 * of thousands of bytes, hence the slicing.
 */
function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }
    return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/** Versioned envelope: `v` lets a future format be rejected instead of loaded. */
export async function encodeConfig(userConfigs: UserConfigs): Promise<string> {
    const envelope: Envelope = {
        v: ENVELOPE_VERSION,
        exportedAt: new Date().toISOString(),
        data: userConfigs
    };
    return bytesToBase64(await compress(JSON.stringify(envelope)));
}

export async function decodeConfig(text: string): Promise<UserConfigs> {
    // A long string often comes back wrapped by whatever client relayed it.
    const cleaned = (text || '').replace(/\s+/g, '');
    if (!cleaned) {
        throw new ConfigTransferError('EMPTY', 'No configuration provided');
    }

    let bytes: Uint8Array<ArrayBuffer>;
    try {
        bytes = base64ToBytes(cleaned);
    } catch {
        throw new ConfigTransferError('BASE64', 'Not a valid base64 string');
    }

    let json: string;
    try {
        json = await decompress(bytes);
    } catch {
        throw new ConfigTransferError('GZIP', 'Not a valid gzip payload');
    }

    let envelope: Envelope;
    try {
        envelope = JSON.parse(json);
    } catch {
        throw new ConfigTransferError('JSON', 'Payload is not valid JSON');
    }

    if (!envelope || typeof envelope !== 'object' || typeof envelope.v !== 'number') {
        throw new ConfigTransferError('ENVELOPE', 'Unrecognized export envelope');
    }
    if (envelope.v !== ENVELOPE_VERSION) {
        throw new ConfigTransferError('VERSION', `Unsupported export version ${envelope.v}`);
    }

    const data = envelope.data;
    const isUsable = !!data
        && Array.isArray(data.configsList)
        && data.configsList.length > 0
        && data.configsList.every(conf => !!conf?.rootList && Array.isArray(conf.rootList.items));
    if (!isUsable) {
        throw new ConfigTransferError('CONFIG', 'Export contains no usable configuration');
    }

    return data;
}

/**
 * An export holds the whole UserConfigs but the UI edits one I_CONFIG at a
 * time, so keep the one the export marked as active.
 */
export function pickActiveConfig(userConfigs: UserConfigs): I_CONFIG {
    return userConfigs.configsList.find(conf => conf.rootList.name === userConfigs.currentConfig)
        ?? userConfigs.configsList[0];
}
