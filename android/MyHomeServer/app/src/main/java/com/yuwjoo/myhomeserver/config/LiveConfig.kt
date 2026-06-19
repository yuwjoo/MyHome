package com.yuwjoo.myhomeserver.config

/**
 * 直播推流参数配置
 *
 * 控制视频录制、分段上传、M3U8 更新的相关参数，
 * 按需调整以平衡延迟、清晰度与流量。
 */
object LiveConfig {
    /** 视频分辨率 */
    const val VIDEO_WIDTH = 1280
    const val VIDEO_HEIGHT = 720

    /** 视频帧率 */
    const val FRAME_RATE = 25

    /** 视频码率（bps） */
    const val BIT_RATE = 2_000_000

    /** 每个 HLS 分段的录制时长（秒） */
    const val SEGMENT_DURATION = 3

    /** M3U8 列表最大保留的分段数（超出后最旧的移除） */
    const val MAX_SEGMENTS = 20

    /** hls.js 目标缓冲时长（EXT-X-TARGETDURATION）应 >= SEGMENT_DURATION */
    val TARGET_DURATION: Int get() = SEGMENT_DURATION

    /** 默认流 ID */
    const val DEFAULT_STREAM_ID = "living-room-camera"
}
