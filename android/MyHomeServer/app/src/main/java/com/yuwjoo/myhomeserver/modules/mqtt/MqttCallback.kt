package com.yuwjoo.myhomeserver.modules.mqtt

/**
 * MQTT 全局连接回调接口
 *
 * 用于监听 MQTT 连接状态变化与全体消息到达，
 * 适合需要在连接/断开时做统一处理的模块（如更新 UI 状态）。
 */
interface MqttCallback {
    fun onConnected()
    fun onDisconnected(cause: Throwable?)
    fun onMessageArrived(topic: String, payload: String)
    fun onError(e: Exception)
}
