/**
 * @file 发布任务管理模块
 * @description 按项目类型 + 项目名称登记发布中的控制器，保证同一项目同一时间只有一个发布任务，并可随时取回控制器
 */
import type { TPublishControllerInstance } from '@main/modules/publish/controller/types/controller'

/**
 * 发布任务集合
 *
 * key 为「项目类型/项目名称」，value 为正在执行发布的控制器实例
 */
const publishTaskMap = new Map<string, TPublishControllerInstance>()

/**
 * 添加发布任务：把正在发布的控制器登记到该项目下
 *
 * 同一项目已有任务时抛错，保证同一项目同一时间只有一个发布任务
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @param publishController 正在执行发布的控制器实例
 * @throws 该项目已有发布任务时抛错
 */
export function addPublishTask(
  projectType: string,
  projectName: string,
  publishController: TPublishControllerInstance
): void {
  const taskKey = resolveTaskKey(projectType, projectName)
  if (publishTaskMap.has(taskKey)) {
    throw new Error(`添加发布任务失败：项目「${taskKey}」正在发布中`)
  }
  publishTaskMap.set(taskKey, publishController)
}

/**
 * 删除发布任务：发布结束（成功、失败或被中止）后注销该项目的控制器
 *
 * 项目没有发布任务时静默跳过
 * @param projectType 项目类型
 * @param projectName 项目名称
 */
export function deletePublishTask(projectType: string, projectName: string): void {
  publishTaskMap.delete(resolveTaskKey(projectType, projectName))
}

/**
 * 是否有发布任务
 *
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 该项目正在发布返回 true，否则返回 false
 */
export function hasPublishTask(projectType: string, projectName: string): boolean {
  return publishTaskMap.has(resolveTaskKey(projectType, projectName))
}

/**
 * 取发布任务的控制器
 *
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 该项目正在发布时的控制器实例，未发布时为 null
 */
export function getPublishTaskController(
  projectType: string,
  projectName: string
): TPublishControllerInstance | null {
  return publishTaskMap.get(resolveTaskKey(projectType, projectName)) ?? null
}

/**
 * 拼任务标识：项目类型 / 项目名称
 *
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 任务标识
 */
function resolveTaskKey(projectType: string, projectName: string): string {
  return `${projectType}/${projectName}`
}
