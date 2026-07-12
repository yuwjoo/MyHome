package com.yuwjoo.myhome.module.udp

import android.util.Log
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.MulticastSocket

/**
 * UDP 客户端配置
 */
data class UdpClientConfig(
    val multicastAddr: String = "224.0.0.100", // 组播组地址
    val listenPort: Int = 8001, // 接收端口
    val sendPort: Int = 8000, // 发送端口
    val bufferSize: Int = 1024, // 接收缓冲区大小（字节）
    val soTimeout: Int = 1000, // socket 接收超时（毫秒）
)

/**
 * UDP 客户端，管理组播连接与消息收发。
 */
class UdpClient(private val config: UdpClientConfig) {

    companion object {
        private const val TAG = "UdpClient"
    }

    private var socket: MulticastSocket? = null // 组播 socket
    private var receiveThread: Thread? = null // 消息接收线程
    private var messageCallback: MessageCallback? = null // 消息回调
    private var connectionCallback: ConnectionCallback? = null // 连接状态回调

    @Volatile
    private var running = false // 接收线程运行标志
    @Volatile
    private var connected = false // 是否已入组

    val isConnected: Boolean get() = connected // 外部连接状态

    /**
     * 设置消息回调，传入 null 清除监听
     */
    fun setMessageCallback(callback: MessageCallback?) {
        messageCallback = callback
    }

    /**
     * 设置连接状态改变回调，传入 null 清除监听
     */
    fun setConnectionCallback(callback: ConnectionCallback?) {
        connectionCallback = callback
    }

    /**
     * 加入组播组并启动消息接收
     */
    fun connect() {
        if (connected) {
            Log.d(TAG, "connect: already connected")
            return
        }
        running = true
        socket = try {
            MulticastSocket(config.listenPort).apply {
                loopbackMode = true
                soTimeout = config.soTimeout
                joinGroup(InetAddress.getByName(config.multicastAddr))
            }
        } catch (e: Exception) {
            Log.e(TAG, "connect error: ${e.message}", e)
            null
        }
        if (socket == null) {
            running = false
            return
        }
        connected = true
        connectionCallback?.onConnectionChanged(true)
        startReceive()
        Log.d(TAG, "connect: joined ${config.multicastAddr}:${config.listenPort}")
    }

    /**
     * 离开组播组并释放所有资源
     */
    fun disconnect() {
        Log.d(TAG, "disconnect")
        connected = false
        connectionCallback?.onConnectionChanged(false)
        running = false
        receiveThread?.interrupt()
        socket?.let { s ->
            try {
                s.leaveGroup(InetAddress.getByName(config.multicastAddr))
            } catch (_: Exception) {
            }
            try {
                s.close()
            } catch (_: Exception) {
            }
        }
        socket = null
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
                val addr = InetAddress.getByName(targetIp ?: config.multicastAddr)
                s.send(DatagramPacket(data, data.size, addr, config.sendPort))
            } catch (e: Exception) {
                Log.e(TAG, "send error: ${e.message}", e)
            }
        } ?: Log.e(TAG, "send: not connected")
    }

    /**
     * 启动接收线程
     */
    private fun startReceive() {
        val s = socket ?: return
        val buffer = ByteArray(config.bufferSize)
        receiveThread = Thread({
            while (running && !Thread.currentThread().isInterrupted) {
                val packet = try {
                    val p = DatagramPacket(buffer, buffer.size)
                    s.receive(p)
                    p
                } catch (_: Exception) {
                    if (!running || s.isClosed) break
                    continue
                }
                messageCallback?.onMessage(
                    packet.data.copyOf(packet.length),
                    packet.address?.hostAddress ?: "",
                    packet.port,
                )
            }
        }, "udp-recv").apply {
            isDaemon = true
            start()
        }
    }
}

fun interface MessageCallback {
    /**
     * 收到新消息时回调
     *
     * @param data     消息数据
     * @param fromIp   发送方 IP
     * @param fromPort 发送方端口
     */
    fun onMessage(data: ByteArray, fromIp: String, fromPort: Int)
}

fun interface ConnectionCallback {
    /**
     * 连接状态改变时回调
     *
     * @param connected 是否已连接
     */
    fun onConnectionChanged(connected: Boolean)
}
