package com.yuwjoo.myhome.module.peerudp.transport

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.peerudp.config.SocketConfig
import java.net.InetAddress

/**
 * UDP传输器
 */
internal class Transport {

    companion object {
        private const val TAG = "Transport"
    }

    private val multicastInet: InetAddress by lazy { InetAddress.getByName(SocketConfig.MULTICAST_ADDRESS) } // 组播地址
    private val broadcastInet: InetAddress by lazy { InetAddress.getByName(SocketConfig.BROADCAST_ADDRESS) } // 广播地址

    private val networkMonitor: NetworkMonitor // 网络监听
    private var udpSocket: UdpSocket? = null // 底层 Socket

    val isStart: Boolean get() = udpSocket?.isClosed?.not() ?: false // 当前是否已启动

    var onMessageReceived: ((ByteArray, String) -> Unit)? = null // 收到消息回调
    var onStartChanged: ((Boolean) -> Unit)? = null // 启动状态变化回调（网络断开/恢复时触发）

    init {
        networkMonitor = NetworkMonitor { available ->
            if (available) {
                createSocket()
            } else {
                closeSocket()
            }
        }
    }

    /**
     * 启动网络监听，网络可用时自动创建 Socket，断开时自动关闭
     *
     * @param context 用于注册网络监听的 Context
     */
    fun start(context: Context) {
        networkMonitor.start(context)
        Log.i(TAG, "Transport started")
    }

    /**
     * 停止网络监听并关闭 Socket
     */
    fun stop() {
        networkMonitor.stop()
        closeSocket()
        Log.i(TAG, "Transport stopped")
    }

    /**
     * 创建 Socket 并启动接收循环
     */
    @Synchronized
    private fun createSocket() {
        if (udpSocket != null) return
        udpSocket = UdpSocket(
            port = SocketConfig.PORT,
            multicastAddress = SocketConfig.MULTICAST_ADDRESS,
            bufferSize = SocketConfig.BUFFER_SIZE,
        ) { data, fromIp ->
            onMessageReceived?.invoke(data, fromIp)
        }
        onStartChanged?.invoke(true)
        Log.i(TAG, "Socket created on port ${SocketConfig.PORT}")
    }

    /**
     * 关闭 Socket
     */
    @Synchronized
    private fun closeSocket() {
        if (udpSocket == null) return
        udpSocket?.close()
        udpSocket = null
        onStartChanged?.invoke(false)
        Log.i(TAG, "Socket closed")
    }

    /**
     * 单播发送到指定 IP
     *
     * @param data     待发送字节数组
     * @param targetIp 目标 IP 地址
     * @return true 发送成功，false 发送失败
     */
    fun sendUnicast(data: ByteArray, targetIp: String): Boolean {
        return try {
            udpSocket?.send(data, InetAddress.getByName(targetIp), SocketConfig.PORT) ?: false
        } catch (e: Exception) {
            Log.e(TAG, "sendUnicast to $targetIp error: ${e.message}")
            false
        }
    }

    /**
     * 组播发送到组播组
     *
     * @param data 待发送字节数组
     * @return true 发送成功，false 发送失败
     */
    fun sendMulticast(data: ByteArray): Boolean {
        return udpSocket?.send(data, multicastInet, SocketConfig.PORT) ?: false
    }

    /**
     * 广播发送到子网
     *
     * @param data 待发送字节数组
     * @return true 发送成功，false 发送失败（Socket 未启动时返回 false）
     */
    fun sendBroadcast(data: ByteArray): Boolean {
        return udpSocket?.send(data, broadcastInet, SocketConfig.PORT) ?: false
    }
}
