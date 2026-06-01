/**
 * 版本更新相关配置
 */

// 远程版本清单文件地址
export const VERSION_MANIFEST_URL: string =
  'https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/versionManifest.json';

// Web 移动端资源 ZIP 包下载地址
export const WEB_RESOURCE_ZIP_URL: string =
  'https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/web/my-home-mobile.zip';

// 本地 Web 资源存放目录名（位于应用沙箱 filesDir 下）
export const LOCAL_WEB_DIR: string = 'web-resources';

// 本地版本信息文件名（存储于 LOCAL_WEB_DIR 中）
export const LOCAL_VERSION_FILE: string = 'metadata.json';
