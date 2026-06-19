package com.yuwjoo.myhomeserver.modules.oss

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.alibaba.sdk.android.oss.ClientConfiguration
import com.alibaba.sdk.android.oss.ClientException
import com.alibaba.sdk.android.oss.OSSClient
import com.alibaba.sdk.android.oss.ServiceException
import com.alibaba.sdk.android.oss.common.auth.OSSPlainTextAKSKCredentialProvider
import com.alibaba.sdk.android.oss.callback.OSSCompletedCallback
import com.alibaba.sdk.android.oss.callback.OSSProgressCallback
import com.alibaba.sdk.android.oss.model.DeleteObjectRequest
import com.alibaba.sdk.android.oss.model.DeleteObjectResult
import com.alibaba.sdk.android.oss.model.ObjectMetadata
import com.alibaba.sdk.android.oss.model.PutObjectRequest
import com.alibaba.sdk.android.oss.model.PutObjectResult
import com.yuwjoo.myhomeserver.config.OssConfig
import java.io.File

/**
 * OSS 上传管理器
 *
 * 使用阿里云 OSS Android SDK 直传文件到 OSS 桶，不经过后端签名 API。
 *
 * ### 设计要点
 * - **单例 + 按需初始化**：全局唯一，首次使用时注入 ApplicationContext
 * - **OSS SDK 直传**：通过 AK/SK 凭证直接写入 OSS，无需后端中转
 * - **异步上传**：OSS SDK 内置线程池，回调 post 到主线程
 * - **进度回调**：通过 OSS SDK 的 ProgressCallback 实时上报上传进度
 *
 * ### 依赖
 * - 阿里云 OSS Android SDK (`aliyun-oss-android-sdk`)
 * - `OssConfig` 中的 AK/SK 凭据
 */
class OssManager private constructor() {

    companion object {
        @Volatile
        private var instance: OssManager? = null

        /**
         * 初始化并返回单例（首次调用时必须传入 ApplicationContext）
         */
        @JvmStatic
        fun init(appContext: Context): OssManager {
            return instance ?: synchronized(this) {
                instance ?: OssManager().also {
                    it.appContext = appContext.applicationContext
                    instance = it
                }
            }
        }

        @JvmStatic
        fun getInstance(): OssManager {
            return instance ?: throw IllegalStateException(
                "OssManager 未初始化，请先调用 init(context)"
            )
        }
    }

    private lateinit var appContext: Context
    private val handler = Handler(Looper.getMainLooper())

    @Suppress("DEPRECATION")
    private val client: OSSClient by lazy {
        val credentialProvider = OSSPlainTextAKSKCredentialProvider(
            OssConfig.ACCESS_KEY_ID,
            OssConfig.ACCESS_KEY_SECRET,
        )
        val conf = ClientConfiguration().apply {
            connectionTimeout = 30 * 1000
            socketTimeout = 30 * 1000
            maxConcurrentRequest = 3
        }
        OSSClient(appContext, OssConfig.OSS_SDK_ENDPOINT, credentialProvider, conf)
    }

    // ════════════════ 公开方法 ════════════════

    /**
     * 上传本地文件到 OSS
     *
     * @param localFile  本地文件
     * @param ossKey     OSS object key（不含 bucket）
     * @param callback   上传结果回调（主线程）
     */
    fun uploadFile(localFile: File, ossKey: String, callback: OssCallback) {
        val put = PutObjectRequest(
            OssConfig.BUCKET_NAME,
            ossKey,
            localFile.absolutePath,
        )

        // 文件设为公共读，播放端无需签名即可直接访问
        val metadata = ObjectMetadata().apply {
            setHeader("x-oss-object-acl", "public-read")
        }
        put.metadata = metadata

        put.progressCallback = OSSProgressCallback { _, currentSize, totalSize ->
            val percent = if (totalSize > 0) {
                (currentSize * 100 / totalSize).toInt()
            } else {
                -1
            }
            handler.post { callback.onProgress(ossKey, percent) }
        }

        client.asyncPutObject(put, object : OSSCompletedCallback<PutObjectRequest, PutObjectResult> {
            override fun onSuccess(request: PutObjectRequest, result: PutObjectResult) {
                handler.post { callback.onSuccess(ossKey) }
            }

            override fun onFailure(
                request: PutObjectRequest,
                clientException: ClientException?,
                serviceException: ServiceException?,
            ) {
                val error = clientException
                    ?: serviceException
                    ?: Exception("OSS 上传失败")
                handler.post { callback.onFailed(ossKey, error) }
            }
        })
    }

    /**
     * 上传字节数据到 OSS（用于 m3u8 等元数据文件）
     *
     * 先将数据写入临时文件，再调用 [uploadFile] 上传。
     */
    fun uploadBytes(data: ByteArray, ossKey: String, callback: OssCallback) {
        val tempFile = File(appContext.cacheDir, "oss_upload_${System.currentTimeMillis()}.tmp")
        try {
            tempFile.writeBytes(data)
            uploadFile(tempFile, ossKey, object : OssCallback {
                override fun onSuccess(ossKey: String) {
                    tempFile.delete()
                    callback.onSuccess(ossKey)
                }

                override fun onFailed(ossKey: String, error: Exception) {
                    tempFile.delete()
                    callback.onFailed(ossKey, error)
                }

                override fun onProgress(ossKey: String, percent: Int) {
                    callback.onProgress(ossKey, percent)
                }
            })
        } catch (e: Exception) {
            tempFile.delete()
            handler.post { callback.onFailed(ossKey, e) }
        }
    }

    /**
     * 删除 OSS 上的文件（用于清理过期分段，不阻塞，仅打日志）
     */
    fun deleteFile(ossKey: String) {
        val del = DeleteObjectRequest(OssConfig.BUCKET_NAME, ossKey)
        client.asyncDeleteObject(del, object : OSSCompletedCallback<DeleteObjectRequest, DeleteObjectResult> {
            override fun onSuccess(request: DeleteObjectRequest, result: DeleteObjectResult) = Unit
            override fun onFailure(
                request: DeleteObjectRequest,
                clientException: ClientException?,
                serviceException: ServiceException?,
            ) = Unit
        })
    }
}
