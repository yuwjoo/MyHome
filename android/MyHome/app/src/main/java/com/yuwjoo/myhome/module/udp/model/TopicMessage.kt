package com.yuwjoo.myhome.module.udp.model

import org.json.JSONObject

/**
 * 主题消息模型
 */
data class TopicMessage(
    val topic: String,
    val payload: JSONObject,
) {
    companion object {
        /**
         * 从 JSON 对象解析主题消息
         *
         * @param json JSON 对象
         * @return 解析后的 TopicMessage，解析失败返回 null
         */
        fun from(json: JSONObject): TopicMessage? {
            val topic = json.optString("topic") ?: return null
            val payloadObj = json.optJSONObject("payload") ?: JSONObject()
            return TopicMessage(topic, payloadObj)
        }

        /**
         * 将主题消息序列化为字节数组
         *
         * @param topic 主题名称
         * @param payload 负载数据
         * @return UTF-8 编码的 JSON 字节数组
         */
        fun toBytes(topic: String, payload: JSONObject): ByteArray {
            val json = JSONObject().apply {
                put("topic", topic)
                put("payload", payload)
            }
            return json.toString().toByteArray(Charsets.UTF_8)
        }
    }
}
