package com.yuwjoo.myhome.feature.telecontrol.utils

import org.json.JSONObject

/**
 * 消息工具类
 */
object MessageUtil {

    /**
     * 消息体数据类
     */
    data class MessageBody(val topic: String, val data: Any? = null) {

        companion object {
            /**
             * 解析消息
             * @param msg 消息文本
             * @return 消息对象
             */
            fun parse(msg: String): MessageBody? {
                try {
                    val json = JSONObject(msg)
                    return MessageBody(json.optString("topic"), json.opt("data"))
                } catch (e: Exception) {
                    return null
                }
            }

            /**
             * 创建消息文本
             * @param topic 主题
             * @param data 数据
             * @return 消息文本
             */
            fun text(topic: String, data: Any? = null): String {
                return MessageBody(topic, data).toString()
            }
        }

        override fun toString(): String {
            val json = JSONObject()
            json.put("topic", topic)
            json.put("data", data)
            return json.toString()
        }
    }

    /**
     * 动作消息数据类
     */
    data class ActionMessage(val action: String, val params: Any? = null) {

        companion object {
            /**
             * 解析消息
             * @param msg 消息文本
             * @return 动作对象
             */
            fun parse(msg: String): ActionMessage? {
                try {
                    val json = JSONObject(msg)
                    return ActionMessage(json.optString("action"), json.opt("params"))
                } catch (e: Exception) {
                    return null
                }
            }

            /**
             * 创建消息文本
             * @param action 动作
             * @param params 参数
             * @return 消息文本
             */
            fun text(action: String, params: Any? = null): String {
                return ActionMessage(action, params).toString()
            }
        }

        override fun toString(): String {
            val json = JSONObject()
            json.put("action", action)
            json.put("params", params)
            return json.toString()
        }
    }
}