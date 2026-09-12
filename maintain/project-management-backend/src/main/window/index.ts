/**
 * @file 应用窗口
 * @description 创建并加载应用主窗口，同时对外提供主窗口实例
 *
 * 注意：主进程为单入口打包，本文件最终会打进 out/main，
 * 因此这里 __dirname 指向 out/main，preload / renderer 的相对路径无需随目录层级调整
 */
import { shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

/**
 * 应用主窗口实例，未创建或已关闭时为 null
 */
let mainWindow: BrowserWindow | null = null

/**
 * 获取应用主窗口
 * @returns 主窗口实例；未创建或已关闭时返回 null
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * 创建应用主窗口
 */
export function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js')
    }
  })

  mainWindow = win

  win.on('ready-to-show', () => {
    win.show()
  })

  // 窗口关闭后置空，避免外部拿到已销毁的实例
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  // 站外链接交由系统浏览器打开，不在应用内新建窗口
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发环境加载 dev server 地址（支持 HMR），生产环境加载本地 html
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
