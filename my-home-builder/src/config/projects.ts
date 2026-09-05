/**
 * 项目配置数据
 * 管理 MyHome 各端项目的构建信息
 */

import type { ProjectConfig } from '@/types/useWebPublish';
import type { Component } from 'vue';

/**
 * 自定义平台图标（SVG，由 unplugin-icons 编译为 Vue 组件）
 * 图标集名称: 'my'，对应 src/assets/icons/ 目录下的 SVG 文件
 */
import IconAndroid from '~icons/my/android';
import IconMobile from '~icons/my/mobile';

/** 版本清单文件路径（相对于 my-home-builder 目录） */
export const VERSION_MANIFEST_PATH = 'versionManifest.json';

/** Web 项目路径（相对于 my-home-builder 目录） */
export const WEB_PROJECT_PATH = 'web/my-home-mobile';

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
    id: 'android-myhome-recipe',
    name: 'MyHomeRecipe',
    platform: 'android',
    platformLabel: 'Android 端',
    manifestKey: 'android.MyHomeRecipe',
    path: '../android/MyHomeRecipe',
    buildCommand: './gradlew assembleRelease',
    outputDir: 'app/build/outputs/apk/release',
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
  {
    id: 'web-myhome-recipe',
    name: 'my-home-recipe',
    platform: 'web',
    platformLabel: 'Web 移动端',
    manifestKey: 'web.my-home-recipe',
    path: '../web/my-home-recipe',
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
  android: 'Android 端',
  web: 'Web 移动端',
};

/**
 * 平台图标映射（自定义 SVG 图标组件）
 * 由 unplugin-icons + FileSystemIconLoader 从 src/assets/icons/ 加载
 */
export const platformIcon: Record<string, Component> = {
  android: IconAndroid,
  web: IconMobile,
};

/** 平台标签颜色映射 */
export const platformColor: Record<string, string> = {
  android: '#67C23A',
  web: '#409EFF',
};
