/**
 * Shell 命令执行消息处理器
 * 处理渲染进程的 shell 命令执行请求，结果通过 MessageSender 回传
 */
import { exec, spawn } from 'node:child_process';
import * as path from 'node:path';
import { app } from 'electron';
import type { MessageHandler } from '../../module/bridge/dispatcher';

/**
 * 解析工作目录，相对路径基于应用目录
 */
function resolveCwd(cwd?: string): string | undefined {
  if (!cwd) return undefined;
  if (path.isAbsolute(cwd)) return cwd;
  return path.resolve(app.getAppPath(), '..', cwd);
}

export const shellGroup: Record<string, MessageHandler> = {
  /**
   * 执行 Shell 命令（捕获全部输出后回传）
   * params: { command: string; cwd?: string }
   * 成功回调: onSuccess({ stdout: string })
   * 失败回调: onError({ message: string })
   */
  execCommand: (params, sender) => {
    const command = params.command as string | undefined;
    if (!command) {
      sender.sendEndMessage('onError', { message: '参数 command 缺失' });
      return;
    }
    const options: { cwd?: string; maxBuffer?: number } = {
      maxBuffer: 50 * 1024 * 1024,
    };
    const cwd = resolveCwd(params.cwd as string | undefined);
    if (cwd) options.cwd = cwd;

    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        sender.sendEndMessage('onError', {
          message: stderr || error.message,
        });
      } else {
        sender.sendEndMessage('onSuccess', { stdout });
      }
    });
  },

  /**
   * 执行 Shell 命令（实时流式输出）
   * params: { command: string; cwd?: string }
   * 输出回调: onOutput({ type: 'stdout'|'stderr'; data: string }) — isEnd=false，可多次触发
   * 结束回调: onClose({ code: number|null }) — isEnd=true，通知结束
   * 错误回调: onError({ message: string }) — isEnd=true
   */
  spawnCommand: (params, sender) => {
    const command = params.command as string | undefined;
    if (!command) {
      sender.sendEndMessage('onError', { message: '参数 command 缺失' });
      return;
    }
    const cwd = resolveCwd(params.cwd as string | undefined);
    const options = {
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    };
    if (cwd) Object.assign(options, { cwd });

    const child = spawn(command, [], options);

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      if (text.trim()) {
        sender.send('onOutput', { type: 'stdout', data: text }, false);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      if (text.trim()) {
        sender.send('onOutput', { type: 'stderr', data: text }, false);
      }
    });

    child.on('close', (code: number | null) => {
      sender.sendEndMessage('onClose', { code });
    });

    child.on('error', (err: Error) => {
      sender.sendEndMessage('onError', { message: err.message });
    });
  },
};
