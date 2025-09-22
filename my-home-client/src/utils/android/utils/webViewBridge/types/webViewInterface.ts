export type WebViewInterface = {
  callMethod: (optionsText: string) => void;
  triggerEvent: (optionsText: string) => void;
  throwError: (message: string) => void;
  resetBridge: () => void;
};

export type WebViewInterfaceCallMethodOptions = {
  channelId?: string;
  apiPath: string;
  payload?: any;
};

export type WebViewInterfaceTriggerEventOptions = {
  channelId: string;
  eventName?: string;
  payload?: any;
  isDone: boolean;
};
