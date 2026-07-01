package com.yuwjoo.myhome.common.topic.payload

import com.yuwjoo.myhome.common.topic.base.PayloadDef
import com.yuwjoo.myhome.common.topic.enums.ACAction
import com.yuwjoo.myhome.common.topic.utils.enumByValue
import org.json.JSONObject

/**
 * 卧室空调遥控指令负载
 *
 * @property action 遥控指令
 * @property params 指令参数，仅定时类指令携带
 */
data class CmdBedroomACPayload(
    var action: ACAction = ACAction.TOGGLE_POWER,
    var params: Map<String, Any>? = null,
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
        action = enumByValue(obj.optString("action", ""), ACAction.TOGGLE_POWER) { it.value }
        params = if (obj.has("params")) {
            val p = obj.getJSONObject("params")
            val map = mutableMapOf<String, Any>()
            p.keys().forEach { map[it] = p.get(it) }
            map
        } else {
            null
        }
    }

    /**
     * 构造 JSON
     */
    override fun toJson(): String {
        val obj = JSONObject().apply { put("action", action.value) }
        if (params != null) {
            obj.put("params", JSONObject(params!!))
        }
        return obj.toString()
    }
}
