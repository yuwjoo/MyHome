package com.yuwjoo.myhome.modules.mqtt

/**
 * 主题专属回调，用于 subscribe() 时传入。
 * 仅包含消息到达方法，不含连接相关事件。
 */
interface MqttTopicCallback {
    /**
     * 收到该主题的订阅消息
     * @param topic  消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: String)
}
