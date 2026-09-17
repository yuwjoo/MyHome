/**
 * @file 发布模块出口
 * @description 对外暴露发布能力：项目发布 / 中止入口与本地项目读写
 */
import type { IProjectInfo } from '@shared/types/config'
import { controller } from './controller'
import type { IPublishLog } from './controller/types/publish'
import { getLocalProject, saveLocalProject } from './modules/localProject'
import {
  addPublishTask,
  deletePublishTask,
  hasPublishTask,
  getPublishTaskController
} from './modules/publishTask'

export {
  getLocalProjectList,
  getLocalProject,
  saveLocalProject,
  deleteLocalProject
} from './modules/localProject'
export { getSetting, updateSetting } from './modules/setting'

/**
 * 发布项目
 *
 * 按项目类型 + 项目名称从本地项目列表取项目信息，从 controller 集合匹配发布控制器执行发布：
 * 以传入的目标版本号发布，发布成功后把最新版本号写回本地项目列表并返回最新项目信息；
 * 发布过程各阶段的日志经 onLog 回调给调用方，任一阶段失败即中断并抛错（此时不更新本地版本记录）；
 * 发布期间控制器按项目标识登记，结束后注销，同一项目重复发布时直接抛错
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @param targetVersion 本次发布的目标版本号
 * @param onLog 发布日志回调，可选；不传则不输出发布过程日志
 * @returns 发布成功后的最新项目信息（含最新版本号）
 * @throws 项目不存在、发布控制器未实现、项目正在发布或发布流程任一阶段失败时抛错
 */
export async function publishProject(
  projectType: string,
  projectName: string,
  targetVersion: string,
  onLog?: (log: IPublishLog) => void
): Promise<IProjectInfo> {
  if (hasPublishTask(projectType, projectName)) {
    throw new Error(`发布失败：项目「${projectType}/${projectName}」正在发布中`)
  }
  const projectInfo = getLocalProject(projectType, projectName)
  if (!projectInfo) {
    throw new Error(`发布失败：未找到项目「${projectType}/${projectName}」`)
  }
  const Controller = controller[projectInfo.publishController]
  if (!Controller) {
    throw new Error(`发布失败：未实现发布控制器「${projectInfo.publishController}」`)
  }
  const publishController = new Controller(projectInfo)
  addPublishTask(projectType, projectName, publishController)
  try {
    await publishController.publish({ targetVersion, onLog })
  } finally {
    deletePublishTask(projectType, projectName)
  }
  const latestProjectInfo = { ...projectInfo, latestVersion: targetVersion }
  saveLocalProject(latestProjectInfo)
  return latestProjectInfo
}

/**
 * 中止发布
 *
 * 按项目类型 + 项目名称取正在发布的控制器并调用其中止；
 * 中止成功后被中止的节点会抛错，发布流程随之结束并注销该控制器
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 是否中止成功：已发起中止返回 true，项目未在发布或当前阶段不可中止时返回 false
 */
export async function abortPublish(projectType: string, projectName: string): Promise<boolean> {
  const publishController = getPublishTaskController(projectType, projectName)
  if (!publishController) return false
  return publishController.abort()
}
