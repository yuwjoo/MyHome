package com.yuwjoo.myhome.module.udp.client

import android.util.Log
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.MulticastSocket
import java.net.NetworkInterface

/**
 * UDP Socket 管理：创建/销毁 Socket、单播/组播/广播发送、本机 IP 收集，
 * 内部持有 [SocketReader] 负责协程循环接收并解码。
 */
internal class UdpSocket {

    companion object {
        private const val TAG = "UdpSocket"
    }

    @Volatile private var socket: MulticastSocket? = null // 组播 socket

    private val localIps = mutableSetOf<String>() // 本机 IP 集合（用于过滤自收报文）

    private val reader = SocketReader(this) // 帧读取器

    private val multicastAddr: InetAddress by lazy { // 组播地址
        InetAddress.getByName(ClientConfig.MULTICAST_ADDR)
    }

    private val broadcastAddr: InetAddress by lazy { // 广播地址
        InetAddress.getByName(ClientConfig.BROADCAST_ADDR)
    }

    val isOpen: Boolean get() = socket?.let { !it.isClosed } ?: false // Socket 是否已创建且未关闭
    val isReading: Boolean get() = reader.isRunning // 帧读取器是否正在运行

    // 接收消息回调，由外部赋值
    var onFrameReceived: ((frame: FrameData, fromIp: String) -> Unit)?
        get() = reader.onFrameReceived
        set(value) { reader.onFrameReceived = value }

    /**
     * 创建 MulticastSocket 并加入组播组，成功后自动启动帧读取协程
     *
     * @return 是否创建成功
     */
    fun create(): Boolean {
        if (isOpen) return true

        socket = try {
            MulticastSocket(ClientConfig.PORT).apply {
                broadcast = true // 允许发送广播报文
                loopbackMode = true // 不接收本机自己发出的组播
                soTimeout = 0 // 阻塞接收
                reuseAddress = true // 允许多个 Socket 绑定同一端口
                joinGroup(multicastAddr)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create socket: ${e.message}", e)
            null
        }

        if (socket != null) {
            collectLocalIps()
            reader.start()
            Log.i(TAG, "Socket created on port ${ClientConfig.PORT}, joined ${ClientConfig.MULTICAST_ADDR}")
            return true
        }
        return false
    }

    /**
     * 销毁 Socket：停止帧读取 → 离开组播组 → 关闭
     */
    fun destroy() {
        reader.stop()
        socket?.let { s ->
            try {
                s.leaveGroup(multicastAddr)
            } catch (_: Exception) {}
            try {
                s.close()
            } catch (_: Exception) {}
        }
        socket = null
        localIps.clear()
        Log.i(TAG, "Socket destroyed")
    }

    /**
     * 阻塞式接收一个 UDP 报文
     *
     * @param buffer 接收缓冲区
     * @return DatagramPacket 或 null（异常时）
     */
    fun receive(buffer: ByteArray): DatagramPacket? {
        val s = socket ?: return null
        if (s.isClosed) return null

        return try {
            val packet = DatagramPacket(buffer, buffer.size)
            s.receive(packet)
            packet
        } catch (e: Exception) {
            if (s.isClosed) null
            else {
                Log.w(TAG, "receive error: ${e.message}")
                null
            }
        }
    }

    /**
     * 单播发送到指定 IP
     *
     * @param data     待发送数据
     * @param targetIp 目标 IP
     * @return 是否发送成功
     */
    fun sendUnicast(data: ByteArray, targetIp: String): Boolean {
        val s = socket ?: run {
            Log.e(TAG, "sendUnicast: socket is null")
            return false
        }
        if (s.isClosed) {
            Log.e(TAG, "sendUnicast: socket is closed")
            return false
        }
        return try {
            s.send(DatagramPacket(data, data.size, InetAddress.getByName(targetIp), ClientConfig.PORT))
            true
        } catch (e: Exception) {
            Log.e(TAG, "sendUnicast to $targetIp error: ${e.message}")
            false
        }
    }

    /**
     * 组播发送到组播组
     *
     * @param data 待发送数据
     * @return 是否发送成功
     */
    fun sendMulticast(data: ByteArray): Boolean {
        val s = socket ?: run {
            Log.e(TAG, "sendMulticast: socket is null")
            return false
        }
        if (s.isClosed) {
            Log.e(TAG, "sendMulticast: socket is closed")
            return false
        }
        return try {
            s.send(DatagramPacket(data, data.size, multicastAddr, ClientConfig.PORT))
            true
        } catch (e: Exception) {
            Log.e(TAG, "sendMulticast error: ${e.message}")
            false
        }
    }

    /**
     * 广播发送到子网
     *
     * @param data 待发送数据
     * @return 是否发送成功
     */
    fun sendBroadcast(data: ByteArray): Boolean {
        val s = socket ?: run {
            Log.e(TAG, "sendBroadcast: socket is null")
            return false
        }
        if (s.isClosed) {
            Log.e(TAG, "sendBroadcast: socket is closed")
            return false
        }
        return try {
            s.send(DatagramPacket(data, data.size, broadcastAddr, ClientConfig.PORT))
            true
        } catch (e: Exception) {
            Log.e(TAG, "sendBroadcast error: ${e.message}")
            false
        }
    }

    /**
     * 判断指定 IP 是否为本机地址（用于自收过滤）
     *
     * @param ip IP 地址
     */
    fun isLocalAddress(ip: String): Boolean = ip in localIps

    /**
     * 收集本机活跃网卡 IP
     */
    private fun collectLocalIps() {
        localIps.clear()
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val ni = interfaces.nextElement()
                if (!ni.isUp || ni.isLoopback) continue
                val addrs = ni.inetAddresses
                while (addrs.hasMoreElements()) {
                    localIps.add(addrs.nextElement().hostAddress ?: continue)
                }
            }
            Log.d(TAG, "Local IPs: $localIps")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to collect local IPs: ${e.message}")
        }
    }
}
