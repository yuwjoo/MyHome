package com.yuwjoo.myhome.module.udp

import android.util.Log
import com.yuwjoo.myhome.module.udp.listener.ConnectionListener
import com.yuwjoo.myhome.module.udp.listener.MessageListener
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.MulticastSocket
import java.net.NetworkInterface

/**
 * UDP 客户端（帧解码在接收线程中完成，无效帧直接丢弃）
 */
class UdpClient(
    private val multicastAddr: String = UdpConfig.MULTICAST_ADDR, // 组播组地址
    private val broadcastAddr: String = "255.255.255.255", // 广播地址
    private val port: Int = UdpConfig.PORT, // 端口（监听与发送共用）
    private val bufferSize: Int = UdpConfig.BUFFER_SIZE, // 接收缓冲区大小（字节）
) {

    companion object {
        private const val TAG = "UdpClient"
    }

    @Volatile
    private var socket: MulticastSocket? = null // 组播 socket
    private var loopThread: Thread? = null // 消息接收线程
    private var messageListener: MessageListener? = null // 消息监听器
    private var connectionListener: ConnectionListener? = null // 连接状态监听器

    @Volatile
    private var loopRunning = false // 控制循环线程生命周期

    private val localIps = mutableSetOf<String>() // 本机 IP 集合，用于过滤自收广播

    @Volatile
    private var connected = false // 是否已入组

    val isConnected: Boolean get() = connected // 是否已入组

    /**
     * 设置消息监听器
     */
    fun setMessageListener(listener: MessageListener?) {
        messageListener = listener
    }

    /**
     * 设置连接状态监听器
     */
    fun setConnectionListener(listener: ConnectionListener?) {
        connectionListener = listener
    }

    /**
     * 连接
     */
    @Synchronized
    fun connect() {
        if (connected) {
            Log.d(TAG, "connect: already connected")
            return
        }
        interruptLoop()
        cleanupSocket()
        if (!createSocket()) return
        collectLocalIps()
        startLoop()
        connected = true
        connectionListener?.onConnectionChanged(true)
        Log.d(TAG, "connect: joined ${multicastAddr}:${port}")
    }

    /**
     * 断开连接
     */
    @Synchronized
    fun disconnect() {
        if (!connected) return
        Log.d(TAG, "disconnect")
        interruptLoop()
        cleanupSocket()
        connected = false
        connectionListener?.onConnectionChanged(false)
    }

    /**
     * 发送单播数据
     *
     * @param data     帧字节
     * @param targetIp 目标 IP
     */
    fun sendUnicast(data: ByteArray, targetIp: String) {
        socket?.let { s ->
            if (s.isClosed) {
                Log.e(TAG, "sendUnicast: not connected")
                return
            }
            try {
                s.send(DatagramPacket(data, data.size, InetAddress.getByName(targetIp), port))
            } catch (e: Exception) {
                Log.e(TAG, "sendUnicast error: ${e.message}", e)
            }
        } ?: Log.e(TAG, "sendUnicast: not connected")
    }

    /**
     * 发送组播数据
     *
     * @param data 帧字节
     */
    fun sendMulticast(data: ByteArray) {
        socket?.let { s ->
            if (s.isClosed) {
                Log.e(TAG, "sendMulticast: not connected")
                return
            }
            try {
                s.send(DatagramPacket(data, data.size, InetAddress.getByName(multicastAddr), port))
            } catch (e: Exception) {
                Log.e(TAG, "sendMulticast error: ${e.message}", e)
            }
        } ?: Log.e(TAG, "sendMulticast: not connected")
    }

    /**
     * 发送广播数据
     *
     * @param data 帧字节
     */
    fun sendBroadcast(data: ByteArray) {
        socket?.let { s ->
            if (s.isClosed) {
                Log.e(TAG, "sendBroadcast: not connected")
                return
            }
            try {
                s.send(DatagramPacket(data, data.size, InetAddress.getByName(broadcastAddr), port))
            } catch (e: Exception) {
                Log.e(TAG, "sendBroadcast error: ${e.message}", e)
            }
        } ?: Log.e(TAG, "sendBroadcast: not connected")
    }

    /**
     * 创建 socket 并加入组播组
     *
     * @return 是否成功
     */
    private fun createSocket(): Boolean {
        socket = try {
            MulticastSocket(port).apply {
                broadcast = true
                loopbackMode = true
                soTimeout = 0
                joinGroup(InetAddress.getByName(multicastAddr))
            }
        } catch (e: Exception) {
            Log.e(TAG, "join group error: ${e.message}", e)
            null
        }
        return socket != null
    }

    /**
     * 收集本机活跃网卡 IP，用于过滤自收广播
     */
    private fun collectLocalIps() {
        localIps.clear()
        try {
            val nis = NetworkInterface.getNetworkInterfaces()
            while (nis.hasMoreElements()) {
                val ni = nis.nextElement()
                if (!ni.isUp || ni.isLoopback || !ni.supportsMulticast()) continue
                val addrs = ni.inetAddresses
                while (addrs.hasMoreElements()) {
                    localIps.add(addrs.nextElement().hostAddress ?: continue)
                }
            }
        } catch (_: Exception) {
        }
    }

    /**
     * 启动接收线程
     */
    private fun startLoop() {
        val buffer = ByteArray(bufferSize)
        loopRunning = true
        loopThread = Thread({
            while (loopRunning && !Thread.currentThread().isInterrupted) {
                receiveMessage(buffer)
            }
        }, "udp-loop").apply {
            isDaemon = true
            start()
        }
    }

    /**
     * 接收消息
     */
    private fun receiveMessage(buffer: ByteArray) {
        val s = socket ?: return
        val packet = try {
            val p = DatagramPacket(buffer, buffer.size)
            s.receive(p)
            p
        } catch (e: Exception) {
            Log.w(TAG, "receive error: ${e.message}")
            return
        }
        val fromIp = packet.address?.hostAddress ?: ""
        if (fromIp in localIps) return
        val raw = packet.data.copyOf(packet.length)
        val frame = UdpFrame.decode(raw, 0, raw.size) ?: return // 魔数不匹配则丢弃
        messageListener?.onMessage(frame, fromIp, packet.port)
    }

    /**
     * 中断接收线程
     */
    private fun interruptLoop() {
        loopRunning = false
        loopThread?.interrupt()
    }

    /**
     * 清理旧 socket
     */
    private fun cleanupSocket() {
        socket?.let { s ->
            try {
                s.leaveGroup(InetAddress.getByName(multicastAddr))
            } catch (_: Exception) {
            }
            try {
                s.close()
            } catch (_: Exception) {
            }
        }
        socket = null
    }
}


