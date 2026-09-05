/**
 * 发布资源配置
 * 声明各端构建产物在本地的路径及 OSS 上的对象路径
 */
import * as path from "node:path";
import { app } from "electron";

const projectRoot = path.resolve(app.getAppPath(), "..");

const ossRoot = "MyHome";

export const releaseConfig = {
  /** OSS资源 */
  ossAssets: {
    /** 版本清单 */
    manifest: `${ossRoot}/versionManifest.json`,
    /** Android 智能家居 App APK */
    android: `${ossRoot}/android/MyHome.zip`,
    /** Android 菜谱 App APK（沿用 MyHome 做法，OSS 上以 .zip 后缀存放） */
    androidRecipe: `${ossRoot}/android/MyHomeRecipe.zip`,
    /** Web 打包文件 */
    web: `${ossRoot}/web/my-home-mobile.zip`,
    /** 菜谱 Web 打包文件 */
    recipeWeb: `${ossRoot}/web/my-home-recipe.zip`,
    /** 加密凭证文件（私有权限） */
    secret: `${ossRoot}/.secret.zip`,
  },

  /** 本地资源 */
  localAssets: {
    /** 版本清单 */
    manifest: path.resolve(projectRoot, "versionManifest.json"),
    /** Android 智能家居项目 */
    android: {
      /** 项目目录 */
      projectDir: path.resolve(projectRoot, "android/MyHome"),
      /** APK 文件路径 */
      apkPath: path.resolve(
        projectRoot,
        "android/MyHome/app/build/outputs/apk/release/app-release.apk",
      ),
      /** Android Studio 自带 JDK（JBR）路径 */
      jdkHome: "D:\\InstallSoftware\\Android\\Android Studio\\jbr",
    },
    /** Android 菜谱项目 */
    androidRecipe: {
      /** 项目目录 */
      projectDir: path.resolve(projectRoot, "android/MyHomeRecipe"),
      /** APK 文件路径 */
      apkPath: path.resolve(
        projectRoot,
        "android/MyHomeRecipe/app/build/outputs/apk/release/app-release.apk",
      ),
      /** Android Studio 自带 JDK（JBR）路径 */
      jdkHome: "D:\\InstallSoftware\\Android\\Android Studio\\jbr",
    },
    /** Web 打包文件 */
    web: path.resolve(projectRoot, "web/my-home-mobile/dist"),
    /** 菜谱 Web 打包文件 */
    recipeWeb: path.resolve(projectRoot, "web/my-home-recipe/dist"),
    /** 凭证目录 */
    secret: path.resolve(projectRoot, ".secret"),
  },
};
