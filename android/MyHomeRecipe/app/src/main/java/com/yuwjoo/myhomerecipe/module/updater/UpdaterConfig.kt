package com.yuwjoo.myhomerecipe.module.updater

import com.yuwjoo.myhomerecipe.config.AppConfig

/**
 * 更新模块配置
 *
 * updater 是独立业务模块，通过本类引用全局 [AppConfig]，
 * 使模块内部不直接依赖全局配置对象，便于日后整体复用/迁移。
 */
object UpdaterConfig {

    // ==================== 远程地址 ====================

    const val VERSION_MANIFEST_URL = AppConfig.VERSION_MANIFEST_URL

    const val WEB_DOWNLOAD_URL = AppConfig.WEB_RESOURCE_URL

    const val APP_DOWNLOAD_URL = AppConfig.APP_DOWNLOAD_URL

    // ==================== 版本清单 key ====================
    // 远端 versionManifest.json 结构示例：
    // { "android": { "MyHomeRecipe": "0.0.1" }, "web": { "my-home-recipe": "0.0.2" } }

    const val MANIFEST_SECTION_WEB = "web"

    const val MANIFEST_SECTION_ANDROID = "android"

    const val MANIFEST_KEY_WEB = AppConfig.WEB_PRODUCT_NAME

    const val MANIFEST_KEY_ANDROID = AppConfig.APP_PRODUCT_NAME

    // ==================== 本地 Web 资源 ====================

    /** 本地资源根目录（filesDir 下） */
    const val WEB_ROOT_DIR_NAME = AppConfig.WEB_ROOT_DIR_NAME

    /** 版本记录文件（目录内） */
    const val WEB_METADATA_FILE_NAME = AppConfig.METADATA_FILE_NAME

    /** assets 内置占位页目录 */
    const val SEED_ASSET_DIR = AppConfig.SEED_ASSET_DIR

    /** 占位页版本号 */
    const val SEED_VERSION = AppConfig.SEED_VERSION

    /** Web zip 临时下载文件名（cacheDir 下） */
    const val WEB_ZIP_TEMP_FILE_NAME = "recipe-web.zip"

    /** Web 解压暂存目录名（cacheDir 下，用于原子切换） */
    const val WEB_STAGING_DIR_NAME = "recipe-web-staging"

    // ==================== App 更新 ====================

    /** APK 临时下载文件名（cacheDir 下，%s 为版本号） */
    const val APK_TEMP_FILE_NAME = "MyHomeRecipe-%s.apk"
}
