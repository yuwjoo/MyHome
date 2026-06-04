/**
 * 版本清单相关类型定义
 */

import type { Ref } from 'vue';
import type { VersionManifest, SemanticVersion } from './publish';

/** useVersionManifest Hook 返回值 */
export interface UseVersionManifestReturn {
  /** 版本清单数据 */
  manifest: Ref<VersionManifest>;
  /** 当前选中项目的最新版本号 */
  latestVersion: Ref<string>;
  /** 是否正在加载 */
  loading: Ref<boolean>;
  /** 加载版本清单 */
  loadManifest: () => Promise<void>;
  /** 更新版本清单中指定项目的版本号 */
  updateVersion: (projectId: string, newVersion: string) => Promise<void>;
  /** 解析版本号字符串为三段数字 */
  parseVersion: (version: string) => SemanticVersion;
  /** 获取指定项目在版本清单中的版本号 */
  getProjectVersion: (projectId: string) => string;
}
