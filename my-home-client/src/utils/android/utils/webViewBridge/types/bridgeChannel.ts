export type Callback = (payload: any) => void;

export type BridgeChannelOn = (eventName: string, callback: Callback) => void;

export type BridgeChannelOnly = (eventName: string, callback: Callback) => void;

export type BridgeChannelOff = (eventName: string, callback: Callback) => void;

export type BridgeChannelEmit = (eventName: string, payload: any) => void;

export type BridgeChannelSend = (eventName: string, payload: any) => void;

export type BridgeChannelDone = (eventName: string, payload: any) => void;
