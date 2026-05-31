/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

// Electron preload 暴露的 API 类型
interface Window {
  electronAPI: {
    /** 执行 shell 命令 */
    execCommand: (command: string, cwd?: string) => Promise<{ stdout: string; stderr: string }>;
    /** 选择目录 */
    selectDirectory: () => Promise<string | null>;
    /** 读取文件 */
    readFile: (filePath: string) => Promise<string>;
    /** 写入文件 */
    writeFile: (filePath: string, content: string) => Promise<void>;
  };
}
