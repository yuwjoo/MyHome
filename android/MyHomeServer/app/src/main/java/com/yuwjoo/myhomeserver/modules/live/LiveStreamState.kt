package com.yuwjoo.myhomeserver.modules.live

/**
 * 直播推流状态
 *
 * 描述当前直播推流的运行态，由 [LiveStreamManager] 维护并通过 [LiveStreamCallback] 通知。
 */
data class LiveStreamState(
    /** 当前流 ID */
    val streamId: String = "",
    /** 推流状态 */
    val status: Status = Status.IDLE,
    /** 已上传的分段数（含已删除清理的） */
    val uploadedSegments: Int = 0,
    /** 当前正在录制的分段时间戳 */
    val currentSegmentStart: Long = 0,
    /** 最后错误信息 */
    val lastError: String? = null,
) {
    enum class Status {
        /** 未推流 */
        IDLE,
        /** 推流中 */
        STREAMING,
        /** 正在停止 */
        STOPPING,
        /** 错误 */
        ERROR,
    }
}
