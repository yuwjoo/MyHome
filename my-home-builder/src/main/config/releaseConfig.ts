/**
 * 发布资源配置
 * 声明各端构建产物在本地的路径及 OSS 上的对象路径
 */
import * as path from "node:path";
import { app } from "electron";

const projectRoot = path.resolve(app.getAppPath(), "..");

const ossRoot = "MyHome";

/** 各端发布产物的 OSS 对象路径 */
export const releaseConfig = {
  /** OSS 上各端发布产物的对象路径 */
  ossAssets: {
    /** 版本清单 */
    manifest: `${ossRoot}/versionManifest.json`,
    /** Android APK */
    android: `${ossRoot}/android/MyHome.zip`,
    /** Web 打包文件 */
    web: `${ossRoot}/web/my-home-mobile.zip`,
    /** 加密凭证文件（私有权限） */
    secret: `${ossRoot}/.secret.zip`,
  },

  /** 各端发布产物的本地绝对路径 */
  localAssets: {
    /** 版本清单 */
    manifest: path.resolve(projectRoot, "versionManifest.json"),
    /** Android 项目 */
    android: {
      /** 项目目录 */
      projectDir: path.resolve(projectRoot, "android/MyHome"),
      /** APK 文件路径 */
      apkPath: path.resolve(projectRoot, "android/MyHome/app/build/outputs/apk/release/app-release.apk"),
    },
    /** Web 打包文件 */
    web: path.resolve(projectRoot, "web/my-home-mobile/dist"),
    /** 凭证目录 */
    secret: path.resolve(projectRoot, ".secret"),
  },
};
