export interface AndroidInterface {
  callMethod: (data: string) => void;
  triggerEvent: (options: AndroidTriggerEventOptions) => void;
  throwError: (message: string) => void;
  rebuild: () => void;
}

export interface AndroidCallMethodOptions {
  id?: string; // 通道id
  callMethodPath: string[]; // 调用方法路径
  data: any; // 数据
}

export interface AndroidTriggerEventOptions {
  id: string; // 通道id
  name?: string; // 事件名称
  data?: any; // 数据
  isDone?: boolean; // 是否结束
}
