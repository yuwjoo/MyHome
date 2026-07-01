package com.yuwjoo.myhome.module.mqtt

/**
 * 主题订阅状态
 */
enum class TopicStatus {
    // 待订阅
    PENDING,
    // 订阅成功
    SUCCESS,
    // 订阅失败
    FAILED,
}

/**
 * 主题条目
 *
 * @property topic  MQTT 主题
 * @property qos    服务质量
 * @property status 订阅状态
 */
data class TopicEntry(
    val topic: String,
    val qos: Int,
    var status: TopicStatus = TopicStatus.PENDING,
) {
    /** 
     * 标记为待订阅
     */
    fun toPending() {
        status = TopicStatus.PENDING
    }

    /**
     * 标记为订阅成功
     */
    fun toSuccess() {
        status = TopicStatus.SUCCESS
    }

    /** 
     * 标记为订阅失败
     */
    fun toFailed() {
        status = TopicStatus.FAILED
    }
}

/**
 * 主题管理类
 */
class TopicManager {

    // 主题映射表
    private val topics = mutableMapOf<String, TopicEntry>()

    // 主题消息监听器映射表
    private val listeners = mutableMapOf<String, LinkedHashSet<TopicCallback>>()

    /**
     * 获取主题列表
     */
    fun getTopicList(): List<TopicEntry> = topics.values.toList()

    /**
     * 获取主题
     *
     * @return 不存在时返回 null
     */
    fun getTopic(topic: String): TopicEntry? = topics[topic]

    /**
     * 保存主题
     *
     * @param topic 主题名称
     * @param qos   服务质量
     * @return 新保存或已存在的 [TopicEntry]
     */
    fun saveTopic(topic: String, qos: Int): TopicEntry {
        return topics.getOrPut(topic) {
            TopicEntry(topic, qos)
        }
    }

    /**
     * 移除主题
     *
     * @return 被移除的条目，不存在时返回 null
     */
    fun removeTopic(topic: String): TopicEntry? = topics.remove(topic)

    /**
     * 清除主题
     */
    fun clearTopics() {
        topics.clear()
    }

    /**
     * 注册主题消息监听器
     *
     * @param topic    主题名称
     * @param callback 消息回调
     */
    fun registerListener(topic: String, callback: TopicCallback) {
        listeners.getOrPut(topic) { LinkedHashSet() }.add(callback)
    }

    /**
     * 移除主题消息监听器
     *
     * @param topic    主题名称
     * @param callback 要移除的回调
     * @return 是否移除成功
     */
    fun unregisterListener(topic: String, callback: TopicCallback): Boolean {
        val list = listeners[topic] ?: return false
        return list.remove(callback)
    }

    /**
     * 清除全部监听器
     */
    fun clearListeners() {
        listeners.clear()
    }

    /**
     * 获取指定主题的监听器列表
     *
     * @param topic 主题名称
     * @return 监听器列表，不存在时返回空列表
     */
    fun getListeners(topic: String): List<TopicCallback> {
        return listeners[topic]?.toList() ?: emptyList()
    }

    /**
     * 通知主题消息监听器
     *
     * 匹配规则：
     * - 精确匹配：`home/bedroom` ↔ `home/bedroom`
     * - `+` 通配单层：`home/+/sensor` ↔ `home/bedroom/sensor`
     * - `#` 通配多层：`home/#` ↔ `home/bedroom`、`home/bedroom/sensor`
     *
     * @param topic   消息主题
     * @param payload 消息内容
     */
    fun notifyListeners(topic: String, payload: String) {
        listeners.forEach { (pattern, callbackList) ->
            if (matchesTopic(pattern, topic)) {
                callbackList.forEach { it.onMessageArrived(topic, payload) }
            }
        }
    }

    /**
     * 匹配主题
     *
     * @param pattern 匹配模式，可含 + / # 通配符
     * @param topic   消息到达的实际主题
     * @return 是否匹配
     */
    private fun matchesTopic(pattern: String, topic: String): Boolean {
        val patternSegments = pattern.split("/")
        val topicSegments = topic.split("/")

        for (i in patternSegments.indices) {
            val seg = patternSegments[i]
            when {
                seg == "#" -> return i == patternSegments.lastIndex
                seg == "+" -> {
                    if (i >= topicSegments.size) return false
                }
                else -> {
                    if (seg != topicSegments.getOrElse(i) { return false }) return false
                }
            }
        }
        return patternSegments.size == topicSegments.size
    }
}
