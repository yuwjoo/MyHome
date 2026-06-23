package com.yuwjoo.myhome.module.mqtt

/**
 * MQTT 连接配置常量，仅 [MqttCore] 内部使用。
 */
internal object MqttConfig {
    /** Broker 地址 */
    const val BROKER_URL = "tcp://47.115.161.79:1883"

    /** 认证用户名 */
    const val USERNAME = "myhome"

    /** 认证密码 */
    const val PASSWORD = "your_mqtt_password"

    /** 心跳间隔（秒），超时 Broker 发布遗嘱 */
    const val KEEP_ALIVE = 60

    /** 缓存会话，false 表示 Broker 记住订阅，重连后自动恢复 */
    const val CLEAN_SESSION = false

    /** 连接超时（秒） */
    const val CONNECTION_TIMEOUT = 30

    /** 断线自动重连 */
    const val AUTOMATIC_RECONNECT = true

    /** 重连最大延迟（秒） */
    const val MAX_RECONNECT_DELAY = 30

    /** 遗嘱消息体 */
    const val WILL_PAYLOAD = """{"status":"offline"}"""

    /** 遗嘱 QoS */
    const val WILL_QOS = 1

    /** 遗嘱是否保留 */
    const val WILL_RETAINED = false

    /** 客户端固定 ID，配合遗嘱消息机制 */
    private const val CLIENT_ID = "android-myhome"

    /**
     * 返回客户端 ID
     */
    fun clientId() = CLIENT_ID
}
