package com.yuwjoo.myhome.module.mqtt

/**
 * 主题级回调，用于 subscribe() 时传入。
 */
interface TopicCallback {
    /**
     * 收到该主题的订阅消息
     *
     * @param topic   消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: String)
}
