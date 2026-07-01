package com.yuwjoo.myhome.common.topic.payload

import com.yuwjoo.myhome.common.topic.base.PayloadDef
import org.json.JSONObject

/**
 * 温湿度传感器上报数据负载
 *
 * @property temperature 温度，单位 °C
 * @property humidity    湿度，单位 %
 */
data class DataTempHumidSensorPayload(
    var temperature: Float = 0f,
    var humidity: Float = 0f,
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
        temperature = obj.optDouble("temperature", 0.0).toFloat()
        humidity = obj.optDouble("humidity", 0.0).toFloat()
    }

    /**
     * 构造 JSON
     */
    override fun toJson(): String {
        return JSONObject().apply {
            put("temperature", temperature.toDouble())
            put("humidity", humidity.toDouble())
        }.toString()
    }
}
