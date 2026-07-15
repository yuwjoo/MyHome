package com.yuwjoo.myhome.module.updater

import android.content.Context
import android.util.Log
import java.io.File

/**
 * Web 版本管理
 */
class WebVersionManager(context: Context) {

    companion object {
        private const val TAG = "WebVersionManager"
    }

    private val webStorageDir: File = File(context.filesDir, UpdaterConfig.WEB_ROOT_DIR_NAME) // Web 存储目录
    private val versionFile: File = File(webStorageDir, UpdaterConfig.WEB_VERSION_FILE_NAME) // Web 版本文件
    private val cacheDir: File = context.cacheDir // 缓存目录

    var currentVersion: String = readVersionFromFile() // 当前已安装的 Web 版本号
        private set

    init {
        webStorageDir.mkdirs()
    }

    /**
     * 从文件读取版本号
     *
     * @return 版本号，无记录返回空字符串
     */
    private fun readVersionFromFile(): String {
        return try {
            if (versionFile.exists()) {
                versionFile.readText().trim()
            } else {
                ""
            }
        } catch (e: Exception) {
            Log.e(TAG, "读取版本文件失败: ${e.message}", e)
            ""
        }
    }

    /**
     * 下载并更新 Web 资源
     *
     * @param version    最新版本号
     * @param onProgress 下载进度回调
     */
    suspend fun downloadUpdate(
        version: String,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) {
        Log.d(TAG, "开始更新 Web 资源: $version")

        val tempDownloadFile = File(cacheDir, "temp-web-$version.zip")

        // 下载 zip
        FileUtils.download(
            url = UpdaterConfig.WEB_DOWNLOAD_URL,
            destPath = tempDownloadFile.absolutePath,
            onProgress = onProgress,
        )

        // 解压到资源目录
        FileUtils.unzip(
            zipPath = tempDownloadFile.absolutePath,
            destDirPath = webStorageDir.absolutePath,
        )

        // 写入版本文件并从文件读取当前版本
        versionFile.writeText(version)
        currentVersion = readVersionFromFile()

        // 清理 zip
        tempDownloadFile.delete()

        Log.d(TAG, "Web 资源更新完成: $version")
    }
}
