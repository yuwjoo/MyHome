/**
 * 版本更新相关配置
 */
export class VersionUpdateConfig {

  /** 远程版本清单文件地址 */
  static readonly versionManifestUrl: string =
    'https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/versionManifest.json';

  /** Web 移动端资源 ZIP 包下载地址 */
  static readonly webResourceZipUrl: string =
    'https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/web/my-home-mobile.zip';

  /** 本地 Web 资源存放目录名（位于应用沙箱 filesDir 下） */
  static readonly localWebDir: string = 'web-resources';

  /** 本地版本信息文件名（存储于 localWebDir 中） */
  static readonly localVersionFile: string = 'metadata.json';
}
