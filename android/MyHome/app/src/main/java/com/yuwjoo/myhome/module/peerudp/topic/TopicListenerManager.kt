package com.yuwjoo.myhome.module.peerudp.topic

import android.util.Log
import com.yuwjoo.myhome.module.peerudp.frame.FrameData
import com.yuwjoo.myhome.module.peerudp.transport.Transport
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import org.json.JSONObject

/**
 * 主题监听管理器：仅负责主题监听器的注册、取消注册与消息分发
 *
 * @param transport 底层传输器（用于注册 JSON 帧监听）
 */
internal class TopicListenerManager(
    private val transport: Transport, // udp传输器
) {

    companion object {
        private const val TAG = "TopicListenerManager"
    }

    private val listeners = HashMap<String, MutableList<(topic: String, payload: JSONObject?) -> Unit>>() // 主题消息监听器集合

    init {
        // 收到 JSON 帧 → 解析并分发给对应主题的监听器
        transport.registerFrameListener(FrameConfig.Type.JSON) { frame, fromIp ->
            dispatchMessage(frame, fromIp)
        }
    }

    /**
     * 注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 消息到达时的回调
     */
    fun registerListener(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        listeners.getOrPut(topic) { mutableListOf() }.add(callback)
    }

    /**
     * 取消注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 待移除的回调
     */
    fun unregisterListener(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        val list = listeners[topic] ?: return
        list.remove(callback)
        if (list.isEmpty()) listeners.remove(topic)
    }

    /**
     * 解析收到的 JSON 帧并分发给对应主题的监听器
     *
     * @param frame  收到的帧数据
     * @param fromIp 来源 IP
     */
    private fun dispatchMessage(frame: FrameData, fromIp: String) {
        if (frame.type != FrameConfig.Type.JSON) return
        try {
            val json = JSONObject(String(frame.payload, Charsets.UTF_8))
            val topicMsg = jsonToTopicMessage(json) ?: return
            listeners[topicMsg.topic]?.forEach { it(topicMsg.topic, topicMsg.payload) }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse incoming message from $fromIp: ${e.message}")
        }
    }
}
