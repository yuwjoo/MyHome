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

/**
 * archiver v8 ESM 类型声明
 * archiver v8 是纯 ESM 包，导出 ZipArchive 等命名类
 */
declare module 'archiver' {
  import { Transform, TransformOptions } from 'node:stream';
  import { ZlibOptions } from 'node:zlib';

  interface ZipOptions {
    zlib?: ZlibOptions;
  }

  class ZipArchive extends Transform {
    constructor(options?: TransformOptions & ZipOptions);
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
    directory(dirpath: string, destpath: string | false): this;
    finalize(): Promise<void>;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'close', listener: () => void): this;
  }

  export { ZipArchive };
}

// Electron preload 暴露的 API 类型
interface Window {
  electronAPI: {
    /** 执行 shell 命令 */
    execCommand: (command: string, cwd?: string) => Promise<{ stdout: string; stderr: string }>;
    /** 执行 shell 命令（实时流式输出） */
    spawnCommand: (command: string, cwd: string, taskId: string) => Promise<{ code: number | null }>;
    /** 监听命令实时输出 */
    onCommandOutput: (callback: (data: { taskId: string; type: 'stdout' | 'stderr'; data: string }) => void) => void;
    /** 移除命令输出监听 */
    removeCommandOutputListener: () => void;
    /** 选择目录 */
    selectDirectory: () => Promise<string | null>;
    /** 读取文件 */
    readFile: (filePath: string) => Promise<string>;
    /** 写入文件 */
    writeFile: (filePath: string, content: string) => Promise<void>;
  };
}
