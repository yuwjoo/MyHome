/**
 * @file 设置类型
 * @description 定义设置模块对外的数据形态：发布配置里的本地资源、OSS 资源与 androidStudio 配置
 */
import type { IPublishConfig } from '@shared/types/config'

/**
 * 设置数据：发布配置里的本地资源配置、OSS 资源配置与 androidStudio 配置
 *
 * 项目列表由本地项目模块单独维护，不在设置范围内
 */
export type TSetting = Pick<IPublishConfig, 'localAssets' | 'ossAssets' | 'androidStudio'>
