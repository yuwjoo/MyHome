export interface BridgeGlobalOnEvent {
  version: string;
}

export interface BridgeGlobalSendEvent {
  ready: undefined;
}

export interface BridgeGlobalOn {
  <K extends keyof BridgeGlobalOnEvent>(name: K, callback: (result: BridgeGlobalOnEvent[K]) => void): void;
}

export interface BridgeGlobalSend {
  <K extends keyof BridgeGlobalSendEvent>(name: K, data?: BridgeGlobalSendEvent[K]): void;
}
