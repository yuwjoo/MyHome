/**
 * @file 发布控制器模块出口
 * @description 暴露发布控制器集合：key 为发布控制器标识，value 为对应控制器类
 */
import type { TPublishController } from '@shared/types/config'
import { GeneralAndroidPublishController } from './publishControllers/generalAndroidPublishController'
import { GeneralWebPublishController } from './publishControllers/generalWebPublishController'
import type { TPublishControllerConstructor } from './types/controller'

export type { PublishController } from './publishController'


/**
 * 发布控制器集合
 *
 * key 为项目信息里的发布控制器标识，value 为对应控制器构造器；
 * 新增控制器时先在 TPublishController 补标识，再在此登记实现
 */
export const controller: Record<TPublishController, TPublishControllerConstructor> = {
  generalAndroid: GeneralAndroidPublishController,
  generalWeb: GeneralWebPublishController
}