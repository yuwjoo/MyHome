/**
 * 文件下载工具类
 */

import { http } from '@kit.NetworkKit';
import { fileIo } from '@kit.CoreFileKit';
import { LogUtils } from '../../utils/LogUtils';

const TAG = 'FileDownloadUtils';

/** HTTP 下载进度事件数据结构 */
interface HttpProgressEvent {
  receiveSize: number;
  totalSize: number;
}

export class FileDownloadUtils {
  /**
   * 下载文件并保存到本地
   *
   * @param url      - 远程文件地址
   * @param destPath - 本地保存的完整路径
   * @param onProgress - 下载进度回调（0–100）
   * @throws {Error} - 下载或写入失败时抛出异常
   */
  static async download(
    url: string,
    destPath: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    LogUtils.info(TAG, `download start, url: %{public}s`, url);

    const httpRequest = http.createHttp();

    // 监听下载进度
    httpRequest.on('dataReceiveProgress', (data: HttpProgressEvent) => {
      if (onProgress && data.totalSize > 0) {
        onProgress(Math.round((data.receiveSize / data.totalSize) * 100));
      }
    });

    try {
      const resp = await httpRequest.request(url, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.ARRAY_BUFFER,
        connectTimeout: 15000,
        readTimeout: 120000,
      });

      if (!resp.result || typeof resp.result === 'string') {
        throw new Error('文件下载失败：响应数据为空');
      }

      // 确保目标目录存在
      ensureDir(destPath.substring(0, destPath.lastIndexOf('/')));

      // 写入文件
      const arr = new Uint8Array(resp.result as ArrayBuffer);
      const file = fileIo.openSync(destPath,
        fileIo.OpenMode.CREATE | fileIo.OpenMode.WRITE_ONLY);
      try {
        fileIo.writeSync(file.fd, arr.buffer);
      } finally {
        fileIo.closeSync(file);
      }

      // 通知进度 100%
      if (onProgress) {
        onProgress(100);
      }

      LogUtils.info(TAG, `download success, path: %{public}s`, destPath);
    } finally {
      httpRequest.destroy();
    }
  }
}

/**
 * 确保目录存在
 * @param dirPath - 目录路径
 */
function ensureDir(dirPath: string): void {
  try {
    fileIo.mkdirSync(dirPath, true);
  } catch (_e) {
    // 目录已存在则忽略
  }
}
