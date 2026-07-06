/**
 * 原生提供者（渲染进程）
 * 封装与主进程注入 provider 对象的交互
 *
 * 对应 web 端 NativeProvider，通过 Electron contextBridge 暴露的 window 对象通信
 */
import { bridgeConfig } from './bridgeConfig';
import type { NativePlatform, NativeProviderObject, NativeMessage } from './types/bridge';

class NativeProvider {
  /**
   * 获取主进程注入的 provider 对象
   */
  private get nativeProviderObject(): NativeProviderObject | undefined {
    return (window as any)[bridgeConfig.nativeProviderKey];
  }

  /**
   * 检测当前是否运行在 Electron 环境中
   */
  isNativeEnv(): boolean {
    return this.getPlatform() !== null;
  }

  /**
   * 获取当前平台
   */
  getPlatform(): NativePlatform | null {
    const npo = this.nativeProviderObject;
    if (typeof npo?.platform !== 'function') return null;
    return npo.platform() ?? null;
  }

  /**
   * 发送消息到主进程
   */
  send(
    groupName: string,
    messageName: string,
    messageId: string,
    params: Record<string, unknown> = {},
  ): void {
    const npo = this.nativeProviderObject;
    if (!npo) {
      console.warn('[NativeProvider] 当前不在 Electron 环境中，消息未发送', {
        groupName,
        messageName,
        messageId,
        params,
      });
      return;
    }
    const body: NativeMessage = { groupName, messageName, messageId, params };
    npo.onMessage(JSON.stringify(body));
  }
}

/** 单例导出 */
export const nativeProvider = new NativeProvider();
