interface Env {
  DB: D1Database;
}

interface ListSummary {
  account: number;
  depth: number;
  layout: string;
  sort: string;
  source: string;
  channels: number;
  subLists: number;
  allOthers: boolean;
}

interface Snapshot {
  v: 1;
  ext: string;
  cohort: string;
  configsPerAccount: number[];
  lists: ListSummary[];
}

const SNAPSHOT_PATH = '/v1/snapshot';
const MAX_BODY_BYTES = 20_000;
const MAX_ACCOUNTS = 20;
const MAX_LISTS = 500;
const MAX_COUNT = 10_000;
const RETENTION_MS = 760 * 24 * 3600 * 1000;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const COHORT_PATTERN = /^(\d{4}-(0[1-9]|1[0-2])|legacy)$/;
const LAYOUTS = ['stack', 'split', 'flyout', 'tabs', 'grid', 'dock', 'unknown'];
const SORTS = ['custom', 'viewers', 'alpha', 'unknown'];
const SOURCES = ['manual', 'game', 'language', 'fresh', 'unknown'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== SNAPSHOT_PATH) return new Response(null, { status: 404 });
    if (request.method === 'OPTIONS') return reply(204);
    if (request.method !== 'POST') return reply(405);
    if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) return reply(413);

    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) return reply(413);
    const snapshot = parseSnapshot(body);
    if (!snapshot) return reply(400);

    await env.DB
      .prepare('INSERT INTO snapshots (received_at, ext_version, cohort, payload) VALUES (?, ?, ?, ?)')
      .bind(Date.now(), snapshot.ext, snapshot.cohort, JSON.stringify(snapshot))
      .run();
    return reply(204);
  },

  async scheduled(_controller, env) {
    await env.DB
      .prepare('DELETE FROM snapshots WHERE received_at < ?')
      .bind(Date.now() - RETENTION_MS)
      .run();
  }
} satisfies ExportedHandler<Env>;

function reply(status: number) {
  return new Response(null, { status, headers: CORS_HEADERS });
}

function parseSnapshot(body: string): Snapshot | null {
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return null;
  }
  if (!isRecord(raw) || raw.v !== 1) return null;
  if (typeof raw.ext !== 'string' || !VERSION_PATTERN.test(raw.ext)) return null;
  if (typeof raw.cohort !== 'string' || !COHORT_PATTERN.test(raw.cohort)) return null;

  const configsPerAccount = raw.configsPerAccount;
  if (!Array.isArray(configsPerAccount) || configsPerAccount.length > MAX_ACCOUNTS || !configsPerAccount.every(isCount)) return null;
  if (!Array.isArray(raw.lists) || raw.lists.length > MAX_LISTS) return null;

  const lists: ListSummary[] = [];
  for (const list of raw.lists) {
    const summary = parseList(list, configsPerAccount.length);
    if (!summary) return null;
    lists.push(summary);
  }
  return { v: 1, ext: raw.ext, cohort: raw.cohort, configsPerAccount, lists };
}

function parseList(list: unknown, accountCount: number): ListSummary | null {
  if (!isRecord(list)) return null;
  const { account, depth, layout, sort, source, channels, subLists, allOthers } = list;
  if (!isCount(account) || account >= accountCount) return null;
  if (!isCount(depth) || !isCount(channels) || !isCount(subLists)) return null;
  if (!isOneOf(layout, LAYOUTS) || !isOneOf(sort, SORTS) || !isOneOf(source, SOURCES)) return null;
  if (typeof allOthers !== 'boolean') return null;
  return { account, depth, layout, sort, source, channels, subLists, allOthers };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_COUNT;
}

function isOneOf(value: unknown, allowed: string[]): value is string {
  return typeof value === 'string' && allowed.includes(value);
}
