package com.yuwjoo.myhome.utils.webviewbridge

class BridgeRouter {
    private val apiMap: HashMap<String, (payload: Any?, channel: BridgeChannel) -> Unit> =
        HashMap() // api map

    /**
     * 注册api
     * @param path api路径
     * @param handler 处理程序
     */
    fun <T> register(path: String, handler: (payload: T, channel: BridgeChannel) -> Unit) {
        @Suppress("UNCHECKED_CAST")
        apiMap[path] = handler as (Any?, BridgeChannel) -> Unit
    }

    /**
     * 获取api处理程序
     * @param path api路径
     * @return api处理程序
     */
    fun getApiHandler(path: String): ((payload: Any?, channel: BridgeChannel) -> Unit)? {
        return apiMap[path]
    }
}