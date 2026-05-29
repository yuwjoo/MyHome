export interface WebTriggerEventOptions<T = any> {
  id: string; // 通道id
  name?: string; // 事件名称
  data?: T; // 数据
  isDone?: boolean; // 是否结束
  isReject?: boolean; // 是否Promise响应为拒绝
}
