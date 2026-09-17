/**
 * @file 设置模块
 * @description 基于 publishStore 读写设置数据（发布配置里除项目列表之外的部分）
 */
import { publishStore } from '@main/stores/publishStore'
import type { ISetting } from './types/setting'

/**
 * 获取设置
 *
 * 取 publishStore 里的本地资源配置、OSS 资源配置与 androidStudio 配置；
 * 项目列表由本地项目模块维护，不在设置范围内
 * @returns 当前设置数据
 */
export function getSetting(): ISetting {
  return {
    localAssets: publishStore.get('localAssets'),
    ossAssets: publishStore.get('ossAssets'),
    androidStudio: publishStore.get('androidStudio')
  }
}

/**
 * 更新设置
 *
 * 用传入的设置覆盖对应的配置：本地资源配置、OSS 资源配置与 androidStudio 配置整体覆盖为传入值，
 * 项目列表不在设置范围内，保持原值不动
 * @param setting 最新设置数据
 * @returns 更新后的设置数据
 */
export function updateSetting(setting: ISetting): ISetting {
  publishStore.set({
    localAssets: setting.localAssets,
    ossAssets: setting.ossAssets,
    androidStudio: setting.androidStudio
  })
  return getSetting()
}
