/**
 * 版本清单管理 Hook
 * 读取和更新 myhome 目录下的版本清单 JSON 文件
 */

import { ref, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { VersionManifest, SemanticVersion } from '@/types/publish';
import { getProjectById, VERSION_MANIFEST_PATH } from '@/config/projects';

/** 版本清单 Hook 返回值 */
interface UseVersionManifestReturn {
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

/**
 * 版本清单 Hook
 * 封装版本清单的读取、解析和更新逻辑
 */
export const useVersionManifest = (): UseVersionManifestReturn => {
  const manifest = ref<VersionManifest>({});
  const latestVersion = ref('0.0.0');
  const loading = ref(false);

  /** 解析版本号字符串 */
  const parseVersion = (version: string): SemanticVersion => {
    const parts = version.split('.').map(Number);
    return {
      major: !isNaN(parts[0]) ? parts[0] : 0,
      minor: !isNaN(parts[1]) ? parts[1] : 0,
      patch: !isNaN(parts[2]) ? parts[2] : 0,
    };
  };

  /** 获取指定项目在版本清单中的版本号 */
  const getProjectVersion = (projectId: string): string => {
    const project = getProjectById(projectId);
    if (!project) return '0.0.0';

    const [platform, projectName] = project.manifestKey.split('.');
    const version = manifest.value[platform]?.[projectName];
    return version || '0.0.0';
  };

  /** 加载版本清单 */
  const loadManifest = async () => {
    loading.value = true;
    try {
      const content = await window.electronAPI.readFile(VERSION_MANIFEST_PATH);
      manifest.value = JSON.parse(content);
    } catch (err) {
      console.warn('读取版本清单失败:', err);
      manifest.value = {};
    } finally {
      loading.value = false;
    }
  };

  /** 更新版本清单中指定项目的版本号 */
  const updateVersion = async (projectId: string, newVersion: string) => {
    const project = getProjectById(projectId);
    if (!project) {
      ElMessage.error('未找到项目配置');
      return;
    }

    const [platform, projectName] = project.manifestKey.split('.');

    // 确保清单中存在对应结构
    if (!manifest.value[platform]) {
      manifest.value[platform] = {};
    }
    manifest.value[platform][projectName] = newVersion;

    try {
      await window.electronAPI.writeFile(
        VERSION_MANIFEST_PATH,
        JSON.stringify(manifest.value, null, 2),
      );
      ElMessage.success('版本清单已更新');
    } catch (err) {
      ElMessage.error('更新版本清单失败');
      console.error(err);
    }
  };

  return {
    manifest,
    latestVersion,
    loading,
    loadManifest,
    updateVersion,
    parseVersion,
    getProjectVersion,
  };
};
