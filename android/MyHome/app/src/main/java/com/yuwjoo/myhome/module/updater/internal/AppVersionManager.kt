package com.yuwjoo.myhome.module.updater.internal

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.core.content.FileProvider
import com.yuwjoo.myhome.BuildConfig
import com.yuwjoo.myhome.module.updater.UpdaterConfig
import com.yuwjoo.myhome.module.updater.utils.FileUtils
import java.io.File

/**
 * 应用版本管理
 */
class AppVersionManager(private val context: Context) {

    companion object {
        private const val TAG = "AppVersionManager"
    }

    var currentVersion: String = BuildConfig.VERSION_NAME // 当前应用版本号
        private set

    /**
     * 开始更新
     *
     * @param version    最新版本号
     * @param onProgress 下载进度回调
     */
    suspend fun startUpdate(
        version: String,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) {
        Log.d(TAG, "开始下载更新: $version")

        val tempApkFile = File(context.cacheDir, "MyHome-$version.apk")

        FileUtils.download(
            url = UpdaterConfig.APP_DOWNLOAD_URL,
            destFile = tempApkFile,
            onProgress = onProgress,
        )

        Log.d(TAG, "下载完成: ${tempApkFile.absolutePath}")

        installApk(tempApkFile)
    }

    /**
     * 安装 APK
     *
     * @param apkFile APK 文件
     */
    fun installApk(apkFile: File) {
        if (!apkFile.exists()) {
            Log.e(TAG, "APK 文件不存在: ${apkFile.absolutePath}")
            return
        }

        val uri = FileProvider.getUriForFile(
            context,
            "${BuildConfig.APPLICATION_ID}.fileprovider",
            apkFile,
        )

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }

        context.startActivity(intent)
        Log.d(TAG, "启动安装: ${apkFile.absolutePath}")
    }
}
