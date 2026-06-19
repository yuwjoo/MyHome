package com.yuwjoo.myhomeserver.modules.mqtt

/**
 * MQTT 按主题订阅的轻量回调接口
 *
 * 与 [MqttCallback] 的区别：仅收到对应 topic 的消息时才触发，
 * 适合设备模块按 topic 注册自己的消息处理器。
 */
fun interface MqttTopicCallback {
    fun onMessageArrived(topic: String, payload: String)
}
