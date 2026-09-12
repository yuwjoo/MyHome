/**
 * @file MyHome 仓库
 * @description 存放 MyHome 的本地数据与 OSS 发布配置
 */
import Store from 'electron-store'
import type { IMyHomeConfig } from '@shared/types/config'

// 默认配置
const defaultConfig: IMyHomeConfig = {
  // 本地数据
  local: {
    // 本地根目录
    rootDir: '',
    // .secret 目录
    secretDir: '',
    // 项目信息列表
    projects: [],
    // Android Studio 相关配置
    androidStudio: {
      // JDK 路径
      jdkPath: '',
      // SDK 路径
      sdkPath: ''
    }
  },
  // OSS 数据
  oss: {
    // 发布根路径
    rootDir: 'MyHome',
    // 版本清单文件路径
    versionManifestPath: 'MyHome/versionManifest.json',
    // .secret 文件路径
    secretPath: 'MyHome/.secret.zip'
  }
}

// MyHome store
export const myHomeStore = new Store<IMyHomeConfig>({
  name: 'myHomeConfig',
  defaults: defaultConfig
})
