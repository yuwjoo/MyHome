/**
 * @file 应用配置api：渲染进程侧对 appConfig 主进程通道的方法封装
 */
import { invoke } from '@preload/api/utils/handler'
import type { IpcApiShape } from '@preload/api/types/ipc'

/**
 * 应用配置 api
 */
export const appConfigApi: IpcApiShape['appConfig'] = {
  /**
   * 获取应用配置
   * @returns 当前应用配置
   */
  getConfig: () => {
    return invoke('appConfig:getConfig')
  },

  /**
   * 更新应用配置（整体覆盖）
   * @param config 应用配置
   * @returns 保存后的应用配置
   */
  updateConfig: (config) => {
    return invoke('appConfig:updateConfig', config)
  },

  /**
   * 更新应用配置字段（单字段）
   * @param key 配置字段名
   * @param value 字段值
   * @returns 更新后的应用配置
   */
  updateConfigField: (key, value) => {
    return invoke('appConfig:updateConfigField', key, value)
  }
}
