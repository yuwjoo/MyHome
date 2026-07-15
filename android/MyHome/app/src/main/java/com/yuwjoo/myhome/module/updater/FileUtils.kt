package com.yuwjoo.myhome.module.updater

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.zip.ZipFile
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * 文件工具类
 */
object FileUtils {

    private const val TAG = "FileUtils"

    private val httpClient = OkHttpClient.Builder() // OkHttp 客户端实例，复用连接池
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    /**
     * 下载文件到指定路径
     *
     * @param url        远程文件下载地址
     * @param destPath   本地保存路径
     * @param onProgress 下载进度回调（downloaded: 已下载字节数, total: 总字节数）
     */
    suspend fun download(
        url: String,
        destPath: String,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) = withContext(Dispatchers.IO) {
        val destFile = File(destPath)
        destFile.parentFile?.mkdirs() // 确保父目录存在
        
        val request = Request.Builder().url(url).build()
        val call = httpClient.newCall(request)

        suspendCancellableCoroutine<Unit> { continuation ->
            call.enqueue(object : okhttp3.Callback {
                override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                    try {
                        if (!response.isSuccessful) {
                            throw java.io.IOException("下载失败，HTTP ${response.code}")
                        }

                        val body = response.body
                            ?: throw java.io.IOException("响应体为空")
                        val totalBytes = body.contentLength()

                        body.byteStream().use { input ->
                            writeStream(input, destFile, totalBytes, onProgress)
                        }

                        Log.d(TAG, "下载完成: ${destFile.absolutePath}")
                        if (continuation.isActive) {
                            continuation.resume(Unit)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "下载过程出错: ${e.message}", e)
                        destFile.delete()
                        if (continuation.isActive) {
                            continuation.resumeWithException(e)
                        }
                    } finally {
                        response.close()
                    }
                }
                
                override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {
                    Log.e(TAG, "下载失败: ${e.message}", e)
                    destFile.delete()
                    if (continuation.isActive) {
                        continuation.resumeWithException(e)
                    }
                }
            })

            // 协程取消 → 取消 OkHttp 请求
            continuation.invokeOnCancellation {
                call.cancel()
            }
        }
    }

    /**
     * 解压 zip 文件到指定目录
     *
     * @param zipPath     要解压的 zip 文件路径
     * @param destDirPath 存放解压文件的目标目录路径
     */
    suspend fun unzip(zipPath: String, destDirPath: String) = withContext(Dispatchers.IO) {
        val zipFile = File(zipPath)
        val destDir = File(destDirPath)

        Log.d(TAG, "开始解压: ${zipFile.absolutePath} -> ${destDir.absolutePath}")

        if (!zipFile.exists()) {
            throw java.io.FileNotFoundException("zip 文件不存在: ${zipFile.absolutePath}")
        }

        // 清空旧目录，确保解压结果干净
        if (destDir.exists()) {
            destDir.deleteRecursively()
        }
        destDir.mkdirs()

        try {
            ZipFile(zipFile).use { zip ->
                val entries = zip.entries()
                while (entries.hasMoreElements()) {
                    val entry = entries.nextElement()

                    // 规范化路径：兼容 Windows 的 \ 分隔符和 leading /
                    val normalizedName = entry.name
                        .replace('\\', '/')
                        .trimStart('/')

                    val entryFile = File(destDir, normalizedName)

                    if (entry.isDirectory) {
                        entryFile.mkdirs()
                    } else {
                        entryFile.parentFile?.mkdirs()
                        zip.getInputStream(entry).use { input ->
                            FileOutputStream(entryFile).use { output ->
                                input.copyTo(output, bufferSize = 8192)
                            }
                        }
                    }
                }
            }
            Log.d(TAG, "解压完成，共 ${destDir.listFiles()?.size ?: 0} 个顶层条目")
        } catch (e: Exception) {
            Log.e(TAG, "解压失败: ${e.message}", e)
            destDir.deleteRecursively()
            throw e
        }
    }

    /**
     * 流式写入输入流到目标文件
     *
     * @param input      输入流
     * @param destFile   目标文件
     * @param totalBytes 总字节数
     * @param onProgress 进度回调
     */
    private fun writeStream(
        input: InputStream,
        destFile: File,
        totalBytes: Long,
        onProgress: ((Long, Long) -> Unit)?,
    ) {
        FileOutputStream(destFile).use { output ->
            val buffer = ByteArray(8192)
            var downloaded = 0L
            var bytesRead: Int

            while (input.read(buffer).also { bytesRead = it } != -1) {
                output.write(buffer, 0, bytesRead)
                downloaded += bytesRead
                onProgress?.invoke(downloaded, totalBytes)
            }
            output.flush()
        }
    }
}
