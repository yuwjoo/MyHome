package com.yuwjoo.myhome.module.udp.client.transport

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.config.NetConfig
import com.yuwjoo.myhome.module.udp.client.codec.FrameCodec
import com.yuwjoo.myhome.module.udp.client.model.FrameData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.net.DatagramPacket
import java.util.concurrent.atomic.AtomicBoolean

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
    private val running = AtomicBoolean(false) // 是否正在运行

    var onFrameReceived: ((frame: FrameData, fromIp: String) -> Unit)? = null // 帧接收回调

    val isRunning: Boolean get() = running.get() // 是否正在运行

    /**
     * 启动读取循环，创建协程持续接收 UDP 报文
     */
    fun start() {
        if (running.getAndSet(true)) return
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
        running.set(false)
        job?.cancel()
        job = null
        Log.i(TAG, "SocketReader stop requested")
    }

    /**
     * 处理接收到的 UDP 报文：过滤本机地址、解码帧、触发回调
     *
     * @param packet 接收到的 UDP 报文
     * @param raw 原始字节数据
     */
    private fun handlePacket(packet: DatagramPacket, raw: ByteArray) {
        val fromIp = packet.address?.hostAddress ?: return

        // 过滤本机发出的数据
        if (udpSocket.isLocalAddress(fromIp)) return

        // 解码（内含魔数/长度/CRC 校验）
        val frame = FrameCodec.decode(raw) ?: return

        // 回调
        onFrameReceived?.invoke(frame, fromIp)
    }
}
