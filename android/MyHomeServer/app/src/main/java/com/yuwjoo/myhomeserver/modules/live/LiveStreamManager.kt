package com.yuwjoo.myhomeserver.modules.live

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.video.VideoCapture
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoRecordEvent
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.gson.Gson
import com.yuwjoo.myhomeserver.config.LiveConfig
import com.yuwjoo.myhomeserver.config.MqttTopics
import com.yuwjoo.myhomeserver.config.OssConfig
import com.yuwjoo.myhomeserver.modules.foreground.LiveForegroundService
import com.yuwjoo.myhomeserver.modules.mqtt.MqttManager
import com.yuwjoo.myhomeserver.modules.mqtt.MqttTopicCallback
import com.yuwjoo.myhomeserver.modules.oss.OssCallback
import com.yuwjoo.myhomeserver.modules.oss.OssManager
import java.io.File
import java.util.concurrent.Executors

/**
 * 直播推流管理器
 *
 * 统一管理摄像头采集 → 分段录制 → OSS 上传 → M3U8 更新的完整链路，
 * 通过 MQTT 接收远程 start / stop 指令，上报实时状态。
 *
 * ### 整体流程
 * ```
 * MQTT "start" ──▶ openCamera() ──▶ startRecordingSegment()
 *                                            │
 *                    ┌── 分段计时器（SEGMENT_DURATION 秒）──┐
 *                    ▼                                       ▼
 *              pingFileA ←── 循环交替 ──▶ pingFileB
 *                    │                         │
 *                上传到 OSS               上传到 OSS
 *                    │                         │
 *                更新 .m3u8              更新 .m3u8
 *                    │                         │
 *              删除本地文件             删除本地文件
 *
 * MQTT "stop"  ──▶ stopRecording() ──▶ 上传末段 ──▶ 更新 .m3u8 ──▶ closeCamera()
 * ```
 *
 * ### 核心设计
 * - **双文件乒乓录制**：file_a 与 file_b 交替使用，一录一传，最小化片段间隔
 * - **CameraX VideoCapture**：Android 官方推荐，自动处理相机生命周期
 * - **OssManager 直传**：复用现有后端上传签名 API
 * - **MQTT 双工通信**：订阅 `YHHome/live/command` 接收指令，发布 `YHHome/live/status` 上报状态
 * - **主线程回调**：所有 LiveStreamCallback 回调通过 Handler post 到主线程
 *
 * ### 依赖
 * - `MqttManager`：接收远程指令、上报状态
 * - `OssManager`：上传分段文件与 m3u8 到 OSS
 * - `LiveForegroundService`：前台保活
 * - CameraX：摄像头采集与录制
 * - OkHttp + Gson：签名请求与解析
 *
 * ### 使用方式
 * ```kotlin
 * val manager = LiveStreamManager.getInstance()
 *
 * // 初始化（仅一次）
 * manager.init(context, lifecycleOwner, surfaceProvider)
 *
 * // 注册回调
 * manager.addCallback(callback)
 *
 * // 启动推流（远程命令触发）
 * manager.startStream("living-room-camera")
 *
 * // 停止推流
 * manager.stopStream()
 * ```
 */
class LiveStreamManager private constructor() {

    companion object {
        private const val TAG = "LiveStreamManager"

        @Volatile
        private var instance: LiveStreamManager? = null

        @JvmStatic
        fun getInstance(): LiveStreamManager {
            return instance ?: synchronized(this) {
                instance ?: LiveStreamManager().also { instance = it }
            }
        }
    }

    // ════════════════ 依赖 ════════════════

    private var ctx: Context? = null
    private var lifecycleOwner: LifecycleOwner? = null
    private var previewSurfaceProvider: Preview.SurfaceProvider? = null

    private val mqtt get() = MqttManager.getInstance()
    private val oss get() = OssManager.getInstance()
    private val gson = Gson()
    private val handler = Handler(Looper.getMainLooper())
    private val mainExecutor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "live-main").apply { isDaemon = true }
    }

    // ════════════════ 状态 ════════════════

    private val callbacks = mutableListOf<LiveStreamCallback>()
    private var state = LiveStreamState()
    private var cameraProvider: ProcessCameraProvider? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var activeRecording: Recording? = null
    private var toggle = false              // false → file_a, true → file_b
    private var segmentIndex = 0
    private var segmentsInM3u8 = mutableListOf<String>() // 当前 m3u8 中的分段文件名
    private val segmentRunnable = Runnable { onSegmentTick() }

    // ════════════════ 初始化 ════════════════

    /**
     * 初始化推流管理器
     *
     * @param context          Android Context
     * @param lifecycleOwner   相机绑定的生命周期（建议 ProcessLifecycleOwner）
     * @param surfaceProvider  预览 SurfaceProvider（如 PreviewView.surfaceProvider）
     */
    fun init(
        context: Context,
        lifecycleOwner: LifecycleOwner,
        surfaceProvider: Preview.SurfaceProvider,
    ) {
        this.ctx = context.applicationContext
        this.lifecycleOwner = lifecycleOwner
        this.previewSurfaceProvider = surfaceProvider
        subscribeMqttCommand()
    }

    // ════════════════ 回调管理 ════════════════

    fun addCallback(callback: LiveStreamCallback) {
        if (!callbacks.contains(callback)) callbacks.add(callback)
    }

    fun removeCallback(callback: LiveStreamCallback) {
        callbacks.remove(callback)
    }

    // ════════════════ 公开方法 ════════════════

    /** 获取当前状态 */
    fun getState(): LiveStreamState = state

    /**
     * 开始推流
     *
     * 打开摄像头 → 启动前台服务 → 开始分段录制 + 上传。
     * 若已在推流中则忽略。
     */
    fun startStream(streamId: String = LiveConfig.DEFAULT_STREAM_ID) {
        if (state.status == LiveStreamState.Status.STREAMING) return

        state = LiveStreamState(
            streamId = streamId,
            status = LiveStreamState.Status.STREAMING,
        )
        segmentIndex = 0
        segmentsInM3u8.clear()

        Log.i(TAG, "开始推流: $streamId")
        notifyStateChanged()
        startForegroundService()
        publishStatus("streaming", "推流已启动")
        openCamera()
    }

    /**
     * 停止推流
     *
     * 停止录制 → 上传最后一段 → 更新 m3u8 → 关闭摄像头 → 清理资源。
     */
    fun stopStream() {
        if (state.status != LiveStreamState.Status.STREAMING) return

        state = state.copy(status = LiveStreamState.Status.STOPPING)
        Log.i(TAG, "停止推流: ${state.streamId}")
        notifyStateChanged()

        // 停止分段计时器
        handler.removeCallbacks(segmentRunnable)

        // 停止当前录制（停止回调中会上传末段）
        try {
            activeRecording?.stop()
        } catch (_: Exception) {}

        publishStatus("idle", "推流已停止")
    }

    // ════════════════ 相机控制 ════════════════

    private fun openCamera() {
        val context = ctx ?: return
        val owner = lifecycleOwner ?: return
        val surface = previewSurfaceProvider ?: return

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().apply {
                setSurfaceProvider(surface)
            }

            videoCapture = VideoCapture.Builder(
                Recorder.Builder()
                    .setQualitySelector(
                        QualitySelector.from(Quality.HD)
                    )
                    .build(),
            ).build()

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
                    owner,
                    cameraSelector,
                    preview,
                    videoCapture,
                )
                // 开始首个分段
                startSegmentRecording()
                // 启动分段计时器
                handler.postDelayed(segmentRunnable, LiveConfig.SEGMENT_DURATION * 1000L)
            } catch (e: Exception) {
                Log.e(TAG, "打开摄像头失败", e)
                handleError(e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    private fun closeCamera() {
        handler.removeCallbacks(segmentRunnable)
        try {
            activeRecording?.stop()
        } catch (_: Exception) {}
        activeRecording = null

        try {
            cameraProvider?.unbindAll()
        } catch (_: Exception) {}
        videoCapture = null
        cameraProvider = null

        state = state.copy(status = LiveStreamState.Status.IDLE)
        notifyStateChanged()
        cleanupLocalFiles()
    }

    // ════════════════ 分段录制 ════════════════

    private fun startSegmentRecording() {
        val context = ctx ?: return
        val capture = videoCapture ?: return
        val streamId = state.streamId

        // 交替使用两个本地文件
        val fileName = if (toggle) "seg_b.mp4" else "seg_a.mp4"
        toggle = !toggle
        val outputFile = File(context.cacheDir, fileName)

        // 覆盖旧文件
        if (outputFile.exists()) outputFile.delete()

        val outputOptions = FileOutputOptions.Builder(outputFile).build()
        val recording = try {
            capture.output
                .prepareRecording(context, outputOptions)
                .start(mainExecutor) { event ->
                    when (event) {
                        is VideoRecordEvent.Finalize -> {
                            if (event.hasError()) {
                                Log.e(TAG, "分段录制错误: ${event.error}")
                                handleError(Exception("录制错误: ${event.error}"))
                            } else {
                                onSegmentComplete(outputFile)
                            }
                        }
                        else -> {}
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "启动录制失败", e)
            handleError(e)
            return
        }

        activeRecording = recording
        state = state.copy(currentSegmentStart = System.currentTimeMillis())
    }

    private fun onSegmentTick() {
        if (state.status != LiveStreamState.Status.STREAMING) return

        // 停止当前录制 → Finalize 回调中会处理上传和开始下一段
        try {
            activeRecording?.stop()
        } catch (e: Exception) {
            Log.e(TAG, "停止分段录制失败", e)
            handleError(e)
        }

        // 调度下一段计时（在 onSegmentComplete 中会重新 start）
        handler.postDelayed(segmentRunnable, LiveConfig.SEGMENT_DURATION * 1000L)
    }

    /**
     * 分段录制完成时的回调
     *
     * 上传该分段到 OSS → 更新 m3u8 → 删除本地文件 → 开始下一个分段
     */
    private fun onSegmentComplete(localFile: File) {
        if (state.status != LiveStreamState.Status.STREAMING &&
            state.status != LiveStreamState.Status.STOPPING
        ) return

        val streamId = state.streamId
        val segName = String.format("segment_%06d.ts", segmentIndex)
        val ossKey = OssConfig.liveObjectKey(streamId, segName)
        segmentIndex++

        // MP4 → MPEG-TS 转封装
        val context = ctx ?: return
        val tsFile = File(context.cacheDir, "seg_upload.ts")
        if (!TsMuxer.remuxMp4ToTs(localFile, tsFile)) {
            Log.e(TAG, "TS 转封装失败: $segName")
            handler.post { callbacks.forEach { it.onError(Exception("TS 转封装失败: $segName")) } }
            localFile.delete()
            return
        }

        oss.uploadFile(tsFile, ossKey, object : OssCallback {
            override fun onSuccess(ossKey: String) {
                tsFile.delete()
                // 加入 m3u8 列表
                segmentsInM3u8.add(segName)
                // 限制最大分段数（20段 × 3秒 = 60秒窗口），溢出分段从 OSS 删除
                while (segmentsInM3u8.size > LiveConfig.MAX_SEGMENTS) {
                    val evicted = segmentsInM3u8.removeAt(0)
                    val evictedKey = OssConfig.liveObjectKey(streamId, evicted)
                    oss.deleteFile(evictedKey)
                    Log.d(TAG, "OSS 删除过期分段: $evicted")
                }
                // 更新 m3u8
                updateM3u8(streamId)
                // 删除本地 MP4 文件
                localFile.delete()
                // 通知回调
                handler.post {
                    state = state.copy(uploadedSegments = state.uploadedSegments + 1)
                    callbacks.forEach { it.onSegmentUploaded(segName) }
                    notifyStateChanged()
                }
                Log.d(TAG, "分段上传成功: $segName")

                // 若正在推流中，继续下一个分段
                if (state.status == LiveStreamState.Status.STREAMING) {
                    startSegmentRecording()
                } else if (state.status == LiveStreamState.Status.STOPPING) {
                    // 停止流程：已上传末段 + 更新 m3u8，关闭相机
                    closeCamera()
                    stopForegroundService()
                }
            }

            override fun onFailed(ossKey: String, error: Exception) {
                tsFile.delete()
                Log.e(TAG, "分段上传失败: $ossKey", error)
                handler.post { callbacks.forEach { it.onError(error) } }
            }
        })
    }

    // ════════════════ M3U8 管理 ════════════════

    /**
     * 生成并上传 M3U8 播放列表文件
     */
    fun updateM3u8(streamId: String) {
        val m3u8Content = buildM3u8(streamId)
        val m3u8Key = OssConfig.liveObjectKey(streamId, "stream.m3u8")

        // M3U8 内容较小，通过 OSS SDK 直接上传
        oss.uploadBytes(
            data = m3u8Content.toByteArray(Charsets.UTF_8),
            ossKey = m3u8Key,
            callback = object : OssCallback {
                override fun onSuccess(ossKey: String) {
                    Log.d(TAG, "M3U8 更新成功")
                }

                override fun onFailed(ossKey: String, error: Exception) {
                    Log.e(TAG, "M3U8 更新失败", error)
                }
            },
        )
    }

    private fun buildM3u8(streamId: String): String {
        val lines = mutableListOf<String>()
        lines.add("#EXTM3U")
        lines.add("#EXT-X-VERSION:3")
        lines.add("#EXT-X-TARGETDURATION:${LiveConfig.TARGET_DURATION}")
        lines.add("#EXT-X-MEDIA-SEQUENCE:${maxOf(0, segmentIndex - segmentsInM3u8.size)}")

        for (segName in segmentsInM3u8) {
            val segUrl = "https://${OssConfig.BUCKET_NAME}.${OssConfig.ENDPOINT.removePrefix("https://")}/" +
                    OssConfig.liveObjectKey(streamId, segName)
            lines.add("#EXTINF:${LiveConfig.SEGMENT_DURATION}.000,")
            lines.add(segUrl)
        }
        return lines.joinToString("\n")
    }

    // ════════════════ MQTT 集成 ════════════════

    private fun subscribeMqttCommand() {
        mqtt.subscribe(
            topic = MqttTopics.TOPIC_LIVE_COMMAND,
            qos = 1,
            callback = MqttTopicCallback { _, payload ->
                try {
                    val cmd = gson.fromJson(payload, LiveCommand::class.java)
                    when (cmd.action) {
                        "start" -> {
                            val sid = cmd.streamId ?: LiveConfig.DEFAULT_STREAM_ID
                            startStream(sid)
                        }
                        "stop" -> stopStream()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "解析直播指令失败: $payload", e)
                }
            },
        )
    }

    private fun publishStatus(status: String, message: String) {
        val payload = gson.toJson(
            mapOf(
                "status" to status,
                "streamId" to state.streamId,
                "message" to message,
                "timestamp" to System.currentTimeMillis(),
            ),
        )
        mqtt.publish(MqttTopics.TOPIC_LIVE_STATUS, payload)
    }

    private data class LiveCommand(
        val action: String = "",
        val streamId: String? = null,
    )

    // ════════════════ 前台服务 ════════════════

    private fun startForegroundService() {
        val context = ctx ?: return
        val intent = android.content.Intent(context, LiveForegroundService::class.java)
        ContextCompat.startForegroundService(context, intent)
        LiveForegroundService.updateStatus(context, "推流中 — ${state.streamId}")
    }

    private fun stopForegroundService() {
        val context = ctx ?: return
        context.stopService(android.content.Intent(context, LiveForegroundService::class.java))
    }

    // ════════════════ 内部工具 ════════════════

    private fun notifyStateChanged() {
        handler.post {
            callbacks.forEach { it.onStateChanged(state) }
        }
    }

    private fun handleError(e: Exception) {
        state = state.copy(
            status = LiveStreamState.Status.ERROR,
            lastError = e.message,
        )
        notifyStateChanged()
        publishStatus("error", e.message ?: "未知错误")
        handler.post { callbacks.forEach { it.onError(e) } }
    }

    private fun cleanupLocalFiles() {
        val context = ctx ?: return
        listOf("seg_a.mp4", "seg_b.mp4").forEach {
            File(context.cacheDir, it).delete()
        }
    }
}
