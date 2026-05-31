/**
 * Electron 主进程
 * 管理窗口创建、IPC 通信处理
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { exec } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// 处理 Windows 安装/卸载快捷方式
if (started) {
  app.quit();
}

/**
 * 创建主窗口
 */
const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'MyHome Builder - 构建发布工具',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 加载页面
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // 开发模式打开 DevTools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// ============================================================
// IPC 处理器注册
// ============================================================

/**
 * 执行 Shell 命令
 * 用于运行各端项目的构建脚本
 */
ipcMain.handle(
  'exec-command',
  async (
    _event,
    { command, cwd }: { command: string; cwd?: string },
  ): Promise<{ stdout: string; stderr: string }> => {
    return new Promise((resolve, reject) => {
      const options = cwd ? { cwd: path.resolve(cwd) } : {};
      exec(command, { ...options, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          // 构建失败时，返回 stdout/stderr 供日志展示
          resolve({ stdout, stderr: stderr || error.message });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  },
);

/**
 * 打开目录选择对话框
 */
ipcMain.handle('select-directory', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择项目目录',
  });
  return result.canceled ? null : result.filePaths[0];
});

/**
 * 读取文件内容
 */
ipcMain.handle('read-file', async (_event, filePath: string): Promise<string> => {
  return readFile(filePath, 'utf-8');
});

/**
 * 写入文件
 */
ipcMain.handle(
  'write-file',
  async (_event, filePath: string, content: string): Promise<void> => {
    await writeFile(filePath, content, 'utf-8');
  },
);

// ============================================================
// 应用生命周期
// ============================================================

app.on('ready', createWindow);

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
