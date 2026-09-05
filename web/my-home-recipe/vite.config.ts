import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    // Tailwind CSS v4 —— 仅承担「主题/设计令牌」管理：
    // @theme 中的变量会编译为 :root 上的 CSS 变量，供业务 SCSS 通过 var() 引用。
    // 页面与组件样式一律用 Sass 手写，不使用 Tailwind 原子类。
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 统一使用最新语法（Sass 模块系统 @use），由 Vite 内置编译器处理
      },
    },
  },
  server: {
    host: '0.0.0.0',
  },
})
