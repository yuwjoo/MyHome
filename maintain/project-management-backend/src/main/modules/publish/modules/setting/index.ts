/**
 * @file 设置模块
 * @description 基于 myHomeStore 读写设置数据（MyHome 配置里除项目列表之外的部分）
 */
import { myHomeStore } from '@main/stores/myHomeStore'
import type { ISetting } from '@shared/types/config'

/**
 * 获取设置
 *
 * 取 myHomeStore 里的 OSS 配置与本地配置（排除项目列表）；
 * 项目列表由本地项目模块维护，不在设置范围内
 * @returns 当前设置数据
 */
export function getSetting(): ISetting {
  const { projects: _projects, ...local } = myHomeStore.get('local')
  return { local, oss: myHomeStore.get('oss') }
}

/**
 * 更新设置
 *
 * 用传入的设置覆盖对应的配置：本地配置除项目列表外全部覆盖为传入值，
 * 项目列表保持原值不动，OSS 配置整体覆盖
 * @param setting 最新设置数据
 * @returns 更新后的设置数据
 */
export function updateSetting(setting: ISetting): ISetting {
  const projects = myHomeStore.get('local').projects
  myHomeStore.set({ local: { ...setting.local, projects }, oss: setting.oss })
  return getSetting()
}
