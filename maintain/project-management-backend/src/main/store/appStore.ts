/**
 * @file 应用store
 */
import Store from 'electron-store'
import { AppConfig } from '@shared/types/config/appConfig'

const defaultConfig = {
  secretFilePath: '',
  myHomeOssRootPath: '',
  ossVersionManifestRelativePath: ''
}

/**
 * 应用store
 */
export const appStore = new Store<AppConfig>({
  name: 'appConfig',
  defaults: defaultConfig
})
