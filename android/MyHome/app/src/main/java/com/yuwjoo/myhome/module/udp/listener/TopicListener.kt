package com.yuwjoo.myhome.module.udp.listener

import org.json.JSONObject

/**
 * 主题消息监听器
 */
fun interface TopicListener {
    /**
     * 收到匹配主题的消息
     *
     * @param topic   消息主题
     * @param payload 负载数据
     */
    fun onMessageArrived(topic: String, payload: JSONObject?)
}
