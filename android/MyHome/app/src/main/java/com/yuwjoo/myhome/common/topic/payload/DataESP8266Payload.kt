package com.yuwjoo.myhome.common.topic.payload

import com.yuwjoo.myhome.common.topic.base.PayloadDef
import org.json.JSONObject

/**
 * ESP8266 上报数据负载
 *
 * @property isOnline   是否在线
 * @property updateTime 更新时间戳
 */
data class DataESP8266Payload(
    var isOnline: Boolean = false,
    var updateTime: Long = 0L,
) : PayloadDef() {
    /**
     * 基于 JSON 字符串构造
     *
     * @param json MQTT 消息内容
     */
    constructor(json: String) : this() {
        fromJson(json)
    }

    /**
     * 解析 JSON
     *
     * @param json MQTT 消息内容
     */
    override fun fromJson(json: String) {
        val obj = JSONObject(json)
        isOnline = obj.optBoolean("isOnline", false)
        updateTime = obj.optLong("updateTime", 0L)
    }

    /**
     * 构造 JSON
     */
    override fun toJson(): String {
        return JSONObject().apply {
            put("isOnline", isOnline)
            put("updateTime", updateTime)
        }.toString()
    }
}
