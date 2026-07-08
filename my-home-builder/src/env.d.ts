/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

/**
 * unplugin-icons 虚拟模块类型声明
 * 通过 ~icons/<collection>/<icon> 引入的 SVG 图标组件
 */
declare module '~icons/*' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

// Electron preload 暴露的 API 类型
interface Window {
  electronAPI: {
    /** 执行 Shell 命令（实时流式输出） */
    spawnCommand: (command: string, cwd: string, taskId: string) => Promise<{ code: number | null }>;
    /** 写入文件 */
    writeFile: (filePath: string, content: string) => Promise<void>;
  };
}
