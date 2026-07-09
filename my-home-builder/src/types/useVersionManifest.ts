/**
 * 版本清单相关类型定义
 */

import type { Ref } from 'vue';
import type { VersionManifest } from './useWebPublish';

/** useVersionManifest Hook 返回值 */
export interface UseVersionManifestReturn {
  /** 版本清单数据 */
  manifest: Ref<VersionManifest>;
  /** 初始化版本清单，从主进程加载 */
  initManifest: () => Promise<void>;
  /** 获取指定项目的版本号 */
  getVersion: (platform: string, projectName: string) => string;
  /** 更新版本清单中指定项目的版本号 */
  updateVersion: (platform: string, projectName: string, version: string) => void;
  /** 同步版本清单到主进程（写入本地 + 上传 OSS） */
  syncManifest: () => Promise<void>;
}
