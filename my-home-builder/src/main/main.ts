/**
 * Electron 主进程
 * 管理窗口创建、IPC 通信处理
 */

import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { createWindow, getMainWindow } from './module/window';
import { bridge } from './module/bridge';
import { bridgeGroup } from './common/bridge';

// 处理 Windows 安装/卸载快捷方式
if (started) {
  app.quit();
}

// ============================================================
// 应用生命周期
// ============================================================

app.on('ready', () => {
  createWindow();
  const mainWindow = getMainWindow();
  if (mainWindow) {
    bridge.mount(mainWindow, bridgeGroup);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
