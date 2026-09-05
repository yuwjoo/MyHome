package com.yuwjoo.myhomerecipe.module.updater.internal

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.core.content.FileProvider
import com.yuwjoo.myhomerecipe.BuildConfig
import com.yuwjoo.myhomerecipe.config.AppConfig
import com.yuwjoo.myhomerecipe.module.updater.UpdaterConfig
import com.yuwjoo.myhomerecipe.module.updater.utils.FileUtils
import java.io.File
import java.util.Locale

/**
 * 应用版本管理（APK 自更新）
 */
class AppVersionManager(context: Context) {

    companion object {
        private const val TAG = "AppVersionManager"
    }

    private val appContext = context.applicationContext

    /** 当前应用版本号（来自构建配置） */
    val currentVersion: String = BuildConfig.VERSION_NAME

    /**
     * 下载新版本 APK 并拉起系统安装器
     *
     * @param version    目标版本号
     * @param onProgress 下载进度回调
     */
    suspend fun startUpdate(
        version: String,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) {
        Log.i(TAG, "开始下载应用更新: $version")

        val tempApk = File(
            appContext.cacheDir,
            String.format(Locale.US, UpdaterConfig.APK_TEMP_FILE_NAME, version),
        )

        FileUtils.download(
            url = UpdaterConfig.APP_DOWNLOAD_URL,
            destFile = tempApk,
            onProgress = onProgress,
        )

        Log.i(TAG, "APK 下载完成: ${tempApk.absolutePath}")
        installApk(tempApk)
    }

    /**
     * 通过 FileProvider 拉起系统安装器安装 APK
     */
    private fun installApk(apkFile: File) {
        if (!apkFile.isFile) {
            Log.e(TAG, "APK 文件不存在: ${apkFile.absolutePath}")
            return
        }

        val uri: Uri = FileProvider.getUriForFile(appContext, AppConfig.FILE_PROVIDER_AUTHORITY, apkFile)

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }

        appContext.startActivity(intent)
        Log.i(TAG, "已拉起系统安装器: ${apkFile.absolutePath}")
    }
}
