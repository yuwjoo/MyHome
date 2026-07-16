package com.yuwjoo.myhome.module.udp

import android.util.Log
import com.yuwjoo.myhome.module.udp.listener.ConnectionListener
import com.yuwjoo.myhome.module.udp.listener.MessageListener
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.MulticastSocket

/**
 * UDP 客户端
 */
class UdpClient(
    private val multicastAddr: String = UdpConfig.MULTICAST_ADDR, // 组播组地址
    private val port: Int = UdpConfig.PORT, // 端口（监听与发送共用）
    private val bufferSize: Int = 1024, // 接收缓冲区大小（字节）
) {

    companion object {
        private const val TAG = "UdpClient"
    }

    private var socket: MulticastSocket? = null // 组播 socket
    private var loopThread: Thread? = null // 消息接收线程
    private var messageListener: MessageListener? = null // 消息监听器
    private var connectionListener: ConnectionListener? = null // 连接状态监听器

    @Volatile
    private var loopRunning = false // 控制循环线程生命周期

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
    fun connect() {
        if (connected) {
            Log.d(TAG, "connect: already connected")
            return
        }
        interruptLoop()
        cleanupSocket()
        if (!createSocket()) return
        startLoop()
        connected = true
        connectionListener?.onConnectionChanged(true)
        Log.d(TAG, "connect: joined ${multicastAddr}:${port}")
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        if (!connected) return
        Log.d(TAG, "disconnect")
        interruptLoop()
        cleanupSocket()
        connected = false
        connectionListener?.onConnectionChanged(false)
    }

    /**
     * 发送数据
     *
     * @param data     消息数据
     * @param targetIp 目标 IP，为 null 时组播发送
     */
    fun send(data: ByteArray, targetIp: String? = null) {
        socket?.let { s ->
            if (s.isClosed) {
                Log.e(TAG, "send: not connected")
                return
            }
            try {
                val addr = InetAddress.getByName(targetIp ?: multicastAddr)
                s.send(DatagramPacket(data, data.size, addr, port))
            } catch (e: Exception) {
                Log.e(TAG, "send error: ${e.message}", e)
            }
        } ?: Log.e(TAG, "send: not connected")
    }

    /**
     * 创建 socket 并加入组播组
     *
     * @return 是否成功
     */
    private fun createSocket(): Boolean {
        socket = try {
            MulticastSocket(port).apply {
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
        messageListener?.onMessage(
            packet.data.copyOf(packet.length),
            packet.address?.hostAddress ?: "",
            packet.port,
        )
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


