/**
 * @file 发版store
 */
import Store from 'electron-store'
import { ReleaseConfig } from '@shared/types/config/releaseConfig'

const defaultConfig = {
  projects: [
    {
      projectName: 'MyHome（示例）',
      projectPath: '../../android/MyHome',
      projectVersion: '0.0.0',
      projectType: 'android'
    },
    {
      projectName: 'my-home-service（示例）',
      projectPath: '../../service/my-home-service',
      projectVersion: '0.0.0',
      projectType: 'nestJS'
    }
  ],
  androidStudio: {
    jdkPath: '<jdk路径>',
    sdkPath: '<sdk路径>'
  }
}

/**
 * 发版store
 */
export const releaseStore = new Store<ReleaseConfig>({
  name: 'releaseConfig',
  defaults: defaultConfig
})
