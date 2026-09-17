/**
 * @file 设置类型
 * @description 定义设置模块的数据形态：从发布配置中取本地资源、OSS 资源与 androidStudio 三个设置项
 */
import type { IPublishConfig } from '@shared/types/config/publishConfig'

/**
 * 设置数据
 *
 * 项目列表由本地项目模块单独维护，不在设置范围内
 */
export type ISetting = Pick<IPublishConfig, 'localAssets' | 'ossAssets' | 'androidStudio'>
