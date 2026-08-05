package com.yuwjoo.myhome.module.udptransport.socket

/**
 * UDP Socket 监听接口
 */
interface OnUdpSocketListener {

    /**
     * 收到原始消息数据
     *
     * @param data   原始字节数据
     * @param fromIp 来源 IP 地址
     */
    fun onMessageReceived(data: ByteArray, fromIp: String)

    /**
     * Socket 发生异常
     *
     * @param cause 异常信息
     */
    fun onError(cause: Exception)
}
