import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import VueDevTools from 'vite-plugin-vue-devtools'

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

export default defineConfig(({ mode }) => {
  return {
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
      // 环境变量(.env*)仅渲染进程使用，将其声明在渲染进程目录下
      envDir: resolve('src/renderer'),
      resolve: {
        alias: rendererAlias
      },
      plugins: [
        vue(),
        // 开发环境(mode=development)加载 Vue 调试（组件树 / 时间线 / 源码点击跳转），生产不加载
        ...(mode === 'development' ? [VueDevTools()] : []),
        // API 自动导入：ref/reactive/computed 等 Vue API 与 ElMessage 等组件 API
        AutoImport({
          imports: ['vue'],
          resolvers: [ElementPlusResolver()],
          dts: resolve('src/renderer/src/types/auto-imports.d.ts')
        }),
        // 组件按需注册：模板中出现的 ElXxx 自动引入组件与样式
        Components({
          resolvers: [ElementPlusResolver()],
          dts: resolve('src/renderer/src/types/components.d.ts')
        })
      ]
    }
  }
})
