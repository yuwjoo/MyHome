/**
 * 排序模式 auto: 智能排序，updateDate：按修改时间，filename: 按文件名称，fileSize: 按文件大小，fileType: 按文件类型
 */
export type SortMode = "auto" | "updateDate" | "filename" | "fileSize" | "fileType";
/**
 * 排序模式列表项
 */
export type sortModeListItem = {
  label: string;
  value: SortMode;
};

/**
 * 过滤模式 all：全部，myCreate: 我创建的，otherCreate: 其他人创建的
 */
export type FilterMode = "all" | "myCreate" | "otherCreate";
/**
 * 过滤模式列表项
 */
export type FilterModeListItem = {
  label: string;
  value: FilterMode;
};

/**
 * 列表类型 list: 列表，grid: 宫格
 */
export type ListType = "list" | "grid";
