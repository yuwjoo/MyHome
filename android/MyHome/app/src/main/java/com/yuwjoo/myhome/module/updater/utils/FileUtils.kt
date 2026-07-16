package com.yuwjoo.myhome.module.updater.utils

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Call
import okhttp3.Response
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.zip.ZipFile

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
     * 在 IO 线程同步执行 OkHttp 请求
     */
    private suspend fun Call.executeOnIo(): Response = withContext(Dispatchers.IO) {
        execute()
    }

    /**
     * 请求文件内容
     *
     * @param url 远程文件地址
     * @return 文件文本内容，请求失败返回 null
     */
    suspend fun fetch(url: String): String? {
        val request = Request.Builder().url(url).build()

        return try {
            httpClient.newCall(request).executeOnIo().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "请求失败，HTTP ${response.code}")
                    return null
                }
                val body = response.body?.string()
                if (body == null) {
                    Log.e(TAG, "响应体为空")
                }
                body
            }
        } catch (e: Exception) {
            Log.e(TAG, "请求异常: ${e.message}", e)
            null
        }
    }

    /**
     * 下载文件到指定路径
     *
     * @param url        远程文件下载地址
     * @param destFile   本地保存目标文件
     * @param onProgress 下载进度回调（downloaded: 已下载字节数, total: 总字节数）
     */
    suspend fun download(
        url: String,
        destFile: File,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) {
        destFile.parentFile?.mkdirs() // 确保父目录存在

        val request = Request.Builder().url(url).build()

        try {
            httpClient.newCall(request).executeOnIo().use { response ->
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
            }
        } catch (e: Exception) {
            Log.e(TAG, "下载过程出错: ${e.message}", e)
            destFile.delete()
            throw e
        }
    }

    /**
     * 读取文件文本内容
     *
     * @param file 目标文件
     * @return 文件文本内容，读取失败返回 null
     */
    fun read(file: File): String? {
        return try {
            if (file.exists()) file.readText() else null
        } catch (e: Exception) {
            Log.e(TAG, "读取文件失败: ${e.message}", e)
            null
        }
    }

    /**
     * 解压 zip 文件到指定目录
     *
     * @param zipFile  要解压的 zip 文件
     * @param destDir  存放解压文件的目标目录
     */
    suspend fun unzip(zipFile: File, destDir: File) = withContext(Dispatchers.IO) {
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
