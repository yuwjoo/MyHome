/**
 * @file 项目工具
 * @description 生成项目在本地的唯一标识，并提供发布控制器的中文说明
 */
import type { TPublishController } from '@shared/types/config/publishConfig'

/**
 * 生成项目标识：项目类型 / 项目名称
 *
 * 与主进程定位项目的方式保持一致：单个项目由「项目类型 + 项目名称」唯一确定
 * @param project 含项目类型与项目名称的项目信息
 * @returns 项目标识
 */
export function resolveProjectKey(project: { projectType: string; projectName: string }): string {
  return `${project.projectType}/${project.projectName}`
}

/**
 * 发布控制器说明：key 为控制器标识，value 为展示用名称
 */
export const publishControllerLabels: Record<TPublishController, string> = {
  // 通用 Android 项目
  generalAndroid: '通用 Android',
  // 通用 Web 项目
  generalWeb: '通用 Web'
}
