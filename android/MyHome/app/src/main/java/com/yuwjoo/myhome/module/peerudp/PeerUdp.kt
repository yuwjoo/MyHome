package com.yuwjoo.myhome.module.peerudp

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.peerudp.common.SerialCoroutine
import com.yuwjoo.myhome.module.peerudp.device.LanDeviceManager
import com.yuwjoo.myhome.module.peerudp.device.SendStatus
import com.yuwjoo.myhome.module.peerudp.frame.FrameCodec
import com.yuwjoo.myhome.module.peerudp.frame.FrameData
import com.yuwjoo.myhome.module.peerudp.transport.Transport
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * P2P UDP 通信
 */
object PeerUdp {

    private const val TAG = "PeerUdp"

    private val dispatcher = SerialCoroutine.dispatcher // 单线程串行调度器
    private val scope = SerialCoroutine.scope // 协程作用域

    private val transport = Transport() // udp传输器
    private val deviceManager = LanDeviceManager() // 设备管理器

    var isConnected: Boolean = false // 当前连接状态
        private set

    var onConnectionChanged: ((Boolean) -> Unit)? = null // 连接状态变化回调
    var onFrameReceived: ((FrameData, String) -> Unit)? = null // 收到帧数据回调

    init {
        // 传输器启动状态改变
        transport.onStartChanged = { started ->
            scope.launch {
                updateConnectionState(started)
            }
        }
        // 传输器收到消息
        transport.onMessageReceived = { data, fromIp ->
            scope.launch {
                val frame = FrameCodec.decode(data) ?: return@launch
                onFrameReceived?.invoke(frame, fromIp)
            }
        }
    }

    /**
     * 建立 UDP 通信
     *
     * @param context 用于注册网络监听的 Context
     */
    suspend fun connect(context: Context) = withContext(dispatcher) {
        if (isConnected) return@withContext

        transport.start(context)
        updateConnectionState(true)
        Log.i(TAG, "Connected")
    }

    /**
     * 断开 UDP 通信
     */
    suspend fun disconnect() = withContext(dispatcher) {
        if (!isConnected) return@withContext
        transport.stop()
        updateConnectionState(false)
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
        withContext(dispatcher) {
            if (!isConnected) {
                Log.w(TAG, "send: not connected")
                return@withContext false
            }
            if (targetIp != null) {
                // 单播：固定 JSON 有序消息，序号由队列按设备分配，回调中编码完整帧发送
                deviceManager.enqueueDeviceMessage(
                    ip = targetIp,
                    data = payload,
                    send = { bytes, ip, seq ->
                        transport.sendUnicast(
                            FrameCodec.encode(FrameConfig.Type.JSON, seq, FrameConfig.Flags.ORDERED, bytes),
                            ip,
                        )
                    },
                    onComplete = onComplete,
                )
                true
            } else {
                // 广播：固定 JSON 无序消息，SeqNum 固定为 0
                transport.sendBroadcast(
                    FrameCodec.encode(FrameConfig.Type.JSON, 0, FrameConfig.Flags.NONE, payload),
                )
            }
    }

    /**
     * 更新连接状态并通知外部
     */
    private suspend fun updateConnectionState(connected: Boolean) = withContext(dispatcher) {
        isConnected = connected
        onConnectionChanged?.invoke(connected)
    }
}
