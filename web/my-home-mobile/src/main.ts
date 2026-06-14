import './assets/main.css'
import 'vue-sonner/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import { initNativeBridge } from './modules/nativeBridge/index.ts'

// 开发环境下启用 vConsole 调试工具
if (import.meta.env.DEV) {
  import('vconsole').then(({ default: VConsole }) => {
    new VConsole()
  })
}

// 初始化原生通信模块
initNativeBridge()

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')
