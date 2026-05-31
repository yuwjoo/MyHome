/**
 * 项目配置数据
 * 管理 MyHome 各端项目的构建信息
 */

import type { ProjectConfig } from '@/types/publish';

/** 项目配置列表 */
export const projectList: ProjectConfig[] = [
  {
    id: 'harmony-myhome',
    name: 'MyHome 鸿蒙端',
    platform: 'harmony',
    path: '../harmony/MyHome',
    buildCommand: 'hvigorw assembleHap --mode module -p product=default',
    outputDir: 'entry/build/default/outputs/default',
  },
  {
    id: 'android-myhome',
    name: 'MyHome Android 端',
    platform: 'android',
    path: '../android/MyHome',
    buildCommand: './gradlew assembleRelease',
    outputDir: 'app/build/outputs/apk/release',
  },
  {
    id: 'ios-myhome',
    name: 'MyHome iOS 端',
    platform: 'ios',
    path: '../ios/MyHome',
    buildCommand: 'xcodebuild -workspace MyHome.xcworkspace -scheme MyHome archive',
    outputDir: 'build/ios/ipa',
  },
  {
    id: 'web-myhome',
    name: 'MyHome Web 端',
    platform: 'web',
    path: '../web/my-home-web',
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
  harmony: '鸿蒙',
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
};
