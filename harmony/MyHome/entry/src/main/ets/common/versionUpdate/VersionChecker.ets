/**
 * 版本检查模块
 */

import { util } from '@kit.ArkTS';
import { ResourceUtils } from './ResourceUtils';
import {
  VERSION_MANIFEST_URL,
  LOCAL_WEB_DIR,
  LOCAL_VERSION_FILE,
} from '../config/VersionUpdateConfig';

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

export class VersionChecker {
  private context: Context; // 应用上下文

  /**
   * @param context - 应用上下文
   */
  constructor(context: Context) {
    this.context = context;
  }

  /**
   * 检查是否有最新 Web 资源版本
   *
   * @returns 有新版本时返回远程版本号，否则返回 null
   */
  async hasNewWebVersion(): Promise<string | null> {
    try {
      const remoteVersion = await this.fetchRemoteWebVersion();
      const localVersion = this.getLocalWebVersion();
      if (VersionChecker.compareVersion(remoteVersion, localVersion) > 0) {
        return remoteVersion;
      }
      return null;
    } catch (_e) {
      return null;
    }
  }

  /**
   * 语义化版本号比较
   *
   * @param v1 - 版本号 1
   * @param v2 - 版本号 2
   * @returns v1 > v2 返回正数，相等返回 0，v1 < v2 返回负数
   */
  static compareVersion(v1: string, v2: string): number {
    const parts1: number[] = v1.split('.').map(Number);
    const parts2: number[] = v2.split('.').map(Number);
    const maxLen: number = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
      const n1: number = parts1[i] || 0;
      const n2: number = parts2[i] || 0;
      if (n1 !== n2) {
        return n1 - n2;
      }
    }
    return 0;
  }

  /**
   * 获取远程 Web 资源版本号
   */
  private async fetchRemoteWebVersion(): Promise<string> {
    const result = await ResourceUtils.fetch(VERSION_MANIFEST_URL);
    const textDecoder = util.TextDecoder.create('utf-8', { ignoreBOM: true });
    const text = textDecoder.decodeToString(new Uint8Array(result as ArrayBuffer));
    const manifest: VersionManifest = JSON.parse(text) as VersionManifest;
    const version = manifest.web?.['my-home-mobile'];
    if (!version) {
      throw new Error('版本清单中未找到 my-home-mobile 版本信息');
    }
    return version;
  }

  /**
   * 获取本地 Web 资源版本号
   */
  private getLocalWebVersion(): string {
    const versionFilePath = this.context.filesDir + '/' + LOCAL_WEB_DIR + '/' + LOCAL_VERSION_FILE;
    try {
      const content = ResourceUtils.read(versionFilePath);
      const info: LocalVersionInfo = JSON.parse(content) as LocalVersionInfo;
      return info.version || '0.0.0';
    } catch (_e) {
      return '0.0.0';
    }
  }
}
