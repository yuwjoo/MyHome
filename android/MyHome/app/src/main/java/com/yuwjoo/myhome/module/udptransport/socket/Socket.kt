package com.yuwjoo.myhome.module.udptransport.socket

import android.util.Log
import com.yuwjoo.myhome.module.udptransport.configs.SocketConfig
import com.yuwjoo.myhome.module.udptransport.utils.NetworkUtils
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.MulticastSocket

/**
 * UDP Socket 管理与收发
 */
internal class Socket(
    private val port: Int = SocketConfig.PORT,
    private val multicastAddr: String = SocketConfig.MULTICAST_ADDR,
    private val broadcastAddr: String = SocketConfig.BROADCAST_ADDR,
    private val bufferSize: Int = SocketConfig.BUFFER_SIZE,
) {

    companion object {
        private const val TAG = "Socket"
    }

    var listener: OnUdpSocketListener? = null // 消息监听器

    private var socket: MulticastSocket? = null
    private val localIps = mutableSetOf<String>() // 本机 IP 集合，用于自收过滤

    private val receiver = UdpReceiver(bufferSize) { data, fromIp ->
        if (fromIp !in localIps) {
            listener?.onMessageReceived(data, fromIp)
        }
    }

    private val multicastInet: InetAddress by lazy { InetAddress.getByName(multicastAddr) }
    private val broadcastInet: InetAddress by lazy { InetAddress.getByName(broadcastAddr) }

    val isOpen: Boolean get() = socket?.let { !it.isClosed } ?: false // Socket 是否打开

    /**
     * 创建 MulticastSocket、加入组播组、收集本机 IP、启动接收器
     */
    fun create(): Boolean {
        if (isOpen) return true

        socket = try {
            MulticastSocket(port).apply {
                broadcast = true
                loopbackMode = true
                soTimeout = 0
                reuseAddress = true
                joinGroup(multicastInet)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create socket: ${e.message}", e)
            listener?.onError(e)
            null
        }

        if (socket != null) {
            localIps.clear()
            localIps.addAll(NetworkUtils.collectLocalIps())
            receiver.start(socket!!)
            Log.i(TAG, "Socket created on port $port, joined $multicastAddr")
            return true
        }
        return false
    }

    /**
     * 销毁 Socket：停止接收器 → 离开组播组 → 关闭 → 清空本机 IP
     */
    fun destroy() {
        receiver.stop()
        socket?.let { s ->
            try { s.leaveGroup(multicastInet) } catch (_: Exception) {}
            try { s.close() } catch (_: Exception) {}
        }
        socket = null
        localIps.clear()
        Log.i(TAG, "Socket destroyed")
    }

    /**
     * 单播发送到指定 IP
     */
    fun sendUnicast(data: ByteArray, targetIp: String): Boolean {
        val s = checkSocket("sendUnicast") ?: return false
        return try {
            s.send(DatagramPacket(data, data.size, InetAddress.getByName(targetIp), port))
            true
        } catch (e: Exception) {
            Log.e(TAG, "sendUnicast to $targetIp error: ${e.message}")
            false
        }
    }

    /**
     * 组播发送到组播组
     */
    fun sendMulticast(data: ByteArray): Boolean {
        val s = checkSocket("sendMulticast") ?: return false
        return try {
            s.send(DatagramPacket(data, data.size, multicastInet, port))
            true
        } catch (e: Exception) {
            Log.e(TAG, "sendMulticast error: ${e.message}")
            false
        }
    }

    /**
     * 广播发送到子网
     */
    fun sendBroadcast(data: ByteArray): Boolean {
        val s = checkSocket("sendBroadcast") ?: return false
        return try {
            s.send(DatagramPacket(data, data.size, broadcastInet, port))
            true
        } catch (e: Exception) {
            Log.e(TAG, "sendBroadcast error: ${e.message}")
            false
        }
    }

    /**
     * 检查 Socket 是否可用
     */
    private fun checkSocket(op: String): MulticastSocket? {
        val s = socket
        if (s == null || s.isClosed) {
            Log.e(TAG, "$op: socket is not open")
            return null
        }
        return s
    }
}
