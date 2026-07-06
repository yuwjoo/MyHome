/**
 * 主进程 Bridge 模块入口
 * 对应 Android 端 Bridge.kt
 *
 * 使用方式：
 *   在 electron-main.ts 中调用 Bridge.mount(mainWindow) 挂载
 *   注册分组：Bridge.dispatcher.register(myGroup)
 *
 * 架构摘要：
 *   Renderer → ipcRenderer.invoke → ipcMain.handle(NativeProvider) → Dispatcher → GroupHandler
 *   GroupHandler → MessageSender → webContents.send → ipcRenderer.on(MessageReceiver) → CallbackCenter
 */
import { ipcMain, type BrowserWindow } from 'electron';
import { bridgeConfig } from './bridgeConfig';
import { Dispatcher, type BridgeGroup } from './dispatcher';
import type { NativeMessage } from './types';

export class Bridge {
  readonly dispatcher = new Dispatcher();
  private browserWindow: BrowserWindow | null = null;

  /**
   * 挂载 Bridge 到 BrowserWindow，注册内置分组模块
   *
   * @param browserWindow BrowserWindow 实例
   * @param groups 要注册的分组模块（可选）
   */
  mount(browserWindow: BrowserWindow, groups: BridgeGroup[] = []): void {
    this.browserWindow = browserWindow;

    // 注册分组
    for (const group of groups) {
      this.dispatcher.register(group);
    }

    // 注册 IPC 处理器：渲染进程 → 主进程
    ipcMain.handle(bridgeConfig.onMessageIPCEvent, (_event, msg: NativeMessage) => {
      return this.handleMessage(msg);
    });
  }

  /**
   * 销毁 Bridge，移除 IPC 处理器
   */
  destroy(): void {
    ipcMain.removeHandler(bridgeConfig.onMessageIPCEvent);
    this.browserWindow = null;
  }

  /**
   * 处理来自渲染进程的消息
   */
  private handleMessage(msg: NativeMessage): void {
    if (!this.browserWindow) {
      console.warn('[Bridge] 未挂载，消息已丢弃');
      return;
    }
    this.dispatcher.dispatch(this.browserWindow, msg);
  }
}

/** 单例导出 */
export const bridge = new Bridge();
