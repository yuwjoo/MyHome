package com.yuwjoo.myhome.module.peerudp

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.peerudp.common.SerialCoroutine
import com.yuwjoo.myhome.module.peerudp.device.LanDeviceManager
import com.yuwjoo.myhome.module.peerudp.device.SendStatus
import com.yuwjoo.myhome.module.peerudp.frame.FrameData
import com.yuwjoo.myhome.module.peerudp.transport.NetworkMonitor
import com.yuwjoo.myhome.module.peerudp.transport.Transport
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * P2P UDP 通信
 */
object PeerUdp {

    private const val TAG = "PeerUdp"

    private val transport = Transport() // udp传输器
    private val deviceManager = LanDeviceManager() // 设备管理器
    private lateinit var networkMonitor: NetworkMonitor // 网络监听器

    var isConnected: Boolean = false // 当前连接状态
        private set

    var onConnectionChanged: ((Boolean) -> Unit)? = null // 连接状态变化回调

    init {
        // 传输器打开状态改变
        transport.onOpenChanged = { opened ->
            isConnected = opened
            onConnectionChanged?.invoke(opened)
        }
    }

    /**
     * 初始化（使用前必先调用，在串行调度器中执行，与 connect/disconnect 天然串行）
     *
     * @param context 当前上下文
     */
    suspend fun init(context: Context) = withContext(SerialCoroutine.dispatcher) {
        if (::networkMonitor.isInitialized) return@withContext
        networkMonitor = NetworkMonitor(context.applicationContext)
    }

    /**
     * 建立 UDP 通信
     */
    suspend fun connect() = withContext(SerialCoroutine.dispatcher) {
        if (isConnected) return@withContext

        // 启动网络监听：网络可用时打开 Transport，断开时关闭
        networkMonitor.start { available ->
            if (available) {
                transport.open()
            } else {
                transport.close()
            }
        }
        // 监听器只响应网络变化，初始按可用处理，主动打开一次
        transport.open()
        Log.i(TAG, "Connected")
    }

    /**
     * 断开 UDP 通信
     */
    suspend fun disconnect() = withContext(SerialCoroutine.dispatcher) {
        if (!isConnected) return@withContext
        networkMonitor.stop()
        transport.close()
        Log.i(TAG, "Disconnected")
    }

    /**
     * 发送数据（按帧协议编码后发送）
     *
     * @param payload    待发送负载（帧 Payload，如 JSON 字节）
     * @param targetIp   目标 IP，为 null 时广播发送（SeqNum 固定为 0，无序）
     * @param onComplete 发送完成回调（仅单播有序时触发，参数为发送状态，可省略）
     */
    suspend fun send(
        payload: ByteArray,
        targetIp: String? = null,
        onComplete: (status: SendStatus) -> Unit = {},
    ): Boolean =
        withContext(SerialCoroutine.dispatcher) {
            if (!isConnected) {
                Log.w(TAG, "send: not connected")
                return@withContext false
            }
            if (targetIp != null) {
                // 单播：固定 JSON 有序消息，序号由队列按设备分配
                deviceManager.enqueueDeviceMessage(
                    ip = targetIp,
                    data = payload,
                    send = { bytes, ip, seq ->
                        transport.sendFrame(FrameConfig.Type.JSON, bytes, seq, ip)
                    },
                    onComplete = onComplete,
                )
                true
            } else {
                // 广播：固定 JSON 无序消息，SeqNum 固定为 0
                transport.sendFrame(FrameConfig.Type.JSON, payload, null, null)
            }
    }
}
