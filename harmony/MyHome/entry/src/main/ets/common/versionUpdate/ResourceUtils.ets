/**
 * 资源工具类
 */

import { http } from '@kit.NetworkKit';
import { fileIo } from '@kit.CoreFileKit';
import { zlib } from '@kit.BasicServicesKit';

/**
 * HTTP 下载进度事件数据结构
 */
interface HttpProgressEvent {
  receiveSize: number;
  totalSize: number;
}

export class ResourceUtils {
  /**
   * 获取远程资源内容
   *
   * @param url - 远程资源地址
   * @returns 资源内容
   * @throws {Error} 请求失败时抛出
   */
  static async fetch(url: string): Promise<string | Object | ArrayBuffer> {
    const httpRequest = http.createHttp();

    try {
      const resp = await httpRequest.request(url, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.ARRAY_BUFFER,
        connectTimeout: 15000,
        readTimeout: 30000,
      });

      return resp.result
    } finally {
      httpRequest.destroy();
    }
  }

  /**
   * 下载资源并保存到本地
   *
   * @param url        - 远程资源地址
   * @param destPath   - 本地保存的完整路径
   * @param onProgress - 下载进度回调（0–100）
   * @throws {Error} 下载或写入失败时抛出
   */
  static async download(
    url: string,
    destPath: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const httpRequest = http.createHttp();

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

      ensureDir(destPath.substring(0, destPath.lastIndexOf('/')));

      const arr = new Uint8Array(resp.result as ArrayBuffer);
      const file = fileIo.openSync(destPath,
        fileIo.OpenMode.CREATE | fileIo.OpenMode.WRITE_ONLY);
      try {
        fileIo.writeSync(file.fd, arr.buffer);
      } finally {
        fileIo.closeSync(file);
      }

      if (onProgress) {
        onProgress(100);
      }
    } finally {
      httpRequest.destroy();
    }
  }

  /**
   * 读取本地资源内容
   *
   * @param path - 本地资源地址
   * @returns 资源内容字符串
   */
  static read(path: string): string {
    try {
      return fileIo.readTextSync(path);
    } catch (error) {
      return ""
    }
  }

  /**
   * 解压 ZIP 资源到目标目录
   *
   * @param zipPath   - ZIP 文件的本地路径
   * @param outputDir - 解压到的目标目录
   * @throws {Error} 解压失败时抛出
   */
  static async extract(zipPath: string, outputDir: string): Promise<void> {
    try {
      fileIo.mkdirSync(outputDir, true);
    } catch (_e) {
      // 目录已存在则忽略
    }
    await zlib.decompressFile(zipPath, outputDir);
  }

  /**
   * 删除本地资源
   *
   * @param path - 本地资源地址
   */
  static delete(path: string): void {
    try {
      fileIo.unlinkSync(path);
    } catch (_e) {
      // 忽略删除失败
    }
  }
}

/**
 * 确保目录存在
 *
 * @param dirPath - 目录路径
 */
function ensureDir(dirPath: string): void {
  try {
    fileIo.mkdirSync(dirPath, true);
  } catch (_e) {
    // 目录已存在则忽略
  }
}
