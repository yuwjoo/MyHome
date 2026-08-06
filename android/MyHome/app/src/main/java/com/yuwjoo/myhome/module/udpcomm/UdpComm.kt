package com.yuwjoo.myhome.module.udpcomm

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.udpcomm.frame.FrameCodec
import com.yuwjoo.myhome.module.udpcomm.frame.FrameData
import com.yuwjoo.myhome.module.udpcomm.transport.Transport
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * UDP 通信
 */
@OptIn(ExperimentalCoroutinesApi::class)
object UdpComm {

    private const val TAG = "UdpComm"

    private val transport = Transport() // udp传输器
    private val dispatcher = Dispatchers.IO.limitedParallelism(1) // 单线程串行调度器
    private val scope = CoroutineScope(SupervisorJob() + dispatcher) // 网络回调转发作用域

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
     * 发送数据
     *
     * @param data     待发送字节数组
     * @param targetIp 目标 IP，为 null 时广播发送
     */
    suspend fun send(data: ByteArray, targetIp: String? = null): Boolean =
        withContext(dispatcher) {
            if (!isConnected) {
                Log.w(TAG, "send: not connected")
                return@withContext false
            }
            if (targetIp != null) {
                transport.sendUnicast(data, targetIp)
            } else {
                transport.sendBroadcast(data)
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
