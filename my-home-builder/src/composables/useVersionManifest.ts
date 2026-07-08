/**
 * 版本清单管理 Hook
 * 通过 bridge 模块读取和更新版本清单
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { VersionManifest, SemanticVersion } from '@/types/useWebPublish';
import type { UseVersionManifestReturn } from '@/types/useVersionManifest';
import { getProjectById } from '@/config/projects';
import { bridge } from '@/module/bridge';

/**
 * 版本清单 Hook
 */
export const useVersionManifest = (): UseVersionManifestReturn => {
  const manifest = ref<VersionManifest>({});
  const latestVersion = ref('0.0.0');
  const loading = ref(false);

  const parseVersion = (version: string): SemanticVersion => {
    const parts = version.split('.').map(Number);
    return {
      major: !isNaN(parts[0]) ? parts[0] : 0,
      minor: !isNaN(parts[1]) ? parts[1] : 0,
      patch: !isNaN(parts[2]) ? parts[2] : 0,
    };
  };

  const getProjectVersion = (projectId: string): string => {
    const project = getProjectById(projectId);
    if (!project) return '0.0.0';

    const [platform, projectName] = project.manifestKey.split('.');
    const version = manifest.value[platform]?.[projectName];
    return version || '0.0.0';
  };

  /**
   * 加载版本清单
   */
  const loadManifest = async () => {
    loading.value = true;
    return new Promise<void>((resolve) => {
      bridge.send('versionManifest', 'getManifest', {}, {
        onSuccess: (data) => {
          manifest.value = data.manifest as VersionManifest;
          loading.value = false;
          resolve();
        },
        onError: (data) => {
          console.warn('读取版本清单失败:', data.message);
          manifest.value = {};
          loading.value = false;
          resolve();
        },
      });
    });
  };

  /**
   * 更新内存中版本清单的指定项目版本号
   */
  const updateVersion = (projectId: string, newVersion: string) => {
    const project = getProjectById(projectId);
    if (!project) {
      ElMessage.error('未找到项目配置');
      return;
    }

    const [platform, projectName] = project.manifestKey.split('.');

    if (!manifest.value[platform]) {
      manifest.value[platform] = {};
    }
    manifest.value[platform][projectName] = newVersion;
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
