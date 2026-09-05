import { onBeforeUnmount, watch, type Ref } from 'vue'

/**
 * 让全屏弹层支持「系统返回 / 浏览器后退先关闭弹层」。
 *
 * 原理：
 * - 弹层打开时向历史栈压入一条“同 URL 记录”并监听 popstate；
 * - 物理返回 / 浏览器后退会触发 popstate → 仅把弹层关闭，页面本身不后退；
 * - 弹层被页面内 UI 主动关闭时，弹掉压入的那条记录，避免留下多余的“幽灵后退”。
 *
 * 说明：Android 原生壳在 WebView 无可跨文档历史时会回调页面
 * （见 window.__myhomeHandleNativeBack，由 main.ts 注册）执行 history.back()，
 * 该调用同样先触发本监听关闭弹层，再逐级回退 SPA 路由，行为与浏览器一致。
 *
 * @param open  弹层开关（来自 v-model）
 * @param close 关闭动作（通常为 emit('update:open', false)）
 */
export function useBackClose(open: Ref<boolean>, close: () => void): void {
  /** 当前是否压入了属于本弹层的历史记录 */
  let pushed = false

  function onPopstate(): void {
    if (!pushed) return
    pushed = false
    window.removeEventListener('popstate', onPopstate)
    // 返回键触达：仅关闭弹层，浏览器已弹出本弹层压入的记录
    close()
  }

  watch(open, (value) => {
    if (value) {
      if (pushed) return
      pushed = true
      window.addEventListener('popstate', onPopstate)
      // 同 URL 压栈：返回时不离开当前页面，而是回退到“打开弹层前”的状态
      window.history.pushState({ __backClose__: true }, '')
    } else if (pushed) {
      // 页面内主动关闭（点关闭按钮/遮罩/Esc 等）：弹出压入的记录
      pushed = false
      window.removeEventListener('popstate', onPopstate)
      window.history.back()
    }
  })

  onBeforeUnmount(() => {
    // 组件被销毁时不再弹栈，避免在路由已切换后触发多余的后退
    pushed = false
    window.removeEventListener('popstate', onPopstate)
  })
}
