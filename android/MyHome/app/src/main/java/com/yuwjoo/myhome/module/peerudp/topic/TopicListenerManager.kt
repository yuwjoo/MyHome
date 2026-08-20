package com.yuwjoo.myhome.module.peerudp.topic

import android.util.Log
import com.yuwjoo.myhome.common.ListenerRegistry
import com.yuwjoo.myhome.module.peerudp.frame.FrameData
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import org.json.JSONObject

/**
 * 主题监听管理器：仅负责主题监听器的注册、取消注册与消息分发
 *
 * @param transport 底层传输器（用于注册 JSON 帧监听，由 PeerUdp 统一转发）
 */
internal class TopicListenerManager {

    companion object {
        private const val TAG = "TopicListenerManager"
    }

    private val listeners =
        ListenerRegistry<String, (topic: String, payload: JSONObject?) -> Unit>() // 主题消息监听器

    /**
     * 注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 消息到达时的回调
     */
    fun registerListener(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        listeners.register(topic, callback)
    }

    /**
     * 取消注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 待移除的回调
     */
    fun unregisterListener(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        listeners.unregister(topic, callback)
    }

    /**
     * 解析收到的 JSON 帧并分发给对应主题的监听器
     *
     * @param frame  收到的帧数据
     * @param fromIp 来源 IP
     */
    fun dispatchMessage(frame: FrameData, fromIp: String) {
        if (frame.type != FrameConfig.Type.JSON) return
        try {
            val json = JSONObject(String(frame.payload, Charsets.UTF_8))
            val topicMsg = jsonToTopicMessage(json) ?: return
            listeners.dispatch(topicMsg.topic) { it(topicMsg.topic, topicMsg.payload) }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse incoming message from $fromIp: ${e.message}")
        }
    }
}
