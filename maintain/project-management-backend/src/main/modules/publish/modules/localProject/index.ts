/**
 * @file 本地项目模块
 * @description 基于 myHomeStore 的本地项目列表做查询 / 保存 / 删除，以项目类型 + 项目名称定位项目
 */
import { myHomeStore } from '@main/stores/myHomeStore'
import type { IProjectInfo } from '@shared/types/config'

/**
 * 获取本地项目列表
 *
 * 直接取 myHomeStore 里 local.projects 的当前值
 * @returns 本地项目列表
 */
export function getLocalProjectList(): IProjectInfo[] {
  return myHomeStore.get('local').projects
}

/**
 * 获取本地项目
 *
 * 按项目类型 + 项目名称匹配单个项目，只读不改动本地数据
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 匹配的项目信息，没有匹配项目时为 null
 */
export function getLocalProject(projectType: string, projectName: string): IProjectInfo | null {
  return (
    myHomeStore
      .get('local')
      .projects.find(
        (item) =>
          item.projectType === projectType && item.projectName === projectName
      ) ?? null
  )
}

/**
 * 保存本地项目
 *
 * 按项目类型 + 项目名称定位：已存在则整体覆盖该项目，不存在则追加到列表末尾；
 * 保存后把最新列表写回 myHomeStore
 * @param project 项目信息
 * @returns 保存后的本地项目列表
 * @throws 项目类型或项目名称为空时抛错
 */
export function saveLocalProject(project: IProjectInfo): IProjectInfo[] {
  if (!project.projectType || !project.projectName) {
    throw new Error('保存失败：项目类型与项目名称不能为空')
  }
  const projects = myHomeStore.get('local').projects
  const index = projects.findIndex(
    (item) =>
      item.projectType === project.projectType && item.projectName === project.projectName
  )
  const next = [...projects]
  if (index === -1) next.push(project)
  else next[index] = project
  myHomeStore.set('local.projects', next)
  return next
}

/**
 * 删除本地项目
 *
 * 按项目类型 + 项目名称定位并删除该项目，删除后把最新列表写回 myHomeStore
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 删除后的本地项目列表
 * @throws 未找到对应项目时抛错
 */
export function deleteLocalProject(projectType: string, projectName: string): IProjectInfo[] {
  const projects = myHomeStore.get('local').projects
  const next = projects.filter(
    (item) => !(item.projectType === projectType && item.projectName === projectName)
  )
  if (next.length === projects.length) {
    throw new Error(`删除失败：未找到项目「${projectType}/${projectName}」`)
  }
  myHomeStore.set('local.projects', next)
  return next
}
