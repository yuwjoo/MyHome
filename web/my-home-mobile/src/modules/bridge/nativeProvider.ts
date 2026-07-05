import { bridgeConfig } from './bridgeConfig'
import type { NativePlatform, NativeProviderObject, NativeMessage } from './types/bridge'

/**
 * 原生提供者，封装与原生端注入 provider 对象的交互
 */
class NativeProvider {
  /**
   * 获取原生端注入的 provider 对象
   */
  private get nativeProviderObject(): NativeProviderObject | undefined {
    return window[bridgeConfig.nativeProviderKey]
  }

  /**
   * 检测当前是否运行在原生环境中
   */
  isNativeEnv(): boolean {
    return this.getPlatform() !== null
  }

  /**
   * 获取当前原生平台
   *
   * @returns 平台标识，非原生环境返回 null
   */
  getPlatform(): NativePlatform | null {
    const npo = this.nativeProviderObject
    if (typeof npo?.platform !== 'function') return null
    return npo.platform() ?? null
  }

  /**
   * 发送消息到原生端
   *
   * @param groupName   分组名称
   * @param messageName 消息名称
   * @param messageId   消息 ID
   * @param params      消息参数
   */
  send(
    groupName: string,
    messageName: string,
    messageId: string,
    params: Record<string, unknown> = {},
  ): void {
    const npo = this.nativeProviderObject
    if (!npo) {
      console.warn('[NativeProvider] 当前不在原生环境中，消息未发送', {
        groupName,
        messageName,
        messageId,
        params,
      })
      return
    }
    const body: NativeMessage = { groupName, messageName, messageId, params }
    npo.onMessage(JSON.stringify(body))
  }
}

// 单例导出
export const nativeProvider = new NativeProvider()
