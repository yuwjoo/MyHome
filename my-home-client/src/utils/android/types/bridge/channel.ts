export interface IChannel<TOn extends Record<PropertyKey, any> = any, TSend extends Record<PropertyKey, any> = any> {
  on: IChannelOn<TOn>;
  only: IChannelOn<TOn>;
  off: IChannelOn<TOn>;
  send: IChannelSend<TSend>;
  done: IChannelDone<TSend>;
}

export interface IChannelOptions {
  id: string;
  isClose?: boolean;
  onClose?: () => void;
}

export interface IChannelOn<T extends Record<PropertyKey, any> = any> {
  <K extends Extract<keyof T, string | symbol>>(name: K, callback: (result: T[K]) => void): void;
}

export interface IChannelEmit<T extends Record<PropertyKey, any> = any> {
  <K extends Extract<keyof T, string | symbol>>(name: K, data?: T[K]): void;
}

export interface IChannelSend<T extends Record<PropertyKey, any> = any> {
  <K extends Extract<keyof T, string>>(name: K, data?: T[K]): void;
}

export interface IChannelDone<T extends Record<PropertyKey, any> = any> {
  <K extends Extract<keyof T, string>>(name?: K, data?: T[K]): void;
}
