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
export interface I_SOURCE_GAME {
  id: string,
  name: string
}
export interface I_SOURCE {
  kind: string, // 'manual' | 'game' | 'language' | 'fresh'
  // Optional: a config saved before the category cycle has none of them.
  games?: I_SOURCE_GAME[],
  // Kept mirroring games[0]: a version without the cycle only reads these.
  game_id: string | null,
  game_name: string | null,
  language: string | null,
  freshMinutes: number,
  autoRotate?: boolean,
  rotateSeconds?: number
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