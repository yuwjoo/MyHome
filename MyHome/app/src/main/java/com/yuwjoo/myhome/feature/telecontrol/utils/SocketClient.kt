package com.yuwjoo.myhome.feature.telecontrol.utils

import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.io.PrintWriter
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.charset.StandardCharsets

class SocketClient(
    val serverIp: String, // 服务器ip
    val serverPort: Int, // 服务器端口
    val isEnableHeartbeat: Boolean = true, // 是否启动心跳检查
    val cacheBufferSize: Int = DEFAULT_BUFFER_SIZE // 接收消息缓存buffer大小
) {

    companion object {
        private val TAG = "SocketClient"
        private val DEFAULT_SOCKET_TIMEOUT = 5000 // 默认连接超时时间（毫秒）
        private val DEFAULT_BUFFER_SIZE = 1024 // 默认缓冲区大小
    }

    /**
     * 心跳检查类
     */
    class HeartbeatCheck {

        companion object {
            const val HEARTBEAT_TOPIC = "heartbeat" // 心跳消息主题
            const val HEARTBEAT_ACK_TOPIC = "heartbeatACK" // 确认心跳消息主题
        }

        private var heartbeatThread: Thread? = null // 心跳线程
        private var heartbeatLastTimeout: Long = -1 // 最后心跳确认消息时间
        private val MAX_HEARTBEAT_TIMEOUT: Long = 3000 // 最大心跳超时时间
        private val HEARTBEAT_INTERVAL: Long = 1000 // 发送心跳间隔（毫秒）
        private var isRun: Boolean = false // 是否运行中

        /**
         * 启动心跳检查
         * @return 回调函数
         */
        fun start(callback: (isTimeout: Boolean) -> Unit) {
            if (isRun) stop()
            isRun = true
            heartbeatLastTimeout = System.currentTimeMillis()
            heartbeatThread = Thread {
                try {
                    while (isRun) {
                        // 检查心跳超时
                        val now = System.currentTimeMillis()
                        val isTimeout = now - heartbeatLastTimeout >= MAX_HEARTBEAT_TIMEOUT

                        callback(isTimeout)

                        if (isTimeout) {
                            stop()
                        } else {
                            // 等待心跳间隔
                            Thread.sleep(HEARTBEAT_INTERVAL)
                        }
                    }
                } catch (e: Exception) {
                    stop()
                }
            }
            heartbeatThread!!.start()
        }

        /**
         * 更新心跳
         */
        fun plop() {
            heartbeatLastTimeout = System.currentTimeMillis()
        }

        /**
         * 停止心跳
         */
        fun stop() {
            isRun = false
            heartbeatThread?.interrupt()
            heartbeatThread = null
        }
    }

    private var socket: Socket? = null // socket实例
    private var socketPrintWriter: PrintWriter? = null // 写入流
    private var socketBufferedReader: BufferedReader? = null // 读取流
    private var onConnectListener: ((isConnect: Boolean) -> Unit)? = null // 连接监听器
    private var onMessageListener: ((message: String) -> Unit)? = null // 消息监听器
    private var heartbeatCheck: HeartbeatCheck? = null // 心跳检查

    val isConnected: Boolean get() = socket?.isConnected ?: false // 连接状态

    /**
     * 开始连接
     * @param timeout 连接超时时间（毫秒）
     */
    fun connect(timeout: Int = DEFAULT_SOCKET_TIMEOUT) {
        if (isConnected) return

        Thread {
            socket = Socket()

            // 开始连接
            socket!!.connect(InetSocketAddress(serverIp, serverPort), timeout)

            onConnectListener?.invoke(isConnected)

            if (!isConnected) return@Thread

            // 初始化写入流
            socketPrintWriter = PrintWriter(
                OutputStreamWriter(socket!!.getOutputStream(), StandardCharsets.UTF_8),
                true
            )
            // 初始化读取流
            socketBufferedReader = BufferedReader(
                InputStreamReader(socket!!.getInputStream(), StandardCharsets.UTF_8)
            )

            // 启动心跳检查
            if (isEnableHeartbeat) {
                if (heartbeatCheck == null) heartbeatCheck = HeartbeatCheck()
                heartbeatCheck!!.start { isTimeout ->
                    Log.d(TAG, "心跳检查" + isTimeout)
                    if (isTimeout) {
                        // 断开连接
                        disconnect()
                    } else {
                        // 发送心跳消息
                        sendMessage(MessageUtil.MessageBody.text(HeartbeatCheck.HEARTBEAT_TOPIC))
                    }
                }
            }

            // 开始接收消息
            val buffer = CharArray(cacheBufferSize)
            try {
                while (isConnected) {
                    val bytesRead = socketBufferedReader!!.read(buffer)
                    if (bytesRead > 0) {
                        val message = String(buffer, 0, bytesRead)
                        onMessage(message)
                        onMessageListener?.invoke(message)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            onConnectListener?.invoke(isConnected)
        }.start()
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        // 停止心跳线程
        heartbeatCheck?.stop()
        heartbeatCheck = null
        // 关闭写入流
        socketPrintWriter?.close()
        socketPrintWriter = null
        // 关闭读取流
        socketBufferedReader?.close()
        socketBufferedReader = null
        // 关闭socket输入输出流
        if (socket?.isConnected == true) {
            socket?.shutdownInput()
            socket?.shutdownOutput()
        }
        // 关闭socket
        socket?.close()
        socket = null
    }

    /**
     * 关闭连接
     */
    fun close() {
        disconnect()
    }

    /**
     * 设置连接监听器
     * @param listener 连接监听器
     */
    fun setOnConnectListener(listener: (isConnect: Boolean) -> Unit) {
        this.onConnectListener = listener
    }

    /**
     * 设置消息监听器
     * @param listener 消息监听器
     */
    fun setOnMessageListener(listener: (message: String) -> Unit) {
        this.onMessageListener = listener
    }

    /**
     * 监听消息
     * @param message 消息
     */
    private fun onMessage(message: String) {
        val msg = MessageUtil.MessageBody.parse(message)
        when (msg?.topic) {
            // 心跳确认消息
            HeartbeatCheck.HEARTBEAT_ACK_TOPIC -> {
                heartbeatCheck?.plop()
            }
            // 其他消息
            else -> {
                onMessageListener?.invoke(message)
            }
        }
    }

    /**
     * 发送消息
     * @param message 消息
     */
    fun sendMessage(message: String) {
        socketPrintWriter?.println(message)
        socketPrintWriter?.flush()
    }
}