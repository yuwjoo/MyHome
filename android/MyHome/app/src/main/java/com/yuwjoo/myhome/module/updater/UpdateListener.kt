package com.yuwjoo.myhome.module.updater

/**
 * 更新平台
 */
enum class UpdatePlatform { WEB, APP }

/**
 * 更新监听器
 */
interface UpdateListener {

    /**
     * 更新前置拦截
     *
     * @param platform  更新平台
     * @param version   新版本号
     * @param onConfirm 确认更新
     * @param onCancel  取消更新
     */
    fun onUpdateAvailable(
        platform: UpdatePlatform,
        version: String,
        onConfirm: () -> Unit,
        onCancel: () -> Unit,
    )

    /**
     * 更新进度
     *
     * @param platform   更新平台
     * @param downloaded 已下载字节数
     * @param total      总字节数
     */
    fun onUpdateProgress(platform: UpdatePlatform, downloaded: Long, total: Long) = Unit

    /**
     * 更新完成
     *
     * @param platform 更新平台
     */
    fun onUpdateComplete(platform: UpdatePlatform)

    /**
     * 更新出错
     *
     * @param error 错误信息
     */
    fun onUpdateError(error: String) = Unit
}
