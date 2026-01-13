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
export interface I_NEW_LIST {
  id: string,
  name: string,
  items: [],
  behavior: {},
  style: {}
};

export interface CONFIG { [key: string]: string; }