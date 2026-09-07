/**
 * @file 应用配置 IPC 契约（跨进程共享）
 */
import type { AppConfig } from '@shared/types/config/appConfig'

/**
 * 应用配置 API
 */
export interface AppConfigIpcApi {
  /** 获取应用配置 */
  'appConfig:getConfig': {
    args: []
    result: AppConfig
  }

  /** 更新应用配置 */
  'appConfig:updateConfig': {
    args: [config: AppConfig]
    result: AppConfig
  }

  /** 更新应用配置字段 */
  'appConfig:updateConfigField': {
    args: [key: keyof AppConfig, value: string]
    result: AppConfig
  }
}

/**
 * 应用配置 MSG
 */
export interface AppConfigIpcMsg {
  // 有实际推送事件时在此补充
}
