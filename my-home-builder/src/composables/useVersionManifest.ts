/**
 * 版本清单管理 Hook
 * 通过 bridge 模块读取和更新版本清单
 */
import { ref } from 'vue';
import type { VersionManifest } from '@/types/useWebPublish';
import type { UseVersionManifestReturn } from '@/types/useVersionManifest';
import { bridge } from '@/module/bridge';

/**
 * 版本清单 Hook
 */
export const useVersionManifest = (): UseVersionManifestReturn => {
  const manifest = ref<VersionManifest>({});

  /**
   * 初始化版本清单：从主进程加载。
   * 加载状态由调用方自行管理。
   */
  const initManifest = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      bridge.send('versionManifest', 'getManifest', {}, {
        onSuccess: (data) => {
          manifest.value = data.manifest as VersionManifest;
          resolve();
        },
        onError: (data) => {
          console.warn('读取版本清单失败:', data.message);
          manifest.value = {};
          resolve();
        },
      });
    });
  };

  /**
   * 获取指定项目的版本号
   * @param platform 项目端，如 'android'、'web'
   * @param projectName 项目名称，如 'MyHome'、'my-home-mobile'
   */
  const getVersion = (platform: string, projectName: string): string => {
    return manifest.value[platform]?.[projectName] || '0.0.0';
  };

  /**
   * 更新内存中版本清单的指定项目版本号
   * @param platform 项目端，如 'android'、'web'
   * @param projectName 项目名称，如 'MyHome'、'my-home-mobile'
   * @param version 新版本号
   */
  const updateVersion = (platform: string, projectName: string, version: string): void => {
    if (!manifest.value[platform]) {
      manifest.value[platform] = {};
    }
    manifest.value[platform][projectName] = version;
  };

  /**
   * 同步版本清单到主进程（写入本地文件 + 上传 OSS）
   */
  const syncManifest = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      bridge.send('versionManifest', 'publishManifest', { manifest: manifest.value }, {
        onSuccess: () => {
          resolve();
        },
        onError: (data) => {
          reject(new Error(data.message));
        },
      });
    });
  };

  return {
    manifest,
    initManifest,
    getVersion,
    updateVersion,
    syncManifest,
  };
};
