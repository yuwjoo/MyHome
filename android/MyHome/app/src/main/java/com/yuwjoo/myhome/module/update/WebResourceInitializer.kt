package com.yuwjoo.myhome.module.update

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.content.FileProvider
import com.yuwjoo.myhome.config.AppConfig
import com.yuwjoo.myhome.ui.DialogHelper
import com.yuwjoo.myhome.ui.webview.WebResourceManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Web 资源初始化器
 *
 * 负责应用启动时的 Web 资源初始化流程：
 * 1. 检查本地是否有 Web 资源 -> 无则自动下载（带进度展示，无需询问）
 * 2. 下载 zip 包
 * 3. 解压到本地
 * 4. 版本检查与自动更新（有更新时询问用户）
 *
 * 所有异步操作通过协程在 IO/MAIN 线程间切换。
 */
object WebResourceInitializer {

    private const val TAG = "WebResourceInitializer"

    /**
     * 初始化回调接口
     */
    interface Callback {
        /** Web 资源准备就绪（首次下载完成或确认本地资源可用） */
        fun onResourcesReady()

        /** 初始化失败 */
        fun onError(message: String)
    }

    /**
     * 执行完整的 Web 资源初始化流程
     *
     * 在 MainActivity 的 onCreate 中调用。
     *
     * @param activity 当前 Activity
     * @param scope 协程作用域（通常绑定到 Activity 生命周期）
     * @param callback 初始化结果回调
     */
    fun initialize(activity: Activity, scope: CoroutineScope, callback: Callback) {
        // 开发环境：跳过所有更新检查，直接通知资源就绪
        if (AppConfig.isDebug) {
            Log.d(TAG, "开发环境，跳过所有更新检查")
            callback.onResourcesReady()
            return
        }

        scope.launch(Dispatchers.Main) {
            try {
                Log.d(TAG, "开始 Web 资源初始化")

                // 步骤 1: 检查本地 Web 资源是否存在
                val hasResources = WebResourceManager.hasLocalResources(activity)

                if (!hasResources) {
                    // 首次安装，无本地资源 -> 自动开始下载，不询问用户
                    Log.d(TAG, "本地无 Web 资源，自动开始下载（首次安装）")
                    downloadAndInstall(activity, callback)
                } else {
                    // 已有本地资源，检查版本更新
                    Log.d(TAG, "本地已有 Web 资源，检查版本更新")
                    checkAndUpdate(activity, callback)
                }
            } catch (e: Exception) {
                Log.e(TAG, "初始化异常: ${e.message}", e)
                callback.onError(e.message ?: "初始化失败")
            }
        }
    }

    /**
     * 下载 zip 包并解压到本地
     *
     * 显示带进度条的对话框，实时展示下载进度。
     */
    private suspend fun downloadAndInstall(activity: Activity, callback: Callback) {
        // 显示带进度条的对话框
        val progressHandle = DialogHelper.showProgressDialog(activity, "正在下载资源")

        try {
            // 下载 zip 文件到临时目录
            val zipFile = File(activity.cacheDir, AppConfig.ZIP_FILE_NAME)
            Log.d(TAG, "下载 zip 到: ${zipFile.absolutePath}")

            // 带进度回调的下载
            FileDownloader.download(
                url = AppConfig.WEB_RESOURCE_URL,
                destFile = zipFile,
                onProgress = { downloaded, total ->
                    // 在 UI 线程更新进度
                    progressHandle.updateProgress(downloaded, total)
                }
            )

            // 更新对话框状态为解压
            withContext(Dispatchers.Main) {
                progressHandle.setMessage("正在解压资源，请稍候...")
                // 进度条设为不确定模式（解压无法准确获知进度）
                progressHandle.setIndeterminate()
            }

            // 解压到 filesDir
            val destDir = WebResourceManager.getWebRootDir(activity)
            ZipExtractor.extract(zipFile, destDir)

            // 删除临时 zip 文件
            zipFile.delete()
            Log.d(TAG, "已删除临时 zip 文件")

            // 关闭进度对话框
            withContext(Dispatchers.Main) {
                progressHandle.dismiss()
            }

            // 通知回调
            callback.onResourcesReady()
            Log.d(TAG, "Web 资源下载安装完成")
        } catch (e: Exception) {
            Log.e(TAG, "下载安装失败: ${e.message}", e)
            // 清理残留的临时 zip 文件
            val zipFile = File(activity.cacheDir, AppConfig.ZIP_FILE_NAME)
            if (zipFile.exists()) {
                zipFile.delete()
                Log.d(TAG, "已清理残留的临时 zip 文件")
            }
            withContext(Dispatchers.Main) {
                progressHandle.dismiss()
                DialogHelper.showErrorDialog(
                    activity,
                    "下载 Web 资源失败: ${e.message}\n请检查网络连接后重试。"
                ) {
                    callback.onError(e.message ?: "下载失败")
                }
            }
        }
    }

    /**
     * 检查版本更新，如有新版本则直接静默更新，并检查 Android APK 更新
     */
    private suspend fun checkAndUpdate(
        activity: Activity,
        callback: Callback
    ) {
        val localVersion = WebResourceManager.getLocalVersion(activity)
        Log.d(TAG, "本地 Web 版本: ${localVersion ?: "未知"}")

        val result = VersionChecker.checkForUpdate(localVersion)

        when (result) {
            is VersionChecker.VersionCheckResult.UpToDate -> {
                Log.d(TAG, "已是最新 Web 版本")
                checkAndroidUpdate(activity, result.androidVersion)
                callback.onResourcesReady()
            }

            is VersionChecker.VersionCheckResult.UpdateAvailable -> {
                Log.d(TAG, "发现新 Web 版本: ${result.remoteVersion}，直接开始更新")
                downloadAndInstall(activity, callback)
                checkAndroidUpdate(activity, result.androidVersion)
            }

            is VersionChecker.VersionCheckResult.Error -> {
                Log.w(TAG, "版本检查失败: ${result.message}，使用本地版本")
                callback.onResourcesReady()
            }
        }
    }

    /**
     * 检查 Android APK 版本是否需要更新
     *
     * @param androidVersion 从 versionManifest.json 已解析的 android.MyHome 版本号，null 表示无 Android 版本信息
     */
    private suspend fun checkAndroidUpdate(activity: Activity, androidVersion: String?) {
        if (androidVersion == null) {
            return
        }

        try {
            val currentVersion = getAppVersion(activity)
            Log.d(TAG, "当前 App 版本: $currentVersion, 远程 Android 版本: $androidVersion")

            if (VersionChecker.compareVersions(androidVersion, currentVersion) > 0) {
                Log.d(TAG, "发现新 Android 版本，提示用户更新")
                withContext(Dispatchers.Main) {
                    DialogHelper.showUpdateDialog(
                        activity = activity,
                        newVersion = androidVersion,
                        onConfirm = {
                            CoroutineScope(Dispatchers.Main).launch {
                                downloadAndInstallApk(activity)
                            }
                        },
                        onSkip = { /* 用户跳过 */ },
                    )
                }
            } else {
                Log.d(TAG, "已是最新 App 版本")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Android 版本检查异常: ${e.message}")
        }
    }

    // ──────────────────────────────────────────────
    // APK 下载 & 安装
    // ──────────────────────────────────────────────

    /**
     * 下载并安装 APK
     *
     * 1. 下载 OSS 上的 MyHome.zip 到 cacheDir
     * 2. 重命名为 MyHome.apk
     * 3. 通过 FileProvider 获取 content URI 发起系统安装
     */
    private suspend fun downloadAndInstallApk(activity: Activity) {
        val progressHandle = DialogHelper.showProgressDialog(activity, "正在下载新版本")

        try {
            // 下载 APK（实际后缀为 .zip）
            val tempFile = File(activity.cacheDir, AppConfig.APK_TEMP_NAME)
            FileDownloader.download(
                url = AppConfig.ANDROID_APK_URL,
                destFile = tempFile,
                onProgress = { downloaded, total ->
                    progressHandle.updateProgress(downloaded, total)
                },
            )

            // 重命名 .zip → .apk
            val apkFile = File(activity.cacheDir, AppConfig.APK_FILE_NAME)
            if (apkFile.exists()) apkFile.delete()
            if (!tempFile.renameTo(apkFile)) {
                throw Exception("文件重命名失败")
            }

            Log.d(TAG, "APK 下载完成: ${apkFile.absolutePath}")

            withContext(Dispatchers.Main) {
                progressHandle.dismiss()
                installApk(activity, apkFile)
            }
        } catch (e: Exception) {
            Log.e(TAG, "APK 下载失败: ${e.message}", e)
            // 清理残留的临时文件
            val tempFile = File(activity.cacheDir, AppConfig.APK_TEMP_NAME)
            if (tempFile.exists()) tempFile.delete()
            val apkFile = File(activity.cacheDir, AppConfig.APK_FILE_NAME)
            if (apkFile.exists()) apkFile.delete()
            withContext(Dispatchers.Main) {
                progressHandle.dismiss()
                DialogHelper.showErrorDialog(
                    activity,
                    "下载新版本失败: ${e.message}\n请检查网络连接后重试。",
                )
            }
        }
    }

    /**
     * 调用系统安装器安装 APK
     */
    private fun installApk(activity: Activity, apkFile: File) {
        try {
            val apkUri: Uri = FileProvider.getUriForFile(
                activity,
                AppConfig.FILE_PROVIDER_AUTHORITY,
                apkFile,
            )

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
            }

            // Android 8.0+ 需要允许安装未知来源
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!activity.packageManager.canRequestPackageInstalls()) {
                    val unknownSourceIntent = Intent(
                        android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:${activity.packageName}"),
                    )
                    activity.startActivity(unknownSourceIntent)
                    return
                }
            }

            activity.startActivity(intent)
            Log.d(TAG, "已发起 APK 安装")
        } catch (e: Exception) {
            Log.e(TAG, "安装 APK 失败: ${e.message}", e)
            DialogHelper.showErrorDialog(activity, "安装 APK 失败: ${e.message}")
        }
    }

    // ──────────────────────────────────────────────
    // 工具方法
    // ──────────────────────────────────────────────

    /**
     * 获取当前 App 版本号
     */
    private fun getAppVersion(activity: Activity): String {
        return try {
            val pInfo: PackageInfo = activity.packageManager.getPackageInfo(
                activity.packageName, 0
            )
            pInfo.versionName ?: "0.0.0"
        } catch (e: PackageManager.NameNotFoundException) {
            Log.w(TAG, "获取 App 版本失败: ${e.message}")
            "0.0.0"
        }
    }
}
