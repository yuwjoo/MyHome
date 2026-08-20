package com.yuwjoo.myhome.module.peerudp.transport

import android.util.Log
import com.yuwjoo.myhome.module.peerudp.config.SocketConfig
import com.yuwjoo.myhome.module.peerudp.frame.FrameCodec
import com.yuwjoo.myhome.module.peerudp.frame.FrameData
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
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

    private var udpSocket: UdpSocket? = null // 底层 Socket
    private val listeners = mutableMapOf<Byte, MutableList<(FrameData, String) -> Unit>>() // 帧类型监听表

    var onOpenChanged: ((Boolean) -> Unit)? = null // 打开状态改变回调

    val isOpen: Boolean get() = udpSocket?.isClosed?.not() ?: false // 当前是否已打开

    /**
     * 打开：创建 Socket 并启动接收循环
     */
    fun open() {
        if (udpSocket != null) return
        udpSocket = UdpSocket(
            port = SocketConfig.PORT,
            multicastAddress = SocketConfig.MULTICAST_ADDRESS,
            bufferSize = SocketConfig.BUFFER_SIZE,
        ) { data, fromIp ->
            onPacket(data, fromIp)
        }
        Log.i(TAG, "Socket created on port ${SocketConfig.PORT}")
        onOpenChanged?.invoke(true)
    }

    /**
     * 关闭：关闭 Socket
     */
    fun close() {
        if (udpSocket == null) return
        udpSocket?.close()
        udpSocket = null
        Log.i(TAG, "Socket closed")
        onOpenChanged?.invoke(false)
    }

    /**
     * 发送帧消息
     *
     * @param type     帧类型
     * @param data     帧负载
     * @param seqNum   消息序号，为 null 表示无序消息，非 null 为有序消息
     * @param targetIp 目标 IP，为 null 时广播发送，非 null 为单播
     * @return 是否发送成功
     */
    fun sendFrame(type: Byte, data: ByteArray, seqNum: Int?, targetIp: String?): Boolean {
        val flags = if (seqNum != null) FrameConfig.Flags.ORDERED else FrameConfig.Flags.NONE
        val frame = FrameCodec.encode(type, seqNum ?: 0, flags, data)
        return if (targetIp != null) {
            sendUnicast(frame, targetIp)
        } else {
            sendBroadcast(frame)
        }
    }

    /**
     * 注册帧消息监听
     *
     * @param type     要监听的帧类型
     * @param callback 收到该类型帧时的回调（帧数据、来源 IP）
     */
    fun registerFrameListener(type: Byte, callback: (FrameData, String) -> Unit) {
        listeners.getOrPut(type) { mutableListOf() }.add(callback)
    }

    /**
     * 取消注册帧消息监听
     *
     * @param callback 之前注册的回调
     */
    fun unregisterFrameListener(callback: (FrameData, String) -> Unit) {
        listeners.values.forEach { it.remove(callback) }
    }

    /**
     * 收到数据包：解码后按帧类型分发到对应监听回调
     */
    private fun onPacket(data: ByteArray, fromIp: String) {
        val frame = FrameCodec.decode(data) ?: return
        listeners[frame.type]?.forEach { it(frame, fromIp) }
    }
    
    /**
     * 单播发送到指定 IP
     *
     * @param frame    编码后的完整帧
     * @param targetIp 目标 IP 地址
     * @return true 发送成功，false 发送失败
     */
    private fun sendUnicast(frame: ByteArray, targetIp: String): Boolean {
        return try {
            udpSocket?.send(frame, InetAddress.getByName(targetIp), SocketConfig.PORT) ?: false
        } catch (e: Exception) {
            Log.e(TAG, "sendUnicast to $targetIp error: ${e.message}")
            false
        }
    }

    /**
     * 组播发送到组播组
     *
     * @param frame 编码后的完整帧
     * @return true 发送成功，false 发送失败（Socket 未打开时返回 false）
     */
    private fun sendMulticast(frame: ByteArray): Boolean {
        return udpSocket?.send(frame, multicastInet, SocketConfig.PORT) ?: false
    }

    /**
     * 广播发送到子网
     *
     * @param frame 编码后的完整帧
     * @return true 发送成功，false 发送失败（Socket 未打开时返回 false）
     */
    private fun sendBroadcast(frame: ByteArray): Boolean {
        return udpSocket?.send(frame, broadcastInet, SocketConfig.PORT) ?: false
    }
}
