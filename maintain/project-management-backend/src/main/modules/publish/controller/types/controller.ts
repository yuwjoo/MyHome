/**
 * @file 发布控制器类型
 * @description 定义发布控制器实例类型与构造器类型，供外界按类型别名使用，无需依赖基类文件
 */
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import type { PublishController } from '../publishController'

/**
 * 发布控制器实例
 *
 * 发布控制器基类的类型别名：各控制器实现均继承基类，外界按此别名持有实例
 */
export type TPublishControllerInstance = PublishController

/**
 * 发布控制器构造器
 */
export type TPublishControllerConstructor = new (
  projectInfo: IProjectInfo
) => TPublishControllerInstance
