package com.yuwjoo.myhome.module.udp.listener

/**
 * 消息监听器
 */
fun interface MessageListener {
    /**
     * 收到新消息时回调
     *
     * @param data     消息数据
     * @param fromIp   发送方 IP
     * @param fromPort 发送方端口
     */
    fun onMessage(data: ByteArray, fromIp: String, fromPort: Int)
}
