package com.yuwjoo.myhomeserver.modules.live

/**
 * 直播推流状态回调
 *
 * 通知上层模块推流状态变化，所有回调均在主线程触发。
 */
interface LiveStreamCallback {
    /** 推流状态变更 */
    fun onStateChanged(state: LiveStreamState)

    /** 单个分段上传完成 */
    fun onSegmentUploaded(segmentName: String)

    /** 推流过程发生错误 */
    fun onError(error: Exception)
}
