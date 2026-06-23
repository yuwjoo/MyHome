package com.yuwjoo.myhome.module.mqtt

/**
 * [MqttCore] 回调接口
 */
interface MqttCoreCallback {
    /**
     * 连接状态改变
     *
     * @param connected 是否已连接
     * @param cause     断开原因，主动断开时为 null
     */
    fun onConnectionChanged(connected: Boolean, cause: Throwable? = null)

    /**
     * 收到消息
     *
     * @param topic   消息所属主题
     * @param payload 消息内容（UTF-8 字符串）
     */
    fun onMessageArrived(topic: String, payload: String)
}
