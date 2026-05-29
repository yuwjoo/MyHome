export type BaseListSlots = {
  /**
   * 列表区域
   */
  default: (props: { datas: any[] }) => void;
  /**
   * 列表项区域
   */
  item: (props: { data: any; index: number }) => void;
};

/**
 * 加载函数
 */
export type LoadFun = (options: LoadFunOptions) => Promise<LoadFunResponse>;

/**
 * 加载函数-配置项
 */
export type LoadFunOptions = {
  /**
   * 当前页
   */
  pageNum: number;
  /**
   * 每页条数
   */
  pageSize: number;
};

/**
 * 加载函数-响应数据
 */
export type LoadFunResponse = {
  /**
   * 数据列表
   */
  datas: any[];
  /**
   * 总条数
   */
  total?: number;
  /**
   * 是否加载完成
   */
  isFinished?: boolean;
};
