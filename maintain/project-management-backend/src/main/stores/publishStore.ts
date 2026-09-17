/**
 * @file 发布仓库
 * @description 存放发布所需的本地数据与 OSS 发布配置
 */
import Store from 'electron-store'
import type { IPublishConfig } from '@shared/types/config/publishConfig'

// 默认配置
const defaultConfig: IPublishConfig = {
  // 项目信息列表
  projects: [],
  // 本地资源数据
  localAssets: {
    // 本地根目录
    rootDir: '',
    // .secret 目录
    secretDir: ''
  },
  // OSS 资源数据
  ossAssets: {
    // 发布根路径
    rootDir: 'MyHome',
    // 版本清单文件路径
    versionManifestPath: './versionManifest.json',
    // .secret 文件路径
    secretPath: './.secret.zip'
  },
  // Android Studio 相关配置
  androidStudio: {
    // JDK 路径
    jdkPath: '',
    // SDK 路径
    sdkPath: ''
  }
}

// 发布 store
export const publishStore = new Store<IPublishConfig>({
  name: 'publishConfig',
  defaults: defaultConfig
})
