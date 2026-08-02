export interface test {
  id: UserConfigs
}

export interface UserConfigs {
    userId: number,
    currentConfig: string,
    configsList: I_CONFIG[]
}

// export interface NamedConfig {
//     configName: string,
//     config: I_CONFIG
// }

export interface I_CONFIG {
  [key: string]: I_NEW_LIST;
};
export interface I_SOURCE {
  kind: string, // 'manual' | 'game' | 'language' | 'fresh'
  game_id: string | null,
  game_name: string | null,
  language: string | null,
  freshMinutes: number
}
export interface I_NEW_LIST {
  id: string,
  name: string,
  items: any[],
  sort: number,
  behavior: {},
  style: {},
  type: {},
  source: I_SOURCE
};

export interface CONFIG { [key: string]: string; }