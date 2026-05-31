/**
 * 渲染进程入口
 * 初始化 Vue3 应用，挂载 Element Plus、路由等
 */
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import '@/styles/global.scss';

import App from './App.vue';
import router from './router';

const app = createApp(App);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(ElementPlus, { locale: undefined }); // 默认中文
app.use(router);
app.mount('#app');
