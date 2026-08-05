package com.yuwjoo.myhome.module.udptransport

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.udptransport.socket.NetworkMonitor
import com.yuwjoo.myhome.module.udptransport.socket.OnUdpSocketListener
import com.yuwjoo.myhome.module.udptransport.socket.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * UDP 传输门面
 */
object UdpTransport {

    private const val TAG = "UdpTransport"

    private val socket = Socket() // 底层 UDP Socket
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 协程作用域

    private var networkMonitor: NetworkMonitor? = null

    @Volatile
    var isConnected: Boolean = false // 当前连接状态
        private set

    var onConnectionChanged: ((Boolean) -> Unit)? = null // 连接状态变化回调

    var onMessageReceived: ((ByteArray, String) -> Unit)? = null // 收到原始消息回调

    /**
     * 建立 UDP 通信
     *
     * @param context 用于注册网络监听的 Context
     */
    fun connect(context: Context) {
        if (isConnected) return

        socket.listener = object : OnUdpSocketListener {
            override fun onMessageReceived(data: ByteArray, fromIp: String) {
                onMessageReceived?.invoke(data, fromIp)
            }

            override fun onError(cause: Exception) {
                Log.e(TAG, "Socket error: ${cause.message}", cause)
            }
        }

        val monitor = NetworkMonitor { available ->
            scope.launch {
                if (available) doConnect() else doDisconnect("WiFi lost")
            }
        }
        networkMonitor = monitor

        doConnect()
        monitor.start(context)
    }

    /**
     * 断开 UDP 通信
     */
    fun disconnect() {
        if (!isConnected) return
        networkMonitor?.stop()
        networkMonitor = null
        doDisconnect("manual disconnect")
    }

    /**
     * 发送数据
     *
     * @param data     待发送字节数组
     * @param targetIp 目标 IP，为 null 时广播发送
     */
    suspend fun send(data: ByteArray, targetIp: String? = null): Boolean =
        withContext(Dispatchers.IO) {
            if (!isConnected) {
                Log.w(TAG, "send: not connected")
                return@withContext false
            }
            if (targetIp != null) {
                socket.sendUnicast(data, targetIp)
            } else {
                socket.sendBroadcast(data)
            }
        }

    /**
     * 执行连接
     */
    private fun doConnect(): Boolean {
        if (!socket.create()) return false
        isConnected = true
        onConnectionChanged?.invoke(true)
        Log.i(TAG, "Connected")
        return true
    }

    /**
     * 执行断开
     */
    private fun doDisconnect(reason: String) {
        socket.destroy()
        isConnected = false
        onConnectionChanged?.invoke(false)
        Log.i(TAG, "Disconnected ($reason)")
    }
}
