import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

// 主进程与预加载脚本别名（Node 侧互相引用 + 共享代码）
const nodeAlias = {
  '@main': resolve('src/main'),
  '@preload': resolve('src/preload'),
  '@shared': resolve('src/shared')
}

// 渲染进程别名（自身代码 + 共享代码）
const rendererAlias = {
  '@renderer': resolve('src/renderer/src'),
  '@shared': resolve('src/shared')
}

export default defineConfig({
  main: {
    resolve: {
      alias: nodeAlias
    }
  },
  preload: {
    resolve: {
      alias: nodeAlias
    }
  },
  renderer: {
    resolve: {
      alias: rendererAlias
    },
    plugins: [vue()]
  }
})
