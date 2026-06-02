/**
 * 版本更新类
 * 负责检查远程 Web 资源版本并执行更新
 */

import { util } from '@kit.ArkTS';
import { FileUtils } from './FileUtils';
import { VersionUtils } from './VersionUtils';
import { VersionUpdateConfig } from '../config/VersionUpdateConfig';

/**
 * 远程版本清单 JSON 数据结构
 */
interface VersionManifest {
  android?: Record<string, string>;
  web?: Record<string, string>;
}

/**
 * 本地持久化的版本信息
 */
interface LocalVersionInfo {
  version: string;
}

export class VersionUpdater {
  private context: Context; // 应用上下文

  /**
   * @param context - 应用上下文
   */
  constructor(context: Context) {
    this.context = context;
  }

  /**
   * 是否有新的 Web 版本
   *
   * @returns 有新版本返回 true，否则返回 false
   */
  async hasNewWebVersion(): Promise<boolean> {
    try {
      const manifest = await this.fetchRemoteManifest();
      const remoteVersion = manifest.web?.['my-home-mobile'];
      if (!remoteVersion) {
        return false;
      }
      const localVersion = this.getLocalWebVersion();
      return VersionUtils.compareVersion(remoteVersion, localVersion) > 0;
    } catch (_e) {
      return false;
    }
  }

  /**
   * 更新 Web 资源：下载远程资源包并解压到本地
   */
  async updateWebResource(): Promise<void> {
    const tempZipPath = this.context.cacheDir + '/update-' + Date.now() + '.zip';

    // 下载 ZIP 到缓存目录
    await FileUtils.downloadFile(VersionUpdateConfig.webResourceZipUrl, tempZipPath);
    // 解压到 Web 资源目录
    await FileUtils.extract(tempZipPath, this.localWebDirPath);
    // 删除临时 ZIP 文件
    FileUtils.delete(tempZipPath);
  }

  /**
   * 获取远程版本清单
   */
  private async fetchRemoteManifest(): Promise<VersionManifest> {
    const result = await FileUtils.fetchFile(VersionUpdateConfig.versionManifestUrl);
    const textDecoder = util.TextDecoder.create('utf-8', { ignoreBOM: true });
    const text = textDecoder.decodeToString(new Uint8Array(result));
    return JSON.parse(text) as VersionManifest;
  }

  /**
   * 获取本地 Web 资源版本号
   */
  private getLocalWebVersion(): string {
    try {
      const content = FileUtils.readText(this.versionFilePath);
      const info: LocalVersionInfo = JSON.parse(content) as LocalVersionInfo;
      return info.version || '0.0.0';
    } catch (_e) {
      return '0.0.0';
    }
  }

  /**
   * 本地 Web 资源根目录（沙箱绝对路径）
   */
  private get localWebDirPath(): string {
    return this.context.filesDir + '/' + VersionUpdateConfig.localWebDir;
  }

  /**
   * 本地版本信息文件完整路径
   */
  private get versionFilePath(): string {
    return this.localWebDirPath + '/' + VersionUpdateConfig.localVersionFile;
  }
}
