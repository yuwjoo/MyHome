package com.yuwjoo.myhome.common

import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.text.DecimalFormat

/**
 * 更新检查器，负责检查应用更新、下载更新包并安装
 */
class UpdateChecker {
    companion object {
        private const val TAG = "UpdateChecker"
        private const val VERSION_JSON_URL = "https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/myHome/MyHomeAPP/AppManifest.json"
        private const val APK_DOWNLOAD_URL = "https://yuwjoo-private-cloud-storage.oss-cn-shenzhen.aliyuncs.com/myHome/MyHomeAPP/app-release.zip"

        /**
         * 检查应用更新
         * @param context 上下文
         * @param onUpdateChecked 检查结果回调
         */
        fun checkForUpdates(context: Context, onUpdateChecked: ((Boolean, String?) -> Unit)? = null) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    // 获取当前应用版本号
                    val currentVersionCode = getCurrentVersionCode(context)
                    Log.d(TAG, "当前应用版本号: $currentVersionCode")

                    // 从OSS获取版本信息
                    val versionInfo = fetchVersionInfo()
                    val latestVersionCode = versionInfo.optInt("versionCode", 0)
                    val versionName = versionInfo.optString("versionName", "")
                    Log.d(TAG, "最新应用版本号: $latestVersionCode")

                    // 比较版本号
                    val hasUpdate = latestVersionCode > currentVersionCode

                    // 在UI线程回调结果
                    withContext(Dispatchers.Main) {
                        onUpdateChecked?.invoke(hasUpdate, versionName)

                        // 如果有更新，提示用户
                        if (hasUpdate) {
                            showUpdateDialog(context, versionName)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "检查更新失败", e)
                    withContext(Dispatchers.Main) {
                        onUpdateChecked?.invoke(false, null)
                    }
                }
            }
        }

        /**
         * 获取当前应用的版本号
         */
        private fun getCurrentVersionCode(context: Context): Int {
            return try {
                val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                // 适配Android API 30及以上版本，versionCode已弃用
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                    packageInfo.longVersionCode.toInt()
                } else {
                    @Suppress("DEPRECATION")
                    packageInfo.versionCode
                }
            } catch (e: Exception) {
                Log.e(TAG, "获取当前版本号失败", e)
                0
            }
        }

        /**
         * 从阿里云OSS获取版本信息JSON
         */
        private fun fetchVersionInfo(): JSONObject {
            val url = URL(VERSION_JSON_URL)
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000

            try {
                val inputStream: InputStream = connection.inputStream
                val content = inputStream.bufferedReader().use { it.readText() }
                return JSONObject(content)
            } finally {
                connection.disconnect()
            }
        }

        /**
         * 显示更新对话框
         */
        private fun showUpdateDialog(context: Context, versionName: String) {
            AlertDialog.Builder(context)
                .setTitle("发现新版本")
                .setMessage("有新版本 $versionName 可用，是否立即更新？")
                .setPositiveButton("立即更新") { _, _ ->
                    startDownloadUpdate(context)
                }
                .setNegativeButton("稍后更新", null)
                .setCancelable(false)
                .show()
        }

        /**
         * 开始下载更新包
         */
        private fun startDownloadUpdate(context: Context) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    // 创建进度对话框
                    val progressDialog = withContext(Dispatchers.Main) {
                        AlertDialog.Builder(context)
                            .setTitle("正在更新")
                            .setMessage("0%")
                            .setCancelable(false)
                            .create().apply {
                                show()
                            }
                    }

                    // 创建下载目录
                    val downloadDir = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "updates")
                    if (!downloadDir.exists()) {
                        downloadDir.mkdirs()
                    }

                    // 下载文件
                    val apkFile = File(downloadDir, "app-update.apk")

                    downloadFile(apkFile) {
                        downloadedBytes, totalBytes ->
                        val progress = (downloadedBytes * 100 / totalBytes).toInt()
                        val formattedProgress = DecimalFormat("#").format(progress)

                        // 更新进度对话框
                        Handler(Looper.getMainLooper()).post {
                            progressDialog.setMessage("$formattedProgress%")
                        }
                    }

                    // 下载完成后关闭进度对话框并安装
                    withContext(Dispatchers.Main) {
                        progressDialog.dismiss()
                    }

                    // 安装APK
                    installApk(context, apkFile)
                } catch (e: Exception) {
                    Log.e(TAG, "下载更新失败", e)
                    withContext(Dispatchers.Main) {
                        AlertDialog.Builder(context)
                            .setTitle("更新失败")
                            .setMessage("更新包下载失败，请稍后重试。")
                            .setPositiveButton("确定", null)
                            .show()
                    }
                }
            }
        }

        /**
         * 下载文件并显示进度
         */
        private fun downloadFile(outputFile: File, progressCallback: (Long, Long) -> Unit) {
            val url = URL(APK_DOWNLOAD_URL)
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000

            try {
                val totalBytes = connection.contentLength.toLong()
                var downloadedBytes: Long = 0

                val inputStream = connection.inputStream
                val outputStream = FileOutputStream(outputFile)

                val buffer = ByteArray(4096)
                var bytesRead: Int

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                    downloadedBytes += bytesRead
                    progressCallback(downloadedBytes, totalBytes)
                }

                outputStream.flush()
                outputStream.close()
                inputStream.close()
            } finally {
                connection.disconnect()
            }
        }

        /**
         * 安装APK文件
         */
        private fun installApk(context: Context, apkFile: File) {
            // 确保文件存在
            if (!apkFile.exists()) {
                Log.e(TAG, "APK文件不存在: ${apkFile.absolutePath}")
                return
            }

            // 设置文件可执行权限
            apkFile.setExecutable(true, false)

            // 创建安装意图
            val intent = Intent(Intent.ACTION_VIEW)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

            // 获取文件URI
            val apkUri = FileProvider.getUriForFile(
                context,
                context.packageName + ".fileprovider",
                apkFile
            )

            intent.setDataAndType(apkUri, "application/vnd.android.package-archive")

            // 启动安装
            context.startActivity(intent)
        }
    }
}