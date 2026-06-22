package com.yuwjoo.myhome.config

import com.yuwjoo.myhome.BuildConfig

/**
 * 应用全局配置常量
 *
 * 集中管理所有远程资源 URL、本地存储路径、虚拟域名等配置项，
 * 方便后续维护和修改。
 */
object AppConfig {

    // ==================== 环境判断 ====================

    /** 是否为正式发布版本（仅 release buildType 为 true） */
    val isRelease: Boolean
        get() = BuildConfig.IS_RELEASE

    /** 是否为开发环境（debug buildType） */
    val isDebug: Boolean
        get() = !BuildConfig.IS_RELEASE

    // ==================== 远程资源地址 ====================

    /** Web 资源 zip 包下载地址 */
    const val WEB_RESOURCE_URL =
        "https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/web/my-home-mobile.zip"

    /** 版本清单文件地址 */
    const val VERSION_MANIFEST_URL =
        "https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/versionManifest.json"

    /** Android APK 下载地址（OSS 上传时后缀为 .zip） */
    const val ANDROID_APK_URL =
        "https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome/android/MyHome.zip"

    // ==================== 本地存储 ====================

    /** 本地 Web 资源根目录名称 */
    const val WEB_ROOT_DIR_NAME = "my-home-mobile"

    /** 下载的 zip 文件临时名称 */
    const val ZIP_FILE_NAME = "my-home-mobile.zip"

    /** Android APK 下载临时文件名（下载时后缀为 .zip，安装前改为 .apk） */
    const val APK_TEMP_NAME = "MyHome.zip"
    const val APK_FILE_NAME = "MyHome.apk"

    // ==================== WebView 加载地址 ====================

    /** WebView 加载的本地虚拟域名（正式环境） */
    const val LOCAL_WEB_HOST = "http://local-web"

    /** WebView 加载的开发服务器地址（开发环境） */
    const val DEV_WEB_URL = "http://47.115.161.79:5173"

    /**
     * 根据环境返回 WebView 加载地址
     * - 正式环境：返回本地虚拟域名 [LOCAL_WEB_HOST]
     * - 开发环境：返回远程开发服务器地址 [DEV_WEB_URL]
     */
    val webLoadUrl: String
        get() = if (isDebug) DEV_WEB_URL else LOCAL_WEB_HOST

    // ==================== 元数据文件 ====================

    /** 本地 Web 资源的版本元数据文件名 */
    const val METADATA_FILE_NAME = "metadata.json"

    // ==================== 版本清单 JSON Key ====================

    /** versionManifest.json 中 web 资源的 key */
    const val MANIFEST_KEY_WEB = "web"

    /** versionManifest.json 中 my-home-mobile 的 key */
    const val MANIFEST_KEY_MY_HOME_MOBILE = "my-home-mobile"

    /** versionManifest.json 中 android 资源的 key */
    const val MANIFEST_KEY_ANDROID = "android"

    /** versionManifest.json 中 android.MyHome 的 key */
    const val MANIFEST_KEY_ANDROID_MYHOME = "MyHome"

    // ==================== FileProvider ====================

    /** FileProvider authority */
    const val FILE_PROVIDER_AUTHORITY = "com.yuwjoo.myhome.fileprovider"
}
