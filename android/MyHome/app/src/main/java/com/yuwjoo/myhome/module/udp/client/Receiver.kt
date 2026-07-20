package com.yuwjoo.myhome.module.udp.client

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean

/**
 * 独立接收协程：循环接收 → 自收过滤 → 校验 → 解码 → 回调
 */
internal class Receiver(
    private val socketManager: SocketManager,
) {
    companion object {
        private const val TAG = "Receiver"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 协程作用域
    private var job: Job? = null // 接收协程 Job
    private val running = AtomicBoolean(false) // 是否正在运行

    var onFrameReceived: ((frame: FrameData, fromIp: String) -> Unit)? = null // 帧接收回调

    val isRunning: Boolean get() = running.get() // 是否正在运行

    /**
     * 启动接收循环
     */
    fun start() {
        if (running.getAndSet(true)) return
        job = scope.launch {
            Log.i(TAG, "Receiver started")
            val buffer = ByteArray(UdpConfig.BUFFER_SIZE)
            while (isActive) {
                val packet = socketManager.receive(buffer) ?: continue
                handlePacket(packet, buffer.copyOf(packet.length))
            }
            Log.i(TAG, "Receiver stopped")
        }
    }

    /**
     * 停止接收
     */
    fun stop() {
        running.set(false)
        job?.cancel()
        job = null
        Log.i(TAG, "Receiver stop requested")
    }

    private fun handlePacket(packet: java.net.DatagramPacket, raw: ByteArray) {
        val fromIp = packet.address?.hostAddress ?: return

        // 过滤本机发出的数据
        if (socketManager.isLocalAddress(fromIp)) return

        // 快速预校验
        if (!PacketValidator.validate(raw)) return

        // 解码
        val frame = FrameCodec.decode(raw) ?: return

        // 回调
        onFrameReceived?.invoke(frame, fromIp)
    }
}
