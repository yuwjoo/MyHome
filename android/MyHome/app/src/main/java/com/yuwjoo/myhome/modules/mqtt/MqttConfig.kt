package com.yuwjoo.myhome.modules.mqtt

internal object MqttConfig {
    const val BROKER_URL = "tcp://47.115.161.79:1883"
    const val USERNAME = "myhome"
    const val PASSWORD = "your_mqtt_password"
    const val KEEP_ALIVE = 60
    const val CLEAN_SESSION = true
    const val CONNECTION_TIMEOUT = 30
    const val MAX_RECONNECT_DELAY = 30
    // WILL_TOPIC 已迁移至 com.yuwjoo.myhome.config.MqttTopics.TOPIC_DEVICE_OFFLINE
    const val WILL_PAYLOAD = """{"status":"offline"}"""
    const val WILL_QOS = 1
    const val WILL_RETAINED = false
    const val CLIENT_ID = "android-myhome"

    /**
     * 返回 clientId，当前为固定值以配合遗嘱消息机制
     */
    fun clientId() = CLIENT_ID
}
