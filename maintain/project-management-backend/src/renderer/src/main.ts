/**
 * @file 渲染进程入口
 * @description 创建 Vue 应用实例，装载路由后挂载到 #app
 */
import 'modern-normalize'
// 函数式组件（ElMessage / ElMessageBox）不经模板出现，插件不会自动注入其样式，在此按目录补齐
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/base.scss'

createApp(App).use(router).mount('#app')
