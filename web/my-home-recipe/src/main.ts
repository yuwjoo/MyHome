import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 样式：先载入 Tailwind 主题令牌，再载入全局基础样式
import '@/styles/theme.css'
import '@/styles/base.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
