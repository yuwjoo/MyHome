import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

// 各进程共享的路径别名，不同进程的代码统一通过这些别名引用模块
const alias = {
  '@main': resolve('src/main'),
  '@preload': resolve('src/preload'),
  '@renderer': resolve('src/renderer/src')
}

export default defineConfig({
  main: {
    resolve: {
      alias
    }
  },
  preload: {
    resolve: {
      alias
    }
  },
  renderer: {
    resolve: {
      alias
    },
    plugins: [vue()]
  }
})
