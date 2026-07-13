package com.yuwjoo.myhome.module.udp.model

import org.json.JSONObject

/**
 * 主题消息
 */
data class TopicMessage(
    val topic: String, // 主题名称
    val payload: JSONObject? = null, // 负载数据
) {
    companion object {
        /**
         * 从 JSON 对象构造主题消息
         *
         * @param json JSON 对象
         * @return 主题消息
         */
        fun from(json: JSONObject): TopicMessage? {
            val topic = json.optString("topic", "").takeIf { it.isNotEmpty() } ?: return null
            val payload = if (json.has("payload")) json.optJSONObject("payload") else null
            return TopicMessage(topic, payload)
        }

        /**
         * 从原始文本解析主题消息
         *
         * @param raw 原始消息文本
         * @return 主题消息
         */
        fun from(raw: String): TopicMessage? {
            return try {
                from(JSONObject(raw))
            } catch (e: Exception) {
                null
            }
        }

        /**
         * 将主题消息导出为 JSON 对象
         *
         * @param message 主题消息
         * @return JSONObject
         */
        fun toObject(message: TopicMessage): JSONObject {
            val json = JSONObject()
            json.put("topic", message.topic)
            if (message.payload != null) json.put("payload", message.payload)
            return json
        }

        /**
         * 构造主题消息的字节数组
         *
         * @param topic   主题名称
         * @param payload 负载内容
         * @return UTF-8 字节数组
         */
        fun toBytes(topic: String, payload: JSONObject? = null): ByteArray {
            val msg = TopicMessage(topic, payload)
            return toObject(msg).toString().toByteArray(Charsets.UTF_8)
        }
    }
}
