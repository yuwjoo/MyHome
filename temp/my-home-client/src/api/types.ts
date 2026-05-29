/**
 * 响应主体
 */
export interface ResponseBody<D = void> {
  code: number; // 响应码
  data: D; // 响应数据
  message: string; // 响应消息
}

/**
 * 分页
 */
export interface Pagination {
  current: number; // 当前页
  size: number; // 每页条数
  total: number; // 总条数
}

/**
 * 列表数据
 */
export interface ListData<T = unknown> extends Pagination {
  list: T[]; // 列表数据
}

/**
 * 响应列表主体
 */
export type ResponseListBody<T = unknown> = ResponseBody<ListData<T>>;
