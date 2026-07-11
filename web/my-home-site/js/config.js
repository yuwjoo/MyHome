/**
 * 应用配置 - 统一管理所有外链地址
 */
var AppConfig = {
  /** OSS 存储根路径 */
  ossBase: 'https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome',

  /** 版本清单地址 */
  get manifestUrl() {
    return this.ossBase + '/versionManifest.json';
  },

  /** APK 下载地址（远端 .zip，本地保存为 .apk） */
  get apkUrl() {
    return this.ossBase + '/android/MyHome.zip';
  },

  /** 联系邮箱 */
  contactEmail: 'mailto:1191759350@qq.com',
};
