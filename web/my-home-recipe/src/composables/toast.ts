// ============================================================
// 全局轻提示（Toast）
// ------------------------------------------------------------
// 一个极简、无依赖的全局消息队列：
//   import { showToast } from '@/composables/toast'
//   showToast('已保存', 'success')
// ToastHost.vue 订阅队列并渲染在页面顶部。
// ============================================================

import { reactive } from 'vue'

export type ToastType = 'info' | 'success' | 'error'

export interface ToastItem {
  id: number
  text: string
  type: ToastType
}

/** 提示展示时长（ms） */
const DURATION = 2200

/** 全局唯一自增 id */
let seed = 0

/** 消息队列（响应式，供宿主组件渲染） */
const toasts = reactive<ToastItem[]>([])

/**
 * 弹出一条轻提示，超时后自动消失
 * @param text 提示文案
 * @param type 提示类型（影响颜色与图标）
 */
export function showToast(text: string, type: ToastType = 'info'): void {
  const id = ++seed
  toasts.push({ id, text, type })

  window.setTimeout(() => {
    const index = toasts.findIndex((item) => item.id === id)
    if (index !== -1) toasts.splice(index, 1)
  }, DURATION)
}

/** 仅供 ToastHost 读取的队列引用 */
export function useToastList(): ToastItem[] {
  return toasts
}
