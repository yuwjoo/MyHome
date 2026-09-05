package com.yuwjoo.myhomerecipe.module.updater.utils

import android.content.res.AssetManager
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.util.concurrent.TimeUnit
import java.util.zip.ZipFile

/**
 * 文件 / 网络工具类
 *
 * 所有网络请求在 IO 线程执行（挂起函数），
 * 失败统一抛出异常并携带清晰原因，由调用方决定如何上报。
 */
object FileUtils {

    private const val TAG = "FileUtils"

    private const val BUFFER_SIZE = 8192

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    /**
     * 请求文本内容
     *
     * 注意：建连、发送与读取响应体都属于网络 I/O，
     * 必须在 IO 线程上完整执行（只把建连切到 IO、在主线程读 body，
     * 会在 Android 上触发 NetworkOnMainThreadException）。
     *
     * @param url 远程地址
     * @return 响应文本
     * @throws IOException 网络错误或 HTTP 非 2xx
     */
    suspend fun fetch(url: String): String {
        val request = Request.Builder().url(url).build()
        return withContext(Dispatchers.IO) {
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw IOException("请求失败，HTTP ${response.code}: $url")
                }
                response.body?.string()
                    ?: throw IOException("响应体为空: $url")
            }
        }
    }

    /**
     * 下载文件到目标路径
     *
     * 与 [fetch] 同理，整个请求与响应体读取都在 IO 线程内完成。
     * 进度回调在 IO 线程触发，调用方如需更新 UI 请自行切回主线程
     * （进度对话框封装已内置线程切换，可直接传入）。
     *
     * @param url        远程下载地址
     * @param destFile   本地目标文件
     * @param onProgress 进度回调（downloaded / total，total 为 -1 表示未知）
     * @throws IOException 网络错误或 HTTP 非 2xx
     */
    suspend fun download(
        url: String,
        destFile: File,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) {
        val request = Request.Builder().url(url).build()
        withContext(Dispatchers.IO) {
            destFile.parentFile?.mkdirs()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw IOException("下载失败，HTTP ${response.code}: $url")
                }

                val body = response.body ?: throw IOException("响应体为空: $url")
                body.byteStream().use { input ->
                    writeToFile(input, destFile, body.contentLength(), onProgress)
                }
            }
            Log.d(TAG, "下载完成: ${destFile.absolutePath}")
        }
    }

    /**
     * 读取文件文本内容
     *
     * @return 文件内容；文件不存在或读取失败返回 null
     */
    fun read(file: File): String? {
        return try {
            if (file.exists()) file.readText() else null
        } catch (e: Exception) {
            Log.e(TAG, "读取文件失败: ${file.absolutePath}", e)
            null
        }
    }

    /**
     * 写入文本内容到文件（自动创建父目录）
     */
    fun write(file: File, content: String) {
        file.parentFile?.mkdirs()
        file.writeText(content)
    }

    /**
     * 解压 zip 到目标目录
     *
     * 目标目录会被整体重建（先删后建），保证解压结果与包内容完全一致。
     * 含 zip-slip 防护：任何试图逃逸目标目录的条目都会中止解压。
     *
     * @throws IOException zip 不存在、非法条目或解压过程出错
     */
    suspend fun unzip(zipFile: File, destDir: File) {
        withContext(Dispatchers.IO) {
            if (!zipFile.exists()) {
                throw FileNotFoundException("zip 文件不存在: ${zipFile.absolutePath}")
            }

            // 整体重建目标目录，避免与旧内容混在一起
            if (destDir.exists()) destDir.deleteRecursively()
            destDir.mkdirs()
            val canonicalDest = destDir.canonicalPath + File.separatorChar

            try {
                ZipFile(zipFile).use { zip ->
                    val entries = zip.entries()
                    while (entries.hasMoreElements()) {
                        val entry = entries.nextElement()
                        // 规范化路径：兼容 Windows 分隔符与开头斜杠
                        val entryName = entry.name
                            .replace('\\', '/')
                            .trimStart('/')

                        // zip-slip 防护：拒绝 ".." 段或跳出目标目录的路径
                        if (entryName.split('/').contains("..")) {
                            throw IOException("非法压缩条目: ${entry.name}")
                        }

                        val entryFile = File(destDir, entryName)
                        if (!entryFile.canonicalPath.startsWith(canonicalDest)) {
                            throw IOException("非法压缩条目: ${entry.name}")
                        }

                        if (entry.isDirectory) {
                            entryFile.mkdirs()
                        } else {
                            entryFile.parentFile?.mkdirs()
                            zip.getInputStream(entry).use { input ->
                                FileOutputStream(entryFile).use { output ->
                                    input.copyTo(output, BUFFER_SIZE)
                                }
                            }
                        }
                    }
                }
                Log.d(TAG, "解压完成: ${zipFile.absolutePath} -> ${destDir.absolutePath}")
            } catch (e: Exception) {
                Log.e(TAG, "解压失败: ${zipFile.absolutePath}", e)
                destDir.deleteRecursively()
                throw e
            }
        }
    }

    /**
     * 把 assets 目录完整复制到本地目录（用于首次安装植入占位页面）
     *
     * @param assetManager AssetManager
     * @param assetDir     assets 中要复制的目录，如 "web"
     * @param destDir      本地目标目录
     * @throws IOException assets 读取失败
     */
    fun copyAssetDir(assetManager: AssetManager, assetDir: String, destDir: File) {
        val names = assetManager.list(assetDir) ?: return
        destDir.mkdirs()

        for (name in names) {
            val childAssetPath = "$assetDir/$name"
            val childFile = File(destDir, name)

            try {
                // 能按文件打开 -> 复制文件
                assetManager.open(childAssetPath).use { input ->
                    childFile.parentFile?.mkdirs()
                    FileOutputStream(childFile).use { output ->
                        input.copyTo(output, BUFFER_SIZE)
                    }
                }
            } catch (_: FileNotFoundException) {
                // 打开失败说明是目录 -> 递归
                copyAssetDir(assetManager, childAssetPath, childFile)
            }
        }
    }

    /** 把输入流写入文件并回调进度 */
    private fun writeToFile(
        input: InputStream,
        destFile: File,
        totalBytes: Long,
        onProgress: ((Long, Long) -> Unit)?,
    ) {
        FileOutputStream(destFile).use { output ->
            val buffer = ByteArray(BUFFER_SIZE)
            var downloaded = 0L
            while (true) {
                val bytesRead = input.read(buffer)
                if (bytesRead == -1) break
                output.write(buffer, 0, bytesRead)
                downloaded += bytesRead
                onProgress?.invoke(downloaded, totalBytes)
            }
            output.flush()
        }
    }
}
