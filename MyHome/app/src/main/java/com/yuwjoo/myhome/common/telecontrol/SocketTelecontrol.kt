package com.yuwjoo.myhome.common.telecontrol

import android.util.Log
import com.yuwjoo.myhome.activity.main.ui.webview.BridgeConstant
import com.yuwjoo.myhome.activity.main.ui.webview.getBridge
import com.yuwjoo.myhome.common.telecontrol.devices.BedroomAC
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.io.PrintWriter
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.charset.StandardCharsets
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Socket遥控
 */
class SocketTelecontrol private constructor() {

    companion object {
        private const val TAG = "SocketConnect"

        private const val DEFAULT_SOCKET_TIMEOUT = 5000 // 默认连接超时时间（毫秒）
        private const val DEFAULT_BUFFER_SIZE = 1024 // 默认缓冲区大小
        private const val HEARTBEAT_TOPIC = "heartbeat" // 心跳消息主题
        private const val HEARTBEAT_ACK_TOPIC = "heartbeatACK" // 确认心跳消息主题

        @Volatile
        private var instance: SocketTelecontrol? = null

        /**
         * 获取单例实例
         * @return socket连接类实例
         */
        fun getInstance(): SocketTelecontrol {
            if (instance == null) {
                synchronized(SocketTelecontrol::class.java) {
                    if (instance == null) {
                        instance = SocketTelecontrol()
                    }
                }
            }
            return instance!!
        }
    }

    private var socket: Socket? = null // socket实例
    private var printWriter: PrintWriter? = null // 输出流
    private var bufferedReader: BufferedReader? = null // 输入流
    private var executorService: ExecutorService = Executors.newSingleThreadExecutor() // 线程池
    private var isConnected = false // 连接状态
    private var serverIp: String? = null // 服务器IP
    private var serverPort: Int? = null // 服务器端口

    private var onConnectListener: OnConnectListener? = null // 连接监听器
    private var onDisconnectListener: OnDisconnectListener? = null // 断开连接监听器
    private var onMessageReceivedListener: OnMessageReceivedListener? = null // 消息接收监听器
    private var onErrorListener: OnErrorListener? = null // 错误监听器
    private var heartbeatThread: Thread? = null // 心跳线程
    private var isHeartbeatRunning = false // 心跳线程运行状态
    private var heartbeatLastTimeout: Long = -1 // 最后确认心跳消息时间
    private val MAX_HEARTBEAT_TIMEOUT = 3000 // 最大心跳超时时间
    private val HEARTBEAT_INTERVAL = 1000L // 心跳间隔（毫秒）

    /**
     * 连接到Socket服务器
     * @param ip 服务器IP地址
     * @param port 服务器端口
     * @return 是否成功开始连接过程
     */
    fun connect(ip: String? = serverIp, port: Int? = serverPort): Boolean {
        if (isConnected) {
            Log.w(TAG, "Already connected to socket server")
            return true
        }

        if (ip == null || port == null) {
            return false
        }

        try {
            serverIp = ip
            serverPort = port

            // 在线程池中执行连接操作
            executorService.execute {
                try {
                    socket = Socket()
                    socket?.connect(InetSocketAddress(ip, port), DEFAULT_SOCKET_TIMEOUT)

                    if (socket?.isConnected == true) {
                        // 初始化输入输出流
                        printWriter = PrintWriter(
                            OutputStreamWriter(socket?.getOutputStream(), StandardCharsets.UTF_8),
                            true
                        )
                        bufferedReader = BufferedReader(
                            InputStreamReader(socket?.getInputStream(), StandardCharsets.UTF_8)
                        )

                        isConnected = true
                        // 连接状态改变
                        getBridge()?.globalChannel?.send(BridgeConstant.EVENT_SOCKET_CONNECT_STATE, true)
                        Log.d(TAG, "Connected to socket server: $ip:$port")

                        // 通知连接成功
                        onConnectListener?.onConnect()

                        // 开始接收消息
                        startListeningForMessages()

                        // 启动心跳线程
                        startHeartbeat()
                    } else {
                        Log.e(TAG, "Failed to connect to socket server: $ip:$port")
                        onErrorListener?.onError("Failed to connect to socket server")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Connect error: ${e.message}", e)
                    isConnected = false
                    // 连接状态改变
                    getBridge()?.globalChannel?.send(BridgeConstant.EVENT_SOCKET_CONNECT_STATE, false)
                    onErrorListener?.onError("Connect error: ${e.message}")
                }
            }

            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start connect process: ${e.message}", e)
            onErrorListener?.onError("Failed to start connect process: ${e.message}")
            return false
        }
    }

    /**
     * 开始监听消息
     */
    private fun startListeningForMessages() {
        executorService.execute {
            val buffer = CharArray(DEFAULT_BUFFER_SIZE)
            try {
                while (isConnected && socket?.isConnected == true) {
                    val bytesRead = bufferedReader?.read(buffer)
                    if (bytesRead != null && bytesRead > 0) {
                        val message = String(buffer, 0, bytesRead)
                        Log.d(TAG, "Received message: $message")
                        handleMessage(message)
                    } else if (bytesRead == -1) {
                        // 连接被关闭
                        break
                    }
                }
            } catch (e: IOException) {
                if (isConnected) {
                    Log.e(TAG, "Error reading message: ${e.message}", e)
                    onErrorListener?.onError("Error reading message: ${e.message}")
                }
            } finally {
                // 如果连接仍标记为已连接，但实际已断开，执行断开连接操作
                if (isConnected) {
                    disconnect()
                }
            }
        }
    }

    /**
     * 处理接收到的消息
     */
    private fun handleMessage(msgText: String) {
        try {
            // 解析JSON消息
            val message = TelecontrolHelper.parseMessage(msgText)

            when (message.topic) {
                // 心跳确认消息
                HEARTBEAT_ACK_TOPIC -> {
                    heartbeatLastTimeout = System.currentTimeMillis()
                    Log.d(TAG, "Received heartbeat acknowledgment")
                }
                // 卧室空调状态改变
                TelecontrolHelper.TOPIC_DEVICE_BEDROOM_AC -> {
                    BedroomAC.updateACState(message.data as? String)
                }
                // 其他消息
                else -> {
                    onMessageReceivedListener?.onMessageReceived(msgText)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse message: $msgText", e)
            // 解析失败时，直接传递给监听器
            onMessageReceivedListener?.onMessageReceived(msgText)
        }
    }

    /**
     * 启动心跳线程
     */
    private fun startHeartbeat() {
        if (isHeartbeatRunning) {
            return
        }

        isHeartbeatRunning = true
        heartbeatLastTimeout = System.currentTimeMillis()

        heartbeatThread = Thread {
            try {
                while (isConnected && isHeartbeatRunning) {
                    if (socket?.isConnected == true) {
                        // 发送心跳消息
                        val json = JSONObject()
                        json.put("topic", HEARTBEAT_TOPIC)
                        sendMessage(json.toString())

                        // 检查心跳超时
                        val now = System.currentTimeMillis()
                        if (now - heartbeatLastTimeout >= MAX_HEARTBEAT_TIMEOUT) {
                            Log.e(TAG, "Heartbeat timeout, disconnecting")
                            onErrorListener?.onError("Heartbeat timeout")
                            disconnect()
                            break
                        }
                    }
                    // 等待心跳间隔
                    Thread.sleep(HEARTBEAT_INTERVAL)
                }
            } catch (e: InterruptedException) {
                Log.d(TAG, "Heartbeat thread interrupted")
                Thread.currentThread().interrupt()
            } catch (e: Exception) {
                Log.e(TAG, "Heartbeat error: ${e.message}", e)
            }
        }

        heartbeatThread?.start()
        Log.d(TAG, "Heartbeat thread started")
    }

    /**
     * 停止心跳线程
     */
    private fun stopHeartbeat() {
        isHeartbeatRunning = false
        heartbeatThread?.interrupt()
        heartbeatThread = null
        Log.d(TAG, "Heartbeat thread stopped")
    }

    /**
     * 断开与Socket服务器的连接
     */
    fun disconnect() {
        try {
            isConnected = false
            // 连接状态改变
            getBridge()?.globalChannel?.send(BridgeConstant.EVENT_SOCKET_CONNECT_STATE, false)

            // 停止心跳线程
            stopHeartbeat()

            // 关闭输入输出流
            printWriter?.close()
            bufferedReader?.close()

            // 关闭socket
            if (socket?.isConnected == true) {
                socket?.shutdownInput()
                socket?.shutdownOutput()
            }
            socket?.close()

            Log.d(TAG, "Disconnected from socket server")

            // 通知断开连接
            onDisconnectListener?.onDisconnect()
        } catch (e: Exception) {
            Log.e(TAG, "Disconnect error: ${e.message}", e)
        }
    }

    /**
     * 发送消息到Socket服务器
     * @param message 要发送的消息
     * @return 是否发送成功
     */
    fun sendMessage(message: String): Boolean {
        return try {
            if (!isConnected || socket?.isConnected == false || printWriter == null) {
                Log.w(TAG, "Not connected to socket server")
                return false
            }

            printWriter?.println(message)
            printWriter?.flush()

            Log.d(TAG, "Sent message: $message")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send message: ${e.message}", e)
            onErrorListener?.onError("Failed to send message: ${e.message}")
            false
        }
    }

    /**
     * 获取Socket连接状态
     * @return 是否已连接到Socket服务器
     */
    fun isConnected(): Boolean {
        return isConnected && socket?.isConnected == true
    }

    /**
     * 获取当前连接的服务器IP
     * @return 服务器IP地址
     */
    fun getServerIp(): String? {
        return serverIp
    }

    /**
     * 获取当前连接的服务器端口
     * @return 服务器端口号
     */
    fun getServerPort(): Int? {
        return serverPort
    }

    /**
     * 设置连接监听器
     * @param listener 连接监听器
     */
    fun setOnConnectListener(listener: OnConnectListener?) {
        this.onConnectListener = listener
    }

    /**
     * 设置断开连接监听器
     * @param listener 断开连接监听器
     */
    fun setOnDisconnectListener(listener: OnDisconnectListener?) {
        this.onDisconnectListener = listener
    }

    /**
     * 设置消息接收监听器
     * @param listener 消息接收监听器
     */
    fun setOnMessageReceivedListener(listener: OnMessageReceivedListener?) {
        this.onMessageReceivedListener = listener
    }

    /**
     * 设置错误监听器
     * @param listener 错误监听器
     */
    fun setOnErrorListener(listener: OnErrorListener?) {
        this.onErrorListener = listener
    }

    /**
     * 释放资源
     */
    fun release() {
        disconnect()

        try {
            executorService.shutdown()
            executorService.awaitTermination(1, TimeUnit.SECONDS)
        } catch (e: InterruptedException) {
            Log.e(TAG, "Error shutting down executor: ${e.message}", e)
            Thread.currentThread().interrupt()
        }

        onConnectListener = null
        onDisconnectListener = null
        onMessageReceivedListener = null
        onErrorListener = null
    }

    /**
     * 连接监听器接口
     */
    interface OnConnectListener {
        /**
         * 连接成功回调
         */
        fun onConnect()
    }

    /**
     * 断开连接监听器接口
     */
    interface OnDisconnectListener {
        /**
         * 断开连接回调
         */
        fun onDisconnect()
    }

    /**
     * 消息接收监听器接口
     */
    interface OnMessageReceivedListener {
        /**
         * 收到消息回调
         * @param message 收到的消息
         */
        fun onMessageReceived(message: String)
    }

    /**
     * 错误监听器接口
     */
    interface OnErrorListener {
        /**
         * 错误回调
         * @param error 错误信息
         */
        fun onError(error: String)
    }
}