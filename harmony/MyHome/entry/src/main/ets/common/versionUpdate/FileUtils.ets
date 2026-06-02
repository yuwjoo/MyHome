/**
 * 文件操作工具类
 * 提供网络请求、文件下载、文本读取、解压、删除等基础文件操作能力
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

/**
 * 泛型约束：根据 HttpDataType 推断请求文件返回的 JavaScript 类型
 */
type ResponseType<T extends http.HttpDataType> =
  T extends http.HttpDataType.STRING ? string :
  T extends http.HttpDataType.OBJECT ? Object :
  ArrayBuffer;

export class FileUtils {
  /**
   * 请求文件：通过 HTTP GET 获取远程文件数据
   *
   * @param url        - 文件下载地址
   * @param dataType   - 响应数据类型，默认为 ARRAY_BUFFER
   * @param onProgress - 下载进度回调（0–100）
   * @returns 响应数据，类型由 dataType 决定
   * @throws {Error} 请求失败时抛出
   */
  static async fetchFile<T extends http.HttpDataType = http.HttpDataType.ARRAY_BUFFER>(
    url: string,
    dataType?: T,
    onProgress?: (percent: number) => void
  ): Promise<ResponseType<T>> {
    const actualDataType = dataType ?? http.HttpDataType.ARRAY_BUFFER;
    const httpRequest = http.createHttp();

    if (onProgress) {
      httpRequest.on('dataReceiveProgress', (data: HttpProgressEvent) => {
        if (data.totalSize > 0) {
          onProgress(Math.round((data.receiveSize / data.totalSize) * 100));
        }
      });
    }

    try {
      const resp = await httpRequest.request(url, {
        method: http.RequestMethod.GET,
        expectDataType: actualDataType,
        connectTimeout: 15000,
        readTimeout: 120000,
      });

      return resp.result;
    } finally {
      httpRequest.destroy();
    }
  }

  /**
   * 下载文件：请求远程文件并流式保存到本地
   *
   * @param url        - 文件下载地址
   * @param destPath   - 本地保存的完整路径
   * @param onProgress - 下载进度回调（0–100）
   * @throws {Error} 下载或写入失败时抛出
   */
  static async downloadFile(
    url: string,
    destPath: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    // 调用请求文件方法获取文件流
    const result = await this.fetchFile(
      url,
      http.HttpDataType.ARRAY_BUFFER,
      onProgress
    );

    // 确保目标目录存在
    ensureDir(destPath.substring(0, destPath.lastIndexOf('/')));

    // 流式保存到本地
    const arr = new Uint8Array(result);
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
  }

  /**
   * 读取文本：读取本地文件文本内容
   *
   * @param path - 文件路径
   * @returns 文件文本内容，读取失败返回空字符串
   */
  static readText(path: string): string {
    try {
      return fileIo.readTextSync(path);
    } catch (_e) {
      return '';
    }
  }

  /**
   * 解压：将 ZIP 压缩包解压到目标目录
   *
   * @param zipPath   - 压缩包路径
   * @param outputDir - 解压到文件路径
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
   * 删除：删除本地文件
   *
   * @param path - 文件路径
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
 * 确保目录存在，不存在则递归创建
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
