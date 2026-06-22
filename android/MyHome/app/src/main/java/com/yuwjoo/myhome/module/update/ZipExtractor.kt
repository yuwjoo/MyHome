package com.yuwjoo.myhome.module.update

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.zip.ZipFile

/**
 * Zip 文件解压器
 *
 * 将下载的 zip 包解压到指定目录，所有操作在 IO 线程执行。
 */
object ZipExtractor {

    private const val TAG = "ZipExtractor"

    /**
     * 解压 zip 文件到目标目录
     *
     * @param zipFile zip 文件
     * @param destDir 目标目录（解压后的根目录）
     * @throws Exception 解压失败时抛出
     */
    suspend fun extract(zipFile: File, destDir: File) = withContext(Dispatchers.IO) {
        Log.d(TAG, "开始解压: ${zipFile.absolutePath} -> ${destDir.absolutePath}")

        if (!zipFile.exists()) {
            throw java.io.FileNotFoundException("zip 文件不存在: ${zipFile.absolutePath}")
        }

        // 如果目标目录已存在，先清空（确保干净的解压结果）
        if (destDir.exists()) {
            destDir.deleteRecursively()
        }
        destDir.mkdirs()

        try {
            ZipFile(zipFile).use { zip ->
                val entries = zip.entries()
                while (entries.hasMoreElements()) {
                    val entry = entries.nextElement()

                    // 规范化路径：处理 Windows 的 \ 分隔符和 leading / 问题
                    // PowerShell Compress-Archive 在 Windows 上使用 \ 作为路径分隔符，
                    // 而 Android (Linux) 不识别 \，需要统一转为 /
                    val normalizedName = entry.name
                        .replace('\\', '/')    // Windows 分隔符 → Unix 分隔符
                        .trimStart('/')         // 移除 leading /，确保是相对路径

                    val entryFile = File(destDir, normalizedName)

                    if (entry.isDirectory) {
                        entryFile.mkdirs()
                    } else {
                        // 确保父目录存在
                        entryFile.parentFile?.mkdirs()

                        // 流式复制文件内容
                        zip.getInputStream(entry).use { input ->
                            FileOutputStream(entryFile).use { output ->
                                input.copyTo(output, bufferSize = 8192)
                            }
                        }
                    }

                    Log.d(TAG, "解压: ${entry.name} -> ${normalizedName}")
                }
            }

            Log.d(TAG, "解压完成，共 ${destDir.listFiles()?.size ?: 0} 个顶层条目")
        } catch (e: Exception) {
            Log.e(TAG, "解压失败: ${e.message}", e)
            // 解压失败时清理目录
            destDir.deleteRecursively()
            throw e
        }
    }
}
