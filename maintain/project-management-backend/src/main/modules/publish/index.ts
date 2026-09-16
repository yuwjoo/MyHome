/**
 * @file 发布模块出口
 * @description 对外暴露发布能力：项目发布入口与 Shell 命令执行器
 */
import { myHomeStore } from '@main/stores/myHomeStore'
import type { IProjectInfo } from '@shared/types/config'
import { controller } from './controller'
import type { IPublishLog } from './controller/types/publish'

/**
 * 发布项目
 *
 * 按项目路径从本地项目列表取项目信息，从 controller 集合匹配发布控制器执行发布：
 * 以传入的目标版本号发布，发布成功后把最新版本号写回本地项目列表并返回最新项目信息；
 * 发布过程各阶段的日志经 onLog 回调给调用方，任一阶段失败即中断并抛错（此时不更新本地版本记录）
 * @param projectPath 项目路径
 * @param targetVersion 本次发布的目标版本号
 * @param onLog 发布日志回调，可选；不传则不输出发布过程日志
 * @returns 发布成功后的最新项目信息（含最新版本号）
 * @throws 项目不存在、发布控制器未实现或发布流程任一阶段失败时抛错
 */
export async function publishProject(
  projectPath: string,
  targetVersion: string,
  onLog?: (log: IPublishLog) => void
): Promise<IProjectInfo> {
  const projectInfo = myHomeStore
    .get('local')
    .projects.find((item) => item.projectPath === projectPath)
  if (!projectInfo) throw new Error(`发布失败：未找到路径为「${projectPath}」的项目`)
  const Controller = controller[projectInfo.publishController]
  if (!Controller) {
    throw new Error(`发布失败：未实现发布控制器「${projectInfo.publishController}」`)
  }
  await new Controller(projectInfo).publish({ targetVersion, onLog })
  const latestProjectInfo = { ...projectInfo, latestVersion: targetVersion }
  const projects = myHomeStore.get('local').projects
  myHomeStore.set(
    'local.projects',
    projects.map((item) => (item.projectPath === projectPath ? latestProjectInfo : item))
  )
  return latestProjectInfo
}
