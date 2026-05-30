package com.yuwjoo.myhome.update

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * 文件下载器
 *
 * 使用 OkHttp 实现文件下载功能，支持取消操作。
 * 所有下载操作在 IO 线程执行，避免阻塞主线程。
 */
object FileDownloader {

    private const val TAG = "FileDownloader"

    /** OkHttp 客户端实例，复用连接池 */
    private val client = OkHttpClient.Builder()
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    /**
     * 下载文件到指定路径
     *
     * @param url 远程文件 URL
     * @param destFile 目标文件（本地存储路径）
     * @param onProgress 下载进度回调，参数为已下载字节数和总字节数（可能为 -1 表示未知）
     * @throws Exception 下载失败时抛出
     */
    suspend fun download(
        url: String,
        destFile: File,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null
    ) = withContext(Dispatchers.IO) {
        Log.d(TAG, "开始下载: $url -> ${destFile.absolutePath}")

        // 确保父目录存在
        destFile.parentFile?.mkdirs()

        val request = Request.Builder().url(url).build()

        // 使用挂起协程封装 OkHttp 的异步请求
        suspendCancellableCoroutine<Unit> { continuation ->
            val call = client.newCall(request)
            call.enqueue(object : okhttp3.Callback {
                override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {
                    Log.e(TAG, "下载失败: ${e.message}", e)
                    if (continuation.isActive) {
                        continuation.resumeWithException(e)
                    }
                }

                override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                    try {
                        if (!response.isSuccessful) {
                            throw java.io.IOException("下载失败，HTTP ${response.code}")
                        }

                        val body = response.body ?: throw java.io.IOException("响应体为空")
                        val totalBytes = body.contentLength()

                        // 流式写入文件，同时回调进度
                        writeStreamToFile(body.byteStream(), destFile, totalBytes, onProgress)

                        Log.d(TAG, "下载完成: ${destFile.absolutePath}")
                        if (continuation.isActive) {
                            continuation.resume(Unit)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "下载过程中出错: ${e.message}", e)
                        // 下载失败时删除不完整的文件
                        destFile.delete()
                        if (continuation.isActive) {
                            continuation.resumeWithException(e)
                        }
                    } finally {
                        response.close()
                    }
                }
            })

            // 协程取消时，取消 OkHttp 请求
            continuation.invokeOnCancellation {
                call.cancel()
            }
        }
    }

    /**
     * 将输入流写入目标文件
     *
     * @param inputStream 输入流
     * @param destFile 目标文件
     * @param totalBytes 总字节数（可能为 -1）
     * @param onProgress 进度回调
     */
    private fun writeStreamToFile(
        inputStream: InputStream,
        destFile: File,
        totalBytes: Long,
        onProgress: ((Long, Long) -> Unit)?
    ) {
        FileOutputStream(destFile).use { output ->
            val buffer = ByteArray(8192) // 8KB 缓冲区
            var downloadedBytes = 0L
            var bytesRead: Int

            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                output.write(buffer, 0, bytesRead)
                downloadedBytes += bytesRead
                onProgress?.invoke(downloadedBytes, totalBytes)
            }
            output.flush()
        }
    }
}
