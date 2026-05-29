package com.yuwjoo.myirrc.common.telecontrol.utils

import org.json.JSONObject

/**
 * 遥控助手
 */
object TelecontrolHelper {
    const val TOPIC_RC_BEDROOM_AC = "YHHome/RC/bedroomAC" // 卧室空调遥控消息主题
    const val TOPIC_DEVICE_BEDROOM_AC = "YHHome/device/bedroomAC" // 卧室空调设备消息主题

    /**
     * 遥控消息类
     */
    data class TelecontrolMessage(val topic: String, val data: Any?) {
        override fun toString(): String {
            val json = JSONObject()
            json.put("topic", topic)
            json.put("data", data)
            return json.toString()
        }
    }

    /**
     * 创建消息
     * @param topic 主题
     * @param data 数据
     * @return 消息字符串
     */
    fun createMessage(topic: String, data: Any? = null): String {
        val json = JSONObject()
        json.put("topic", topic)
        json.put("data", data)
        return json.toString()
    }

    /**
     * 解析消息
     * @param msg 消息文本
     * @return 遥控消息对象
     */
    fun parseMessage(msg: String): TelecontrolMessage {
        var telecontrolMessage: TelecontrolMessage
        try {
            val json = JSONObject(msg)
            telecontrolMessage = TelecontrolMessage(json.optString("topic"), json.opt("data"))
        } catch (e: Exception) {
            telecontrolMessage = TelecontrolMessage("", null)
        }

        return telecontrolMessage
    }
}