import type { PropType } from "vue";
import type { LoadFun } from "./types";

export const baseListProps = {
  /**
   * 禁用下拉刷新
   */
  disabledRefresh: {
    type: Boolean,
    default: false
  },
  /**
   * 禁用滚动加载
   */
  disabledLoad: {
    type: Boolean,
    default: false
  },
  /**
   * 每页条数
   */
  pageSize: {
    type: Number,
    default: 30
  },
  /**
   * 加载函数
   */
  loadFun: {
    type: Function as PropType<LoadFun>,
    required: false
  },
  /**
   * 立即执行一次数据加载
   */
  immediateLoad: {
    type: Boolean,
    default: true
  }
} as const;

export const baseListModels = {
  /**
   * 列表数据
   */
  modelValue: {
    type: Array as PropType<any[]>,
    default: () => []
  }
};
