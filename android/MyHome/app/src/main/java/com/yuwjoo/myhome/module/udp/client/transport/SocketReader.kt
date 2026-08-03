package com.yuwjoo.myhome.module.udp.client.transport

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.config.NetConfig
import com.yuwjoo.myhome.module.udp.client.codec.FrameCodec
import com.yuwjoo.myhome.module.udp.client.UdpDispatcher
import com.yuwjoo.myhome.module.udp.client.model.FrameData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.DatagramPacket

/**
 * 帧读取器：独立协程循环接收 UDP 报文，完成自收过滤和解码后输出 [FrameData]
 *
 * @param udpSocket 提供阻塞接收和本机 IP 判断
 */
internal class SocketReader(
    private val udpSocket: UdpSocket,
) {
    companion object {
        private const val TAG = "SocketReader"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 协程作用域
    private var job: Job? = null // 接收协程 Job
    private var running = false // 是否正在运行

    var onFrameReceived: ((frame: FrameData, fromIp: String) -> Unit)? = null // 帧接收回调

    val isRunning: Boolean get() = running // 是否正在运行

    /**
     * 启动读取循环，创建协程持续接收 UDP 报文
     */
    fun start() {
        if (running) return
        running = true
        job = scope.launch {
            Log.i(TAG, "SocketReader started")
            val buffer = ByteArray(NetConfig.BUFFER_SIZE)
            while (isActive) {
                val packet = udpSocket.receive(buffer) ?: continue
                handlePacket(packet, buffer.copyOf(packet.length))
            }
            Log.i(TAG, "SocketReader stopped")
        }
    }

    /**
     * 停止读取
     */
    fun stop() {
        running = false
        job?.cancel()
        job = null
        Log.i(TAG, "SocketReader stop requested")
    }

    /**
     * 处理接收到的 UDP 报文：切换到单线程调度器，过滤本机地址、解码帧、触发回调
     *
     * @param packet 接收到的 UDP 报文
     * @param raw 原始字节数据
     */
    private suspend fun handlePacket(packet: DatagramPacket, raw: ByteArray) = withContext(UdpDispatcher) {
        val fromIp = packet.address?.hostAddress ?: return@withContext
        // 过滤本机发出的数据
        if (udpSocket.isLocalAddress(fromIp)) return@withContext
        // 解码（内含魔数/长度/CRC 校验）
        val frame = FrameCodec.decode(raw) ?: return@withContext
        // 回调
        onFrameReceived?.invoke(frame, fromIp)
    }
}
