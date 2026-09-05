package com.yuwjoo.myhomerecipe.module.updater

/**
 * 更新平台
 */
enum class UpdatePlatform { WEB, APP }

/**
 * 更新监听器
 *
 * 由 UI 层实现，负责弹窗、进度展示等交互；
 * Updater 只负责检查、下载与安装的流程编排，二者通过本接口解耦。
 */
interface UpdateListener {

    /**
     * 发现新版本，询问用户是否更新（Web 与 App 均可通过此回调决定交互）
     *
     * @param platform  更新平台
     * @param version   新版本号
     * @param onConfirm 用户确认更新（调用后流程继续）
     * @param onCancel  用户取消更新
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
     * @param total      总字节数（-1 表示未知）
     */
    fun onUpdateProgress(platform: UpdatePlatform, downloaded: Long, total: Long) = Unit

    /** 更新完成（下载并安装/切换完成） */
    fun onUpdateComplete(platform: UpdatePlatform) = Unit

    /** 更新流程出错 */
    fun onUpdateError(error: String) = Unit
}
