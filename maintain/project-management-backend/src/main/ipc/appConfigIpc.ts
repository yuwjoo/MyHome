/**
 * @file 应用配置ipc
 */
import type { AppConfig } from '@shared/types/config/appConfig'
import { appStore } from '@main/store/appStore'
import { handle } from '@main/ipc/utils/handler'

/**
 * appConfig 可更新字段
 */
const CONFIG_KEYS: (keyof AppConfig)[] = ['secretFilePath', 'myHomeOssRootPath']

/**
 * 获取应用配置
 * @returns 当前应用配置
 */
handle('appConfig:getConfig', () => {
  return appStore.store
})

/**
 * 更新应用配置（整体覆盖）
 * @param config 应用配置
 * @returns 保存后的应用配置
 */
handle('appConfig:updateConfig', (_event, config) => {
  if (
    !config ||
    typeof config.secretFilePath !== 'string' ||
    typeof config.myHomeOssRootPath !== 'string'
  ) {
    throw new Error('保存失败：应用配置不完整')
  }
  appStore.store = config
  return config
})

/**
 * 更新应用配置字段（单字段）
 * @param key 配置字段名
 * @param value 字段值
 * @returns 更新后的应用配置
 */
handle('appConfig:updateConfigField', (_event, key, value) => {
  if (!CONFIG_KEYS.includes(key)) {
    throw new Error(`保存失败：未知配置字段「${key}」`)
  }
  if (typeof value !== 'string') {
    throw new Error('保存失败：配置值必须为字符串')
  }
  appStore.set(key, value)
  return appStore.store
})
