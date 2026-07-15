package com.yuwjoo.myhome.module.updater

/**
 * 更新监听器
 */
interface UpdateListener {

    /**
     * 应用版本更新可用
     *
     * @param version   最新版本号
     * @param onConfirm 用户确认更新时调用
     * @param onSkip    用户跳过更新时调用
     */
    fun onAppUpdateAvailable(
        version: String,
        onConfirm: () -> Unit,
        onSkip: () -> Unit,
    )

    /**
     * Web 更新完成
     */
    fun onWebUpdateComplete()
}
