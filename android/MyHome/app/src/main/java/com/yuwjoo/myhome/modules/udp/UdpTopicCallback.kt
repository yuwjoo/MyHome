package com.yuwjoo.myhome.modules.udp

interface UdpTopicCallback {
    /**
     * 收到匹配 Topic 的消息
     * @param topic   消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: Any?)
}
