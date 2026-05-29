import { bridgeInterfaceForAndroid } from "./bridgeInterfaceForAndroid";

/**
 * @description: 生成随机id
 * @return {string} id
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * @description: 检查是否不是AndroidBrigdge环境
 * @return {boolean} 不是AndroidBrigdge环境
 */
export function checkNotIsAndroidBridgeEnv(): boolean {
  if (bridgeInterfaceForAndroid.available) {
    return false;
  }
  console.error("android bridge is not available");
  return true;
}
