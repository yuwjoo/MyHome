/**
 * Web 资源管理模块
 */

import { http } from '@kit.NetworkKit';
import { fileIo } from '@kit.CoreFileKit';
import { ZipExtractor } from './ZipExtractor';
import { INDEX_FILE } from './config/BaseConfig';
import {
  WEB_RESOURCE_ZIP_URL,
  LOCAL_WEB_DIR,
  TEMP_ZIP_FILE,
} from './config/VersionUpdateConfig';

/** HTTP 下载进度事件数据结构 */
interface HttpProgressEvent {
  receiveSize: number;
  totalSize: number;
}

export class WebResourceManager {
  /** 应用上下文（用于获取沙箱路径） */
  private context: Context;

  /** 本地 Web 资源根目录（沙箱绝对路径，解压后供 WebView 加载） */
  readonly localDir: string;

  /** 进度回调（0–100），在下载阶段实时触发 */
  onProgress?: (percent: number) => void;

  /**
   * @param context - 应用上下文
   */
  constructor(context: Context) {
    this.context = context;
    this.localDir = context.filesDir + '/' + LOCAL_WEB_DIR;
  }

  /** ZIP 临时下载路径（位于 cacheDir，用完即删） */
  private get tempZipPath(): string {
    return this.context.cacheDir + '/' + TEMP_ZIP_FILE;
  }

  // ════════════════════════════════════════════════════════════════
  // 公开方法
  // ════════════════════════════════════════════════════════════════

  /**
   * 完整流程：下载 → 解压 → 清理临时文件
   * @throws {Error} - 下载或解压失败时抛出异常
   */
  async downloadAndExtract(): Promise<void> {
    // 阶段 1：下载 ZIP 到临时文件
    await this.downloadZip(WEB_RESOURCE_ZIP_URL, this.tempZipPath);

    // 阶段 2：解压到本地资源目录
    await ZipExtractor.extract(this.tempZipPath, this.localDir);

    // 阶段 3：删除临时 ZIP 文件
    this.deleteFile(this.tempZipPath);
  }

  /**
   * 获取本地 Web 资源入口文件的完整路径
   * @returns 如 '{filesDir}/web-resources/index.html'
   */
  getEntryPath(): string {
    return this.localDir + '/' + INDEX_FILE;
  }

  // ════════════════════════════════════════════════════════════════
  // 私有方法
  // ════════════════════════════════════════════════════════════════

  /**
   * 下载远程 ZIP 文件到本地指定路径
   *
   * @param url      - 远程 ZIP 资源地址
   * @param destPath - 本地保存的完整路径
   */
  private async downloadZip(url: string, destPath: string): Promise<void> {
    const httpRequest = http.createHttp();

    // 监听下载进度
    httpRequest.on('dataReceiveProgress', (data: HttpProgressEvent) => {
      if (this.onProgress && data.totalSize > 0) {
        const pct: number = Math.round((data.receiveSize / data.totalSize) * 100);
        this.onProgress(pct);
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
        throw new Error('资源包下载失败：响应数据为空');
      }

      // 确保缓存目录存在
      this.ensureDir(this.context.cacheDir);

      // 将响应数据写入临时文件
      const arr = new Uint8Array(resp.result as ArrayBuffer);
      const file = fileIo.openSync(destPath,
        fileIo.OpenMode.CREATE | fileIo.OpenMode.WRITE_ONLY);
      try {
        fileIo.writeSync(file.fd, arr.buffer);
      } finally {
        fileIo.closeSync(file);
      }

      // 通知进度 100%
      if (this.onProgress) {
        this.onProgress(100);
      }
    } finally {
      httpRequest.destroy();
    }
  }

  /** 确保目录存在 */
  private ensureDir(dirPath: string): void {
    try {
      fileIo.mkdirSync(dirPath, true);
    } catch (_e) {
      // 已存在则忽略
    }
  }

  /** 删除文件（忽略失败） */
  private deleteFile(path: string): void {
    try {
      fileIo.unlinkSync(path);
    } catch (_e) {
      // 忽略
    }
  }
}
