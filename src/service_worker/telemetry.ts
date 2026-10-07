import { api } from '../browserApi';
import * as CST from '../constantes';
import type { UserConfigs } from './models/userStructure';
import { buildSnapshot } from './telemetrySnapshot';

const ENDPOINT = 'https://ut-folders-stats.karmakat.workers.dev/v1/snapshot';
const SEND_INTERVAL_MS = 7 * 24 * 3600 * 1000;

export function startTelemetry() {
  api.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') api.storage.local.set({ [CST.PARAM_INSTALLED_AT]: Date.now() });
  });
  maybeSend().catch(() => {});
}

async function maybeSend() {
  const settings = await api.storage.local.get([
    CST.PARAM_TELEMETRY_ENABLED,
    CST.PARAM_TELEMETRY_LAST_SENT,
    CST.PARAM_INSTALLED_AT
  ]);
  if (settings[CST.PARAM_TELEMETRY_ENABLED] === false) return;
  const now = Date.now();
  const lastSent = (settings[CST.PARAM_TELEMETRY_LAST_SENT] as number | undefined) ?? 0;
  if (now - lastSent < SEND_INTERVAL_MS) return;

  const storage = await api.storage.local.get(null);
  const accounts = Object.entries(storage)
    .filter(([key]) => key.startsWith(CST.configKey('')))
    .map(([, user]) => user as UserConfigs);
  if (!accounts.length) return;

  const snapshot = buildSnapshot(
    accounts,
    settings[CST.PARAM_INSTALLED_AT] as number | undefined,
    api.runtime.getManifest().version
  );
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot)
  });
  if (response.ok) await api.storage.local.set({ [CST.PARAM_TELEMETRY_LAST_SENT]: now });
}
