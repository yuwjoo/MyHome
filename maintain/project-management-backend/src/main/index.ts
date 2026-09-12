/**
 * @file 主进程入口
 * @description 注册 IPC 通道、管理应用生命周期
 */
import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from '@main/window'
import '@main/ipc'

// 应用初始化完成后创建窗口
app.whenReady().then(() => {
  // 设置 Windows 平台应用用户模型 id
  electronApp.setAppUserModelId('com.electron')

  // 开发环境由 F12 开关 DevTools，生产环境忽略 Ctrl/Cmd + R
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // macOS 下点击 dock 图标且无窗口时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除 macOS 外，关闭全部窗口即退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
