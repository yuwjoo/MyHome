/**
 * @file 发布控制器类型
 * @description 定义发布控制器构造器类型
 */
import type { IProjectInfo } from '@shared/types/config'
import type { PublishController } from '../publishController'

/**
 * 发布控制器构造器
 */
export type TPublishControllerConstructor = new (projectInfo: IProjectInfo) => PublishController
