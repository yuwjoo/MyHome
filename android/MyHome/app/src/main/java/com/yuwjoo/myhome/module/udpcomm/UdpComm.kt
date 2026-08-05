package com.yuwjoo.myhome.module.udpcomm

import android.content.Context
import android.util.Log
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
    var onMessageReceived: ((ByteArray, String) -> Unit)? = null // 收到原始消息回调

    init {
        transport.onStartChanged = { started ->
            scope.launch {
                isConnected = started
                onConnectionChanged?.invoke(started)
            }
        }
        transport.onMessageReceived = { data, fromIp ->
            onMessageReceived?.invoke(data, fromIp)
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
        isConnected = true
        onConnectionChanged?.invoke(true)
        Log.i(TAG, "Connected")
    }

    /**
     * 断开 UDP 通信
     */
    suspend fun disconnect() = withContext(dispatcher) {
        if (!isConnected) return@withContext
        transport.stop()
        isConnected = false
        onConnectionChanged?.invoke(false)
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
}
