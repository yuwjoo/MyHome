package com.yuwjoo.myhome.modules.mqtt

interface MqttCallback {
    /**
     * 连接成功
     */
    fun onConnected()

    /**
     * 连接断开
     * @param cause 断开原因，主动 disconnect() 时传入 null
     */
    fun onDisconnected(cause: Throwable?)

    /**
     * 收到订阅消息
     * @param topic  消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: String)

    /**
     * 发生异常
     * @param error 异常信息
     */
    fun onError(error: Throwable)
}
