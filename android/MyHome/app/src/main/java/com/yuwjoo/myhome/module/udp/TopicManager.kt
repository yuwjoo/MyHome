package com.yuwjoo.myhome.module.udp

import com.yuwjoo.myhome.common.ListenerRegistry
import com.yuwjoo.myhome.module.udp.listener.TopicListener
import org.json.JSONObject

/**
 * 主题管理器
 */
class TopicManager {

    private val listeners = ListenerRegistry<String, TopicListener>()

    /**
     * 注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 消息回调
     */
    fun registerListener(topic: String, callback: TopicListener) {
        listeners.register(topic, callback)
    }

    /**
     * 取消注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 要移除的监听器
     */
    fun unregisterListener(topic: String, callback: TopicListener) {
        listeners.unregister(topic, callback)
    }

    /**
     * 清空指定主题的全部监听器
     *
     * @param topic 主题名称
     */
    fun clearTopicListener(topic: String) {
        listeners.clearKey(topic)
    }

    /**
     * 清空所有监听器
     */
    fun clearAllTopicListener() {
        listeners.clearAll()
    }

    /**
     * 触发指定主题的所有监听器
     *
     * @param topic   主题名称
     * @param payload 负载数据
     */
    fun notifyListener(topic: String, payload: JSONObject?) {
        listeners.dispatch(topic) { it.onMessageArrived(topic, payload) }
    }



