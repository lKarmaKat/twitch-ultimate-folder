import { createRequire } from "module";
const require = createRequire(import.meta.url);


Object.assign(global, require('jest-chrome'))

const { CompressionStream, DecompressionStream } = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');
Object.assign(global, { CompressionStream, DecompressionStream, TextEncoder, TextDecoder });
