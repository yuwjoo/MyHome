/**
 * @file 发布资产 store：存放发布相关的本地数据与 OSS 发布配置
 */
import Store from 'electron-store'
import { PublishAssetConfig } from '@shared/types/config/publishAssetConfig'

const defaultConfig: PublishAssetConfig = {
  /** 本地数据 */
  local: {
    /** 本地根目录 */
    rootDir: '',
    /** .secret 目录 */
    secretDir: '',
    /** 项目信息列表 */
    projects: [],
    /** Android Studio 相关配置 */
    androidStudio: {
      /** JDK路径 */
      jdkPath: '',
      /** SDK路径 */
      sdkPath: ''
    }
  },
  /** OSS数据 */
  oss: {
    /** 发布根路径 */
    rootDir: 'MyHome',
    /** 版本清单文件路径 */
    versionManifestPath: 'MyHome/versionManifest.json',
    /** .secret 文件路径 */
    secretPath: 'MyHome/.secret.zip'
  }
}

/**
 * 发布资产 store
 */
export const publishAssetStore = new Store<PublishAssetConfig>({
  name: 'publishAssetConfig',
  defaults: defaultConfig
})
