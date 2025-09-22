import { bridgeConfig } from "./bridgeConfig";
import type {
  WebViewInterface,
  WebViewInterfaceCallMethodOptions,
  WebViewInterfaceTriggerEventOptions
} from "./types/webViewInterface";

const webViewInterface: WebViewInterface | null = window[bridgeConfig.webViewInterfaceKey];

/**
 * @description: 是否可用
 * @return {boolean} 状态
 */
export function available(): boolean {
  return !!webViewInterface;
}

/**
 * @description: 调用方法
 * @param {WebViewInterfaceCallMethodOptions} options 发送数据
 */
export function callMethod(options: WebViewInterfaceCallMethodOptions) {
  webViewInterface?.callMethod(JSON.stringify(options));
}

/**
 * @description: 触发事件
 * @param {WebViewInterfaceTriggerEventOptions} options 发送数据
 */
export function triggerEvent(options: WebViewInterfaceTriggerEventOptions) {
  webViewInterface?.triggerEvent(JSON.stringify(options));
}

/**
 * @description: 抛出异常
 * @param {string} message 消息
 */
export function throwError(message: string) {
  webViewInterface?.throwError(message);
}

/**
 * @description: 重置bridge
 */
export function resetBridge() {
  webViewInterface?.resetBridge();
}
