package com.yuwjoo.myhomeserver.config

/**
 * MQTT 连接配置
 *
 * 与 MyHome 项目的 MQTT broker 保持一致，共用同一套认证信息。
 * 本 App 使用独立的 clientId 以区分客户端类型。
 */
object MqttConfig {
    const val BROKER_URL = "tcp://47.115.161.79:1883"
    const val USERNAME = "myhome"
    const val PASSWORD = "your_mqtt_password"
    const val KEEP_ALIVE = 60
    const val CONNECTION_TIMEOUT = 30
    const val MAX_RECONNECT_DELAY = 30

    const val CLEAN_SESSION = true
    const val WILL_QOS = 1
    const val WILL_RETAINED = false

    /** 遗嘱消息 payload */
    const val WILL_PAYLOAD = """{"status":"offline"}"""

    /** 固定 clientId，与遗嘱消息机制配合 */
    const val CLIENT_ID = "android-myhomeserver"

    fun clientId() = CLIENT_ID
}
