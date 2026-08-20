package com.yuwjoo.myhome.module.peerudp.topic

import org.json.JSONObject

/**
 * 主题消息模型
 */
data class TopicMessage(
    val topic: String, // 主题名称
    val payload: JSONObject, // 负载数据
)

/**
 * 从 JSON 对象解析主题消息
 *
 * @param json JSON 对象
 * @return 解析后的 TopicMessage，解析失败返回 null
 */
fun jsonToTopicMessage(json: JSONObject): TopicMessage? {
    val topic = json.optString("topic") ?: return null
    val payloadObj = json.optJSONObject("payload") ?: JSONObject()
    return TopicMessage(topic, payloadObj)
}

/**
 * 将主题消息组包为 JSON 对象
 *
 * @param topic 主题名称
 * @param payload 负载数据
 * @return 组装后的 JSON 对象
 */
fun topicMessageToJson(topic: String, payload: JSONObject): JSONObject {
    return JSONObject().apply {
        put("topic", topic)
        put("payload", payload)
    }
}
