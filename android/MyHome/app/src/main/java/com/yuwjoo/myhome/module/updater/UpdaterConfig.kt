package com.yuwjoo.myhome.module.updater

import com.yuwjoo.myhome.config.AppConfig

/**
 * 更新器配置
 */
object UpdaterConfig {
    const val VERSION_MANIFEST_URL = AppConfig.VERSION_MANIFEST_URL // 版本清单文件地址
    const val WEB_DOWNLOAD_URL = AppConfig.WEB_RESOURCE_URL // Web 资源下载地址
    const val APP_DOWNLOAD_URL = AppConfig.ANDROID_APK_URL // 应用 APK 下载地址

    const val WEB_ROOT_DIR_NAME = AppConfig.MANIFEST_KEY_MY_HOME_MOBILE // Web 资源根目录名称
    const val WEB_VERSION_FILE_PATH = "$WEB_ROOT_DIR_NAME/metadata.json" // Web 版本记录文件路径
}
