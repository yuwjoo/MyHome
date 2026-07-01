package com.yuwjoo.myhome.module.mqtt

/**
 * [MqttManager] 连接状态回调接口
 */
interface ConnectionCallback {
    /**
     * 连接状态改变
     *
     * @param connected 是否已连接
     * @param cause     断开原因，主动断开时为 null
     */
    fun onConnectionChanged(connected: Boolean, cause: Throwable? = null)
}