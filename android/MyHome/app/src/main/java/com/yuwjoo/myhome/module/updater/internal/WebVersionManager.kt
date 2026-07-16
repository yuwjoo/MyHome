package com.yuwjoo.myhome.module.updater.internal

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.updater.UpdaterConfig
import com.yuwjoo.myhome.module.updater.utils.FileUtils
import java.io.File

/**
 * Web 版本管理
 */
class WebVersionManager(private val context: Context) {

    companion object {
        private const val TAG = "WebVersionManager"
    }

    private val webStorageDir: File = File(context.filesDir, UpdaterConfig.WEB_ROOT_DIR_NAME) // Web 存储目录

    var currentVersion: String = readCurrentVersion() // 当前已安装的 Web 版本号
        private set

    init {
        webStorageDir.mkdirs()
    }

    /**
     * 读取当前版本
     *
     * @return 版本号，无记录返回空字符串
     */
    private fun readCurrentVersion(): String {
        val versionFile = File(context.filesDir, UpdaterConfig.WEB_VERSION_FILE_PATH)
        return FileUtils.read(versionFile)?.trim() ?: ""
    }

    /**
     * 开始更新 Web 资源
     *
     * @param version    最新版本号
     * @param onProgress 下载进度回调
     */
    suspend fun startUpdate(
        version: String,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) {
        Log.d(TAG, "开始更新 Web 资源: $version")

        val tempCacheFile = File(context.cacheDir, "temp-web-$version.zip")

        // 下载web资源
        FileUtils.download(
            url = UpdaterConfig.WEB_DOWNLOAD_URL,
            destFile = tempCacheFile,
            onProgress = onProgress,
        )

        // 解压到资源目录
        FileUtils.unzip(
            zipFile = tempCacheFile,
            destDir = webStorageDir,
        )

        // 读取当前版本
        currentVersion = readCurrentVersion()

        // 清理临时文件
        tempCacheFile.delete()

        Log.d(TAG, "Web 资源更新完成: $version")
    }
}
