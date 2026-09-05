import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 样式：先载入 Tailwind 主题令牌，再载入全局基础样式
import '@/styles/theme.css'
import '@/styles/base.scss'

/**
 * Android WebView 原生返回键桥：
 * WebView.canGoBack() 只识别跨文档历史，SPA 的同文档历史（路由/弹层）不会进入其中，
 * 因此原生壳在 canGoBack() 为 false 时会回调这里，把回退决定权交给页面：
 * - 有同文档历史（含弹层压入的记录）→ 执行 history.back()，先关闭弹层/回退路由；
 * - 无历史可退 → 返回 false，由原生执行「双击退出应用」。
 *
 * 判断依据用当前历史条目的 state 而非 history.length：
 * history.length 在浏览器中只会随 pushState 增长、后退时不回缩（前进记录仍保留），
 * 无法表达“当前是否真的还有上一层”；而 Vue Router 会把上一层 URL 写入
 * history.state.back（根页面为 null），弹层则由 useBackClose 压入带 __backClose__
 * 标记的记录，因此同时检查这两个字段即可精确判断“本次返回是否可被消费”。
 */
;(window as unknown as Record<string, unknown>).__myhomeHandleNativeBack = (): boolean => {
  const state = window.history.state as Record<string, unknown> | null
  // 弹层打开中 或 SPA 还有上一层路由时，回退一步并消费本次返回
  if (state?.__backClose__ || state?.back) {
    window.history.back()
    return true
  }
  // 已到根页面且无弹层 → 交还原生执行「双击退出应用」
  return false
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
