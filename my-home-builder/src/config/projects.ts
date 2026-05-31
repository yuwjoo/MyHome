/**
 * 项目配置数据
 * 管理 MyHome 各端项目的构建信息
 */

import type { ProjectConfig } from '@/types/publish';

/** 版本清单文件路径（相对于 my-home-builder 目录） */
export const VERSION_MANIFEST_PATH = '../versionManifest.json';

/** 项目配置列表 */
export const projectList: ProjectConfig[] = [
  {
    id: 'android-myhome',
    name: 'MyHome',
    platform: 'android',
    platformLabel: 'Android 端',
    manifestKey: 'android.MyHome',
    path: '../android/MyHome',
    buildCommand: './gradlew assembleRelease',
    outputDir: 'app/build/outputs/apk/release',
  },
  {
    id: 'harmony-myhome',
    name: 'MyHome',
    platform: 'harmony',
    platformLabel: '鸿蒙端',
    manifestKey: 'harmony.MyHome',
    path: '../harmony/MyHome',
    buildCommand: 'hvigorw assembleHap --mode module -p product=default',
    outputDir: 'entry/build/default/outputs/default',
  },
  {
    id: 'web-myhome',
    name: 'my-home-mobile',
    platform: 'web',
    platformLabel: 'Web 移动端',
    manifestKey: 'web.my-home-mobile',
    path: '../web/my-home-mobile',
    buildCommand: 'npm run build',
    outputDir: 'dist',
  },
];

/** 获取项目配置 */
export const getProjectById = (id: string): ProjectConfig | undefined => {
  return projectList.find((p) => p.id === id);
};

/** 平台中文映射 */
export const platformLabel: Record<string, string> = {
  harmony: '鸿蒙端',
  android: 'Android 端',
  web: 'Web 移动端',
};

/** 平台图标映射（Element Plus 图标名） */
export const platformIcon: Record<string, string> = {
  android: 'Cellphone',
  harmony: 'Phone',
  web: 'Monitor',
};

/** 平台标签颜色映射 */
export const platformColor: Record<string, string> = {
  android: '#67C23A',
  harmony: '#E6A23C',
  web: '#409EFF',
};
