package com.yuwjoo.myhome.module.updater

import android.content.Context
import com.yuwjoo.myhome.config.AppConfig
import java.io.File

/**
 * 更新器配置
 */
object UpdaterConfig {

    // ==================== 远程地址 ====================

    /** 版本清单文件地址 */
    const val VERSION_MANIFEST_URL = AppConfig.VERSION_MANIFEST_URL

    /** Web 资源下载地址 */
    const val WEB_DOWNLOAD_URL = AppConfig.WEB_RESOURCE_URL

    /** 应用 APK 下载地址 */
    const val APP_DOWNLOAD_URL = AppConfig.ANDROID_APK_URL

    // ==================== JSON Key ====================

    /** 清单中 web 字段 key */
    const val MANIFEST_KEY_WEB = AppConfig.MANIFEST_KEY_WEB

    /** 清单中 web 版本 key */
    const val MANIFEST_KEY_WEB_VERSION = AppConfig.MANIFEST_KEY_MY_HOME_MOBILE

    /** 清单中 android 字段 key */
    const val MANIFEST_KEY_ANDROID = AppConfig.MANIFEST_KEY_ANDROID

    /** 清单中 android 版本 key */
    const val MANIFEST_KEY_ANDROID_VERSION = AppConfig.MANIFEST_KEY_ANDROID_MYHOME

    // ==================== 本地路径 ====================

    /** 下载临时目录名称 */
    private const val DOWNLOAD_DIR_NAME = "updater"

    /** Web 资源根目录名称 */
    const val WEB_ROOT_DIR_NAME = "my-home-mobile"

    /** Web 版本记录文件名 */
    const val WEB_VERSION_FILE_NAME = "version.txt"

    /** 下载的 APK 文件名 */
    private const val APK_FILE_NAME = "MyHome.apk"

    /** FileProvider authority */
    const val FILE_PROVIDER_AUTHORITY = AppConfig.FILE_PROVIDER_AUTHORITY

    /**
     * 获取下载临时目录
     *
     * @param context 上下文
     * @return 下载临时目录
     */
    fun getDownloadDir(context: Context): File {
        return File(context.cacheDir, DOWNLOAD_DIR_NAME).also { it.mkdirs() }
    }

    /**
     * 获取 APK 下载目标文件
     *
     * @param context 上下文
     * @return APK 文件
     */
    fun getApkFile(context: Context): File {
        return File(getDownloadDir(context), APK_FILE_NAME)
    }
}
