package com.yuwjoo.myhomeserver.modules.oss

/**
 * OSS 上传结果回调
 *
 * 用于通知上层模块上传进度与结果。
 * progress 参数为 0~100 的百分比（-1 表示无法精确获取）。
 */
interface OssCallback {
    /** 上传成功，返回该文件的 OSS URL */
    fun onSuccess(ossKey: String)

    /** 上传失败 */
    fun onFailed(ossKey: String, error: Exception)

    /** 上传进度（-1 表示未知） */
    fun onProgress(ossKey: String, percent: Int) = Unit
}
