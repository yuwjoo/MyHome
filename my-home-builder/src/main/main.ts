/**
 * Electron 主进程
 * 管理窗口创建、IPC 通信处理
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { createWindow, getMainWindow } from './module/window';
import { bridge } from './module/bridge';
import { bridgeGroup } from './common/bridge';

// 处理 Windows 安装/卸载快捷方式
if (started) {
  app.quit();
}

// ============================================================
// IPC 处理器注册
// ============================================================

/**
 * 执行 Shell 命令（实时流式输出）
 * 通过 IPC 事件将 stdout/stderr 实时推送到渲染进程
 */
ipcMain.handle(
  'spawn-command',
  async (
    event,
    { command, cwd, taskId }: { command: string; cwd: string; taskId: string },
  ): Promise<{ code: number | null }> => {
    return new Promise((resolve, reject) => {
      const child: ChildProcess = spawn(command, [], {
        shell: true,
        cwd: path.resolve(app.getAppPath(), '..', cwd),
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        if (text.trim()) {
          event.sender.send('command-output', { taskId, type: 'stdout', data: text });
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        if (text.trim()) {
          event.sender.send('command-output', { taskId, type: 'stderr', data: text });
        }
      });

      child.on('close', (code: number | null) => {
        resolve({ code });
      });

      child.on('error', (err: Error) => {
        event.sender.send('command-output', { taskId, type: 'stderr', data: err.message });
        reject(err);
      });
    });
  },
);

/**
 * 写入文件
 * 支持相对路径（基于应用目录解析）
 */
ipcMain.handle(
  'write-file',
  async (_event, filePath: string, content: string): Promise<void> => {
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(app.getAppPath(), '..', filePath);
    await writeFile(resolved, content, 'utf-8');
  },
);

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
