/**
 * @file 渲染进程入口
 * @description 创建 Vue 应用实例，装载路由后挂载到 #app
 */
import 'modern-normalize'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/base.scss'

createApp(App).use(router).mount('#app')
