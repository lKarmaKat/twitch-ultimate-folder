import * as CST from '../constantes';
import type { I_CONFIG, I_NEW_LIST, UserConfigs } from './models/userStructure';

const LAYOUT_NAMES: Record<number, string> = {
  [CST.LIST_LAYOUT_STACK]: 'stack',
  [CST.LIST_LAYOUT_SPLIT]: 'split',
  [CST.LIST_LAYOUT_FLYOUT]: 'flyout',
  [CST.LIST_LAYOUT_TABS]: 'tabs',
  [CST.LIST_LAYOUT_GRID]: 'grid',
  [CST.LIST_LAYOUT_DOCK]: 'dock'
};

const SORT_NAMES: Record<number, string> = {
  [CST.CUSTOM_SORT]: 'custom',
  [CST.VIEWER_SORT]: 'viewers',
  [CST.ALPHA_SORT]: 'alpha'
};

const SOURCE_KINDS = [CST.SOURCE_KIND_MANUAL, CST.SOURCE_KIND_GAME, CST.SOURCE_KIND_LANGUAGE, CST.SOURCE_KIND_FRESH];

interface ListSummary {
  account: number,
  depth: number,
  layout: string,
  sort: string,
  source: string,
  channels: number,
  subLists: number,
  allOthers: boolean
}

interface Snapshot {
  v: 1,
  ext: string,
  cohort: string,
  configsPerAccount: number[],
  lists: ListSummary[]
}

export function buildSnapshot(accounts: UserConfigs[], installedAt: number | undefined, version: string): Snapshot {
  return {
    v: 1,
    ext: version,
    cohort: installedAt ? new Date(installedAt).toISOString().slice(0, 7) : 'legacy',
    configsPerAccount: accounts.map(user => user.configsList?.length ?? 0),
    lists: accounts.flatMap((user, account) => summarizeConfig(currentConfigOf(user), account))
  };
}

function currentConfigOf(user: UserConfigs): I_CONFIG | undefined {
  const configs = user.configsList ?? [];
  return configs.find(config => config.rootList?.name === user.currentConfig) ?? configs[0];
}

function summarizeConfig(config: I_CONFIG | undefined, account: number): ListSummary[] {
  const lists: ListSummary[] = [];
  if (!config) return lists;
  const visited = new Set<string>();
  const visit = (listId: string, depth: number) => {
    const list = config[listId];
    if (!list || visited.has(listId)) return;
    visited.add(listId);
    lists.push({ account, depth, ...summarizeList(list) });
    (list.items ?? [])
      .filter(item => item.type === CST.TYPE_LIST)
      .forEach(item => visit(item.id, depth + 1));
  };
  visit('rootList', 0);
  return lists;
}

function summarizeList(list: I_NEW_LIST) {
  const items = list.items ?? [];
  const layout = (list.type as any)?.layout ?? CST.LIST_LAYOUT_STACK;
  const kind = list.source?.kind ?? CST.SOURCE_KIND_MANUAL;
  return {
    layout: LAYOUT_NAMES[layout] ?? 'unknown',
    sort: SORT_NAMES[list.sort ?? CST.CUSTOM_SORT] ?? 'unknown',
    source: SOURCE_KINDS.includes(kind) ? kind : 'unknown',
    channels: items.filter(item => item.type !== CST.TYPE_LIST && item.channel_id != null && Number(item.channel_id) >= 0).length,
    subLists: items.filter(item => item.type === CST.TYPE_LIST).length,
    allOthers: items.some(item => item.channel_id === CST.ALL_OTHER_CHANNELS)
  };
}
