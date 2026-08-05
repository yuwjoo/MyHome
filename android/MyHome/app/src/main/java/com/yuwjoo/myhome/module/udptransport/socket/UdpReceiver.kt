package com.yuwjoo.myhome.module.udptransport.socket

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.net.DatagramPacket
import java.net.MulticastSocket

/**
 * UDP 接收器
 */
internal class UdpReceiver(
    private val bufferSize: Int,
    private val onPacketReceived: (data: ByteArray, fromIp: String) -> Unit,
) {

    companion object {
        private const val TAG = "UdpReceiver"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var receiveJob: Job? = null

    /**
     * 启动接收循环
     *
     * @param socket 已创建好的 MulticastSocket
     */
    fun start(socket: MulticastSocket) {
        if (receiveJob?.isActive == true) return
        receiveJob = scope.launch {
            Log.i(TAG, "Receive loop started")
            val buffer = ByteArray(bufferSize)
            while (isActive) {
                val packet = receive(socket, buffer) ?: continue
                val fromIp = packet.address?.hostAddress ?: continue
                val data = buffer.copyOf(packet.length)
                onPacketReceived(data, fromIp)
            }
            Log.i(TAG, "Receive loop stopped")
        }
    }

    /**
     * 停止接收循环
     */
    fun stop() {
        receiveJob?.cancel()
        receiveJob = null
    }

    /**
     * 阻塞式接收一个 UDP 报文
     */
    private fun receive(socket: MulticastSocket, buffer: ByteArray): DatagramPacket? {
        if (socket.isClosed) return null
        return try {
            val packet = DatagramPacket(buffer, buffer.size)
            socket.receive(packet)
            packet
        } catch (e: Exception) {
            if (socket.isClosed) null
            else {
                Log.w(TAG, "receive error: ${e.message}")
                null
            }
        }
    }
}
