import './assets/main.css'
import 'vue-sonner/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

// 开发环境下启用 vConsole 调试工具
if (import.meta.env.VITE_APP_ENV === 'development') {
  import('vconsole').then(({ default: VConsole }) => {
    new VConsole()
  })
}

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')
