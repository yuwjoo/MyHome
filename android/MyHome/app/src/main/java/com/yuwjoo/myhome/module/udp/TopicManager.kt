package com.yuwjoo.myhome.module.udp

import android.util.Log
import com.yuwjoo.myhome.common.ListenerRegistry
import org.json.JSONObject

/**
 * 主题管理器，维护主题与监听器的映射关系及消息解析。
 */
class TopicManager {

    companion object {
        private const val TAG = "TopicManager"
        private const val KEY_TOPIC = "topic"
        private const val KEY_PAYLOAD = "payload"

        /**
         * 构造主题消息
         *
         * @param topic   主题名称
         * @param payload 负载内容，null 表示不携带 payload 字段
         * @return JSON 字符串的 UTF-8 字节数组
         */
        fun buildMessage(topic: String, payload: JSONObject? = null): ByteArray {
            val json = JSONObject()
            json.put(KEY_TOPIC, topic)
            if (payload != null) json.put(KEY_PAYLOAD, payload)
            return json.toString().toByteArray(Charsets.UTF_8)
        }

        /**
         * 解析消息，提取主题和负载
         *
         * @param raw 原始消息文本
         * @return 解析结果，失败返回 null
         */
        fun parseMessage(raw: String): TopicMessage? {
            return try {
                val json = JSONObject(raw)
                val topic = json.optString(KEY_TOPIC, "").takeIf { it.isNotEmpty() } ?: return null
                val payload = if (json.has(KEY_PAYLOAD)) json.getJSONObject(KEY_PAYLOAD) else null
                TopicMessage(topic, payload)
            } catch (e: Exception) {
                Log.e(TAG, "parseMessage error: ${e.message}", e)
                null
            }
        }
    }

    private val listeners = ListenerRegistry<String, UdpTopicCallback>()

    /**
     * 注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 消息回调
     */
    fun registerListener(topic: String, callback: UdpTopicCallback) {
        listeners.register(topic, callback)
    }

    /**
     * 取消注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 要移除的监听器
     */
    fun unregisterListener(topic: String, callback: UdpTopicCallback) {
        listeners.unregister(topic, callback)
    }

    /**
     * 清空指定主题的全部监听器
     *
     * @param topic 主题名称
     */
    fun clearTopicListeners(topic: String) {
        listeners.clearKey(topic)
    }

    /**
     * 清空所有监听器
     */
    fun clearListeners() {
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
}

/**
 * 主题消息，包含主题名称和负载数据。
 */
data class TopicMessage(
    val topic: String, // 主题名称
    val payload: JSONObject? = null, // 负载数据
)
