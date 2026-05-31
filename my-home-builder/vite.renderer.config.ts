import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

/**
 * unplugin-icons: 将 SVG 文件转换为 Vue 组件
 * FileSystemIconLoader: 从文件系统加载自定义 SVG 图标集
 */
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    vue(),

    // -- unplugin-icons 配置 --
    // 将 src/assets/icons 下的 SVG 文件注册为 'my' 图标集
    // 使用时通过 ~icons/my/<icon-name> 引入
    Icons({
      compiler: 'vue3',
      customCollections: {
        my: FileSystemIconLoader('./src/assets/icons'),
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入变量/混合（可选）
        additionalData: '',
      },
    },
  },
});
