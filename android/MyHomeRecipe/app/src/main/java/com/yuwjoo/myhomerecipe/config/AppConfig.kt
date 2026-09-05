package com.yuwjoo.myhomerecipe.config

import com.yuwjoo.myhomerecipe.BuildConfig

/**
 * 应用全局配置（单一配置入口）
 *
 * 本项目是「菜谱」Web 应用（web/my-home-recipe）的 Android 外壳：
 * 宿主 Activity 内嵌一个 WebView，页面资源以 zip 形式托管在远程，
 * 由 updater 模块下载到本地后离线加载。
 *
 * 所有环境开关、远程地址、产品命名、本地路径都集中在这里，
 * 修改配置时不需要改动任何业务代码。
 */
object AppConfig {

    // ==================== 环境 ====================

    /** 是否为正式发布版本（由 buildType 注入） */
    val IS_RELEASE: Boolean
        get() = BuildConfig.IS_RELEASE

    /** 是否为开发环境 */
    val IS_DEV: Boolean = !IS_RELEASE

    // ==================== 远程资源地址 ====================

    /** OSS 仓库根目录 */
    private const val OSS_BASE_URL =
        "https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/MyHome"

    /** 版本清单：记录各端（web / android）最新版本号 */
    const val VERSION_MANIFEST_URL = "$OSS_BASE_URL/versionManifest.json"

    /** 菜谱 Web 资源 zip 包（解压后根目录应包含 index.html） */
    const val WEB_RESOURCE_URL = "$OSS_BASE_URL/web/my-home-recipe.zip"

    /** Android 安装包。OSS 上传时若强制改后缀，请同步修正此地址 */
    const val APP_DOWNLOAD_URL = "$OSS_BASE_URL/android/MyHomeRecipe.apk"

    // ==================== 产品命名（三处必须一致） ====================
    // 约定：版本清单中 web 段的 key、OSS zip 包名、本地资源目录名
    //       以及 WebView 本地虚拟域名，全部使用 WEB_PRODUCT_NAME。

    /** 菜谱 Web 资源的产品名 */
    const val WEB_PRODUCT_NAME = "my-home-recipe"

    /** Android 应用在版本清单 android 段下的 key */
    const val APP_PRODUCT_NAME = "MyHomeRecipe"

    // ==================== 本地 Web 资源 ====================

    /** 本地 Web 资源根目录名（位于 filesDir 下） */
    const val WEB_ROOT_DIR_NAME = WEB_PRODUCT_NAME

    /** 本地 Web 资源版本记录文件名（由 updater 写入，遵循 web 侧 metadata.json 约定） */
    const val METADATA_FILE_NAME = "metadata.json"

    /** assets 内置占位页目录（首次安装且尚未下载到正式资源前使用） */
    const val SEED_ASSET_DIR = "web"

    /** 内置占位页的版本号：必须小于任何正式版本，保证首次联网后必定触发更新 */
    const val SEED_VERSION = "0.0.0"

    // ==================== WebView ====================

    /** 本地虚拟域名协议（正式环境） */
    const val LOCAL_RESOURCE_PROTOCOL = "https"

    /** 本地虚拟域名（正式环境），由 WebViewAssetLoader 拦截并映射到本地文件 */
    const val LOCAL_RESOURCE_HOST = WEB_PRODUCT_NAME

    /**
     * 开发环境页面地址。
     * - Android 模拟器访问宿主机：10.0.2.2
     * - 真机调试：改为电脑在局域网中的 IP
     */
    const val DEV_WEB_URL = "http://10.0.2.2:5173"

    /** 按两次返回键退出应用的间隔（毫秒） */
    const val EXIT_INTERVAL_MS = 2000L

    // ==================== FileProvider ====================

    /** 用于向系统安装器共享 APK 的 authority（需与 AndroidManifest 中一致） */
    const val FILE_PROVIDER_AUTHORITY = "com.yuwjoo.myhomerecipe.fileprovider"
}
