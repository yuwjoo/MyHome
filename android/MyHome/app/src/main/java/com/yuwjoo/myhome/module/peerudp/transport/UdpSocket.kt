package com.yuwjoo.myhome.module.peerudp.transport

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.MulticastSocket
import java.net.NetworkInterface

/**
 * UDP Socket
 *
 * @param port             通信端口
 * @param multicastAddress 组播地址
 * @param bufferSize       接收缓冲区大小
 * @param filterLocalIp    是否过滤本机消息，默认 true
 * @param onPacketReceived 收到数据包时的回调
 */
internal class UdpSocket(
    private val port: Int,
    private val multicastAddress: String,
    private val bufferSize: Int,
    private val filterLocalIp: Boolean = true,
    private val onPacketReceived: (data: ByteArray, fromIp: String) -> Unit,
) {

    companion object {
        private const val TAG = "UdpSocket"
    }

    private val socket: MulticastSocket // MulticastSocket 实例
    private val multicastInet: InetAddress = InetAddress.getByName(multicastAddress) // 组播组地址
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 接收协程作用域
    private var receiveJob: Job? = null // 接收协程
    private val localIps: Set<String> = if (filterLocalIp) collectLocalIps() else emptySet() // 本机 IP 集合

    val isClosed: Boolean get() = socket.isClosed // 当前是否已关闭

    init {
        // 初始化socket
        socket = MulticastSocket(port).apply {
            broadcast = true           // 启用广播发送
            loopbackMode = true        // 本机发出的数据包不会被本机接收
            soTimeout = 0              // 接收阻塞时不超时（0 表示无限等待）
            reuseAddress = true        // 允许端口复用，多个进程可绑定同一端口
            joinGroup(multicastInet)   // 加入组播组，接收组播消息
        }

        // 初始化接收消息协程
        receiveJob = scope.launch {
            Log.i(TAG, "Receive loop started")
            val buffer = ByteArray(bufferSize)
            while (isActive) {
                if (socket.isClosed) break
                val packet = try {
                    val p = DatagramPacket(buffer, buffer.size)
                    socket.receive(p)
                    p
                } catch (e: Exception) {
                    if (socket.isClosed) break
                    Log.w(TAG, "receive error: ${e.message}")
                    continue
                }
                val fromIp = packet.address?.hostAddress ?: continue
                if (filterLocalIp && fromIp in localIps) continue // 过滤本机消息
                val data = buffer.copyOf(packet.length)
                onPacketReceived(data, fromIp)
            }
            Log.i(TAG, "Receive loop stopped")
        }

        Log.i(TAG, "Socket created on port $port, joined $multicastAddress")
    }

    /**
     * 收集本机活跃网卡 IP
     */
    private fun collectLocalIps(): Set<String> {
        val ips = mutableSetOf<String>()
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val ni = interfaces.nextElement()
                if (!ni.isUp || ni.isLoopback) continue
                val addrs = ni.inetAddresses
                while (addrs.hasMoreElements()) {
                    val addr: InetAddress = addrs.nextElement()
                    val ip = addr.hostAddress ?: continue
                    ips.add(ip)
                }
            }
            Log.d(TAG, "Local IPs: $ips")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to collect local IPs: ${e.message}")
        }
        return ips
    }

    /**
     * 发送数据到指定目标
     *
     * @param data       待发送字节数组
     * @param target     目标 InetAddress
     * @param targetPort 目标端口
     * @return 发送成功返回 true，失败返回 false
     */
    fun send(data: ByteArray, target: InetAddress, targetPort: Int): Boolean {
        if (socket.isClosed) {
            Log.e(TAG, "send: socket is not open")
            return false
        }
        return try {
            socket.send(DatagramPacket(data, data.size, target, targetPort))
            true
        } catch (e: Exception) {
            Log.e(TAG, "send error: ${e.message}")
            false
        }
    }

    /**
     * 关闭 Socket
     */
    fun close() {
        receiveJob?.cancel()
        receiveJob = null
        try {
            socket.leaveGroup(multicastInet)
        } catch (_: Exception) {
        }
        try {
            socket.close()
        } catch (_: Exception) {
        }
        Log.i(TAG, "Socket closed")
    }
}
