/**
 * Web 资源更新模块
 */

import { fileIo } from '@kit.CoreFileKit';
import { ResourceUtils } from './ResourceUtils';
import { LogUtils } from '../../utils/LogUtils';
import { UpdateStatus } from './UpdateStatus';
import {
  WEB_RESOURCE_ZIP_URL,
  LOCAL_WEB_DIR,
  LOCAL_VERSION_FILE,
  TEMP_ZIP_FILE,
} from '../config/VersionUpdateConfig';

const TAG = 'WebResourceUpdater';

/**
 * 本地持久化的版本信息
 */
interface LocalVersionInfo {
  version: string;
}

export class WebResourceUpdater {
  private context: Context; // 应用上下文
  onStatusChange?: (status: UpdateStatus, message: string) => void; // 状态变化回调
  onProgress?: (percent: number) => void; // 下载进度回调

  /**
   * @param context - 应用上下文
   */
  constructor(context: Context) {
    this.context = context;
  }

  /**
   * 下载并更新 Web 资源到本地
   *
   * @param version - 新版本号
   */
  async update(version: string): Promise<void> {
    LogUtils.info(TAG, `update start, version: %{public}s`, version);

    this.notifyStatus(UpdateStatus.DOWNLOADING,
      `发现新版本 ${version}，正在下载更新包...`);

    await ResourceUtils.download(
      WEB_RESOURCE_ZIP_URL,
      this.tempZipPath,
      (pct: number) => {
        if (this.onProgress) {
          this.onProgress(pct);
        }
      },
    );

    this.notifyStatus(UpdateStatus.EXTRACTING, '正在解压资源文件...');
    await ResourceUtils.extract(this.tempZipPath, this.localWebDir);

    this.notifyStatus(UpdateStatus.CLEANING, '正在清理临时文件...');
    this.saveLocalVersion(version);
    ResourceUtils.delete(this.tempZipPath);

    LogUtils.info(TAG, 'update success');
  }

  /**
   * 获取本地 Web 资源版本号
   *
   * @returns 版本号字符串，不存在则返回 "0.0.0"
   */
  getLocalVersion(): string {
    try {
      const content = fileIo.readTextSync(this.versionFilePath);
      const info: LocalVersionInfo = JSON.parse(content) as LocalVersionInfo;
      return info.version || '0.0.0';
    } catch (_e) {
      return '0.0.0';
    }
  }

  /**
   * 本地 Web 资源根目录（沙箱绝对路径）
   */
  private get localWebDir(): string {
    return this.context.filesDir + '/' + LOCAL_WEB_DIR;
  }

  /**
   * 本地版本信息文件完整路径
   */
  private get versionFilePath(): string {
    return this.localWebDir + '/' + LOCAL_VERSION_FILE;
  }

  /**
   * ZIP 临时下载路径（位于 cacheDir，用完即删）
   */
  private get tempZipPath(): string {
    return this.context.cacheDir + '/' + TEMP_ZIP_FILE;
  }

  /**
   * 保存本地 Web 资源版本号
   *
   * @param version - 版本号字符串
   */
  private saveLocalVersion(version: string): void {
    try {
      fileIo.mkdirSync(this.localWebDir, true);
    } catch (_e) {
      // 目录已存在则忽略
    }

    const info: LocalVersionInfo = { version };
    fileIo.writeTextSync(this.versionFilePath, JSON.stringify(info));

    LogUtils.info(TAG, 'saveLocalVersion: %{public}s', version);
  }

  /**
   * 通知状态变化
   */
  private notifyStatus(status: UpdateStatus, message: string): void {
    LogUtils.info(TAG, `[%{public}s] %{public}s`, status, message);
    if (this.onStatusChange) {
      this.onStatusChange(status, message);
    }
  }
}
