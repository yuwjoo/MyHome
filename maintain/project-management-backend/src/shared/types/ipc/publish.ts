/**
 * @file 发布 IPC 契约（跨进程共享）
 * @description 定义发布域的发布流程类型与 API / MSG 通道契约，供主进程与预加载脚本共用
 */
import type { IProjectInfo, IPublishConfig } from '@shared/types/config/publishConfig'

/**
 * 设置数据：发布配置里除项目列表之外的部分
 *
 * 项目列表由本地项目模块维护，设置的读写不涉及
 */
export type ISetting = Pick<IPublishConfig, 'localAssets' | 'ossAssets' | 'androidStudio'>

/**
 * 发布阶段
 */
export type TPublishStage = 'prepare' | 'build' | 'upload' | 'finish'

/**
 * 发布日志推送负载：一条发布日志 + 项目标识
 *
 * 同一时间可能有多个项目在发布，推送时补上项目类型与项目名称，渲染进程据此区分归属
 */
export interface IPublishLogMsg {
  /** 项目类型 */
  projectType: string
  /** 项目名称 */
  projectName: string
  /** 当前所处阶段 */
  stage: TPublishStage
  /** 节点函数发出的内部消息 */
  message: string
}

/**
 * 发布 API
 */
export interface IPublishApi {
  /** 获取本地项目列表 */
  'publish:getLocalProjectList': {
    args: []
    result: IProjectInfo[]
  }

  /** 获取单个本地项目（按项目类型 + 项目名称） */
  'publish:getLocalProject': {
    args: [projectType: string, projectName: string]
    result: IProjectInfo | null
  }

  /** 保存本地项目（按项目类型 + 项目名称定位，存在则修改，不存在则新增） */
  'publish:saveLocalProject': {
    args: [project: IProjectInfo]
    result: IProjectInfo[]
  }

  /** 删除本地项目（按项目类型 + 项目名称） */
  'publish:deleteLocalProject': {
    args: [projectType: string, projectName: string]
    result: IProjectInfo[]
  }

  /** 获取设置（发布配置里除项目列表之外的部分） */
  'publish:getSetting': {
    args: []
    result: ISetting
  }

  /** 更新设置（除项目列表外整体覆盖） */
  'publish:updateSetting': {
    args: [setting: ISetting]
    result: ISetting
  }

  /** 发布项目（发布日志经 publish:publishLog 推送） */
  'publish:publishProject': {
    args: [projectType: string, projectName: string, targetVersion: string]
    result: IProjectInfo
  }

  /** 中止发布 */
  'publish:abortPublish': {
    args: [projectType: string, projectName: string]
    result: boolean
  }
}

/**
 * 发布 MSG
 */
export interface IPublishMsg {
  /** 发布日志：发布过程中各阶段节点发消息时推送，负载带项目类型与项目名称标识 */
  'publish:publishLog': [log: IPublishLogMsg]
}
