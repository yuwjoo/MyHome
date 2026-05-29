package com.yuwjoo.myhome.utils.webviewbridge

class BridgeChannel(private val bridge: WebViewBridge, private val id: String) {
    private val events: HashMap<String, HashSet<(payload: Any?) -> Unit>> = HashMap() // 监听事件map

    init {
        bridge.channelMap[id] = this
    }

    /**
     * 发送事件
     * @param eventName 事件名称
     * @param payload 负载
     */
    fun send(eventName: String, payload: Any? = null) {
        bridge.webInterface.triggerEvent(id, eventName, payload, isError = false, isDone = false)
    }

    /**
     * 发送结束事件
     * @param eventName 事件名称
     * @param payload 负载
     * @param isError 是否异常
     */
    fun done(eventName: String = "", payload: Any? = null, isError: Boolean = false) {
        bridge.webInterface.triggerEvent(id, eventName, payload, isError, true)
        close()
    }

    /**
     * 监听事件
     * @param eventName 事件名称
     * @param callback  回调函数
     */
    fun on(eventName: String, callback: (payload: Any?) -> Unit) {
        events.getOrPut(eventName) { HashSet() }.add(callback)
    }

    /**
     * 一次性监听事件
     * @param eventName 事件名称
     * @param callback  回调函数，触发后自动取消监听
     */
    fun only(eventName: String, callback: (payload: Any?) -> Unit) {
        val wrapper = object : (Any?) -> Unit {
            override fun invoke(payload: Any?) {
                callback(payload)
                events[eventName]?.remove(this)
            }
        }
        events.getOrPut(eventName) { HashSet() }.add(wrapper)
    }

    /**
     * 取消监听事件
     * @param eventName 事件名称
     * @param callback  要移除的回调函数
     */
    fun off(eventName: String, callback: (payload: Any?) -> Unit) {
        val callbacks = events[eventName]
        callbacks?.remove(callback)
        if (callbacks?.isEmpty() == true) {
            events.remove(eventName)
        }
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param payload      负载
     */
    fun emit(eventName: String, payload: Any?) {
        events[eventName]?.toList()?.forEach { it(payload) }
    }

    /**
     * 清除事件
     */
    fun clearEvent() {
        events.clear()
    }

    /**
     * 关闭通道
     */
    fun close() {
        clearEvent()
        bridge.channelMap.remove(id)
    }
}