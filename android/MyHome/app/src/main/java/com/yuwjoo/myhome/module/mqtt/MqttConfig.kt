package com.yuwjoo.myhome.module.mqtt

/**
 * MQTT 连接配置常量，仅 [MqttManager] 内部使用。
 */
internal object MqttConfig {
    /** Broker 地址 */
    const val BROKER_URL = "tcp://47.115.161.79:1883"

    /** 认证用户名 */
    const val USERNAME = "myhome"

    /** 认证密码 */
    const val PASSWORD = "36c28zkat0tm6w9/"

    /** 心跳间隔（秒），超时 Broker 发布遗嘱 */
    const val KEEP_ALIVE = 10

    /** 缓存会话，false 表示 Broker 记住订阅，重连后自动恢复 */
    const val CLEAN_SESSION = true

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

    /** 是否启用遗嘱消息 */
    const val ENABLE_WILL = false

    /**
     * 返回动态客户端 ID，格式 "mh-client-{品牌}-{型号}"。
     * 品牌取自 [android.os.Build.MANUFACTURER]，型号取自 [android.os.Build.MODEL]，特殊字符替换为下划线。
     */
    fun clientId(): String {
        val brand = android.os.Build.MANUFACTURER.replace(Regex("[^a-zA-Z0-9\\-_]"), "_")
        val model = android.os.Build.MODEL.replace(Regex("[^a-zA-Z0-9\\-_]"), "_")
        return "mh-client-${brand}-$model"
    }
}
