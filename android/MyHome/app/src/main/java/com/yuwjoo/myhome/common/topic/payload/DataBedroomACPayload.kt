package com.yuwjoo.myhome.common.topic.payload

import com.yuwjoo.myhome.common.topic.base.PayloadDef
import com.yuwjoo.myhome.common.topic.enums.ACMode
import com.yuwjoo.myhome.common.topic.enums.ACWindSpeed
import com.yuwjoo.myhome.common.topic.utils.enumByValue
import org.json.JSONObject

/**
 * 卧室空调上报数据负载
 *
 * @property power       电源开关
 * @property temperature 设定温度，范围 16~30
 * @property mode        运行模式
 * @property swing       摆风开关
 * @property windSpeed   风速
 * @property gentle      舒风模式
 * @property light       屏显开关
 * @property onTimer     定时开机剩余分钟数，0 为未设置
 * @property offTimer    定时关机剩余分钟数，0 为未设置
 */
data class DataBedroomACPayload(
    var power: Boolean = false,
    var temperature: Int = 26,
    var mode: ACMode = ACMode.COOL,
    var swing: Boolean = false,
    var windSpeed: ACWindSpeed = ACWindSpeed.AUTO,
    var gentle: Boolean = false,
    var light: Boolean = true,
    var onTimer: Int = 0,
    var offTimer: Int = 0,
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
        power = obj.optBoolean("power", false)
        temperature = obj.optInt("temperature", 26)
        mode = enumByValue(obj.optString("mode", "cool"), ACMode.COOL) { it.value }
        swing = obj.optBoolean("swing", false)
        windSpeed = enumByValue(obj.optString("windSpeed", "auto"), ACWindSpeed.AUTO) { it.value }
        gentle = obj.optBoolean("gentle", false)
        light = obj.optBoolean("light", true)
        onTimer = obj.optInt("onTimer", 0)
        offTimer = obj.optInt("offTimer", 0)
    }

    /**
     * 构造 JSON
     */
    override fun toJson(): String {
        return JSONObject().apply {
            put("power", power)
            put("temperature", temperature)
            put("mode", mode.value)
            put("swing", swing)
            put("windSpeed", windSpeed.value)
            put("gentle", gentle)
            put("light", light)
            put("onTimer", onTimer)
            put("offTimer", offTimer)
        }.toString()
    }
}
