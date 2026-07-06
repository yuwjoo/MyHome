/**
 * 文件操作消息处理器
 * 处理渲染进程的文件读写请求，将结果通过 MessageSender 回传
 */
import * as path from 'node:path';
import { readFile, writeFile, access } from 'node:fs/promises';
import { app } from 'electron';
import type { MessageHandler } from '../../module/bridge/dispatcher';

/**
 * 解析文件路径，相对路径基于应用目录
 */
function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(app.getAppPath(), '..', filePath);
}

export const localFileGroup: Record<string, MessageHandler> = {
  /**
   * 读取文本文件
   * params: { filePath: string }
   * 成功回调: onSuccess({ content: string })
   * 失败回调: onError({ message: string })
   */
  readFile: (params, sender) => {
    const filePath = params.filePath as string | undefined;
    if (!filePath) {
      sender.sendEndMessage('onError', { message: '参数 filePath 缺失' });
      return;
    }
    readFile(resolvePath(filePath), 'utf-8')
      .then((content) => sender.sendEndMessage('onSuccess', { content }))
      .catch((err) =>
        sender.sendEndMessage('onError', { message: (err as Error).message }),
      );
  },

  /**
   * 写入文本文件
   * params: { filePath: string; content: string }
   * 成功回调: onSuccess({})
   * 失败回调: onError({ message: string })
   */
  writeFile: (params, sender) => {
    const filePath = params.filePath as string | undefined;
    const content = params.content as string | undefined;
    if (!filePath) {
      sender.sendEndMessage('onError', { message: '参数 filePath 缺失' });
      return;
    }
    writeFile(resolvePath(filePath), content ?? '', 'utf-8')
      .then(() => sender.sendEndMessage('onSuccess', {}))
      .catch((err) =>
        sender.sendEndMessage('onError', { message: (err as Error).message }),
      );
  },

  /**
   * 以 base64 编码读取文件（支持二进制）
   * params: { filePath: string }
   * 成功回调: onSuccess({ base64: string })
   * 失败回调: onError({ message: string })
   */
  readFileBase64: (params, sender) => {
    const filePath = params.filePath as string | undefined;
    if (!filePath) {
      sender.sendEndMessage('onError', { message: '参数 filePath 缺失' });
      return;
    }
    readFile(resolvePath(filePath))
      .then((buffer) =>
        sender.sendEndMessage('onSuccess', { base64: buffer.toString('base64') }),
      )
      .catch((err) =>
        sender.sendEndMessage('onError', { message: (err as Error).message }),
      );
  },

  /**
   * 检查文件是否存在
   * params: { filePath: string }
   * 回调: onSuccess({ exists: boolean })
   */
  existsFile: (params, sender) => {
    const filePath = params.filePath as string | undefined;
    if (!filePath) {
      sender.sendEndMessage('onError', { message: '参数 filePath 缺失' });
      return;
    }
    access(resolvePath(filePath))
      .then(() => sender.sendEndMessage('onSuccess', { exists: true }))
      .catch(() => sender.sendEndMessage('onSuccess', { exists: false }));
  },
};
