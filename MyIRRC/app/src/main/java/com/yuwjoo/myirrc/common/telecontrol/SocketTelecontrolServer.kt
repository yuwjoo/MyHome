package com.yuwjoo.myirrc.common.telecontrol

import android.util.Log
import com.yuwjoo.myirrc.common.telecontrol.devices.BedroomAirConditioner
import com.yuwjoo.myirrc.common.telecontrol.utils.TelecontrolHelper
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.io.PrintWriter
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.Executors

/**
 * Socket遥控服务
 */
class SocketTelecontrolServer private constructor() {

    companion object {
        private const val TAG = "SocketServer"
        private const val SOCKET_PORT = 30000 // 端口号
        private const val HEARTBEAT_TIMEOUT_INTERVAL = 3000L // 心跳超时时间
        private const val HEARTBEAT_CHECK_INTERVAL = 3000L // 心跳检查间隔
        private const val HEARTBEAT_TOPIC = "heartbeat" // 心跳消息主题
        private const val HEARTBEAT_ACK_TOPIC = "heartbeatACK" // 确认心跳消息主题

        @Volatile
        private var instance: SocketTelecontrolServer? = null

        /**
         * 获取单例实例
         * @return SocketServer实例
         */
        fun getInstance(): SocketTelecontrolServer {
            if (instance == null) {
                synchronized(SocketTelecontrolServer::class.java) {
                    if (instance == null) {
                        instance = SocketTelecontrolServer()
                    }
                }
            }
            return instance!!
        }
    }

    private var serverSocket: ServerSocket? = null // 服务器Socket
    private var isRunning = false // 服务器运行状态
    private val threadPool = Executors.newCachedThreadPool() // 线程池，用于处理客户端连接
    private val clients = mutableListOf<ClientHandler>() // 连接的客户端列表
    private var heartbeatThread: Thread? = null // 心跳检测线程

    /**
     * 启动Socket服务器
     */
    fun startServer() {
        // 在新线程中启动服务器，避免阻塞主线程
        threadPool.execute {
            try {
                serverSocket = ServerSocket(SOCKET_PORT)
                isRunning = true
                // 循环接受客户端连接
                while (isRunning) {
                    try {
                        val clientSocket = serverSocket!!.accept()
                        val clientHandler = ClientHandler(clientSocket)
                        synchronized(clients) {
                            clients.add(clientHandler)
                        }
                        // 启动心跳检测线程
                        startHeartbeatCheckThread()
                        threadPool.execute(clientHandler)
                    } catch (e: IOException) {
                        if (isRunning) {
                            Log.e(TAG, "接受客户端连接时出错: ${e.message}")
                        }
                    }
                }
            } catch (e: IOException) {
                Log.e(TAG, "socket服务器报错: ${e.message}")
                isRunning = false
            }
        }
    }

    /**
     * 停止Socket服务器
     */
    fun stopServer() {
        if (!isRunning) {
            return
        }
        isRunning = false
        // 中断心跳检测线程
        stopHeartbeatCheckThread()
        // 关闭所有客户端连接
        synchronized(clients) {
            clients.forEach { it.stop() }
            clients.clear()
        }
        // 关闭服务器Socket
        try {
            serverSocket?.close()
        } catch (e: IOException) {
            Log.e(TAG, "停止服务器时出错: ${e.message}")
        }
    }

    /**
     * 启动心跳检测线程
     */
    private fun startHeartbeatCheckThread() {
        if (heartbeatThread != null) return
        heartbeatThread = Thread {
            while (isRunning) {
                try {
                    Thread.sleep(HEARTBEAT_CHECK_INTERVAL)
                    checkAndCleanTimeoutClients()
                } catch (e: InterruptedException) {
                    Thread.currentThread().interrupt()
                    break
                }
            }
        }
        heartbeatThread?.start()
    }

    /**
     * 停止心跳检测线程
     */
    private fun stopHeartbeatCheckThread() {
        heartbeatThread?.interrupt()
        heartbeatThread = null
    }


    /**
     * 检查并清理超时的客户端
     */
    private fun checkAndCleanTimeoutClients() {
        synchronized(clients) {
            val currentTime = System.currentTimeMillis()
            val timeoutClients = clients.filter {
                Log.d(
                    TAG,
                    "客户端 ${it.clientSocket.inetAddress.hostAddress}，间隔 ${currentTime - it.lastHeartbeatTime},超时时间 $HEARTBEAT_TIMEOUT_INTERVAL 是否断开： ${(currentTime - it.lastHeartbeatTime) > HEARTBEAT_TIMEOUT_INTERVAL}"
                )
                (currentTime - it.lastHeartbeatTime) > HEARTBEAT_TIMEOUT_INTERVAL
            }

            if (timeoutClients.isNotEmpty()) {
                Log.d(TAG, "发现${timeoutClients.size}个客户端心跳超时，将断开连接")
                timeoutClients.forEach { client ->
                    Log.d(TAG, "断开超时客户端连接: ${client.clientSocket.inetAddress.hostAddress}")
                    client.stop()
                }
            }
        }
    }

    /**
     * 发送消息给所有连接的客户端
     * @param message 要发送的消息
     * @return 是否发送成功
     */
    fun sendMessageToAll(message: String): Boolean {
        if (!isRunning) {
            return false
        }
        synchronized(clients) {
            if (clients.isEmpty()) {
                return false
            }
            clients.forEach { it.sendMessage(message) }
        }
        return true
    }

    /**
     * 获取当前连接的客户端数量
     * @return 客户端数量
     */
    fun getConnectedClientsCount(): Int {
        synchronized(clients) {
            return clients.size
        }
    }

    /**
     * 检查Socket服务器是否运行
     * @return 运行状态
     */
    fun isServerRunning(): Boolean {
        return isRunning
    }

    /**
     * 获取Socket服务器端口号
     * @return 端口号
     */
    fun getSocketPort(): Int {
        return SOCKET_PORT
    }

    /**
     * 处理客户端消息
     * @param msgText 消息
     * @param client 客户端
     */
    fun handleClientMessage(msgText: String, client: ClientHandler) {
        Log.d(TAG, "接收到客户端消息：$msgText")
        val message = TelecontrolHelper.parseMessage(msgText)

        when (message.topic) {
            // 处理客户端发送的心跳消息
            HEARTBEAT_TOPIC -> {
                client.let {
                    it.lastHeartbeatTime = System.currentTimeMillis()
                    Log.d(TAG, "收到客户端心跳消息: ${it.clientSocket.inetAddress.hostAddress}")
                    it.sendHeartbeatACK()
                }
            }
            // 卧室空调控制
            TelecontrolHelper.TOPIC_RC_BEDROOM_AC -> {
                try {
                    val dataJSON = message.data as JSONObject
                    val action = dataJSON.optString("action")
                    val params = dataJSON.optJSONObject("params")
                    if (BedroomAirConditioner.triggerAction(action, params)) {
                        val topic = TelecontrolHelper.TOPIC_DEVICE_BEDROOM_AC
                        val data = BedroomAirConditioner.aCDevice.toJSON()
                        client.sendMessage(
                            TelecontrolHelper.createMessage(
                                topic,
                                data
                            )
                        ) // 通过socket发送卧室空调状态
                        MQTTTelecontrolServer.getInstance().publish(
                            topic, data, 1, true
                        ) // 通过mqtt发送卧室空调状态
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    /**
     * 客户端处理器内部类
     */
    inner class ClientHandler(val clientSocket: Socket) : Runnable {
        private lateinit var writer: PrintWriter
        var lastHeartbeatTime: Long = System.currentTimeMillis() // 最后心跳时间，默认为当前时间

        override fun run() {
            try {
                val reader = BufferedReader(InputStreamReader(clientSocket.getInputStream()))
                writer = PrintWriter(clientSocket.getOutputStream(), true)

                val clientAddress = clientSocket.inetAddress.hostAddress
                Log.d(TAG, "新客户端已连接: $clientAddress")

                // 读取客户端消息
                var line: String? = null
                while (isRunning && reader.readLine().also { line = it } != null) {
                    line?.let { handleClientMessage(it, this) }
                }
            } catch (e: IOException) {
                Log.e(TAG, "处理客户端时出错: ${e.message}")
            } finally {
                stop()
            }
        }

        /**
         * 发送消息给客户端
         */
        fun sendMessage(message: String) {
            try {
                writer.println(message)
            } catch (e: Exception) {
                Log.e(TAG, "发送消息时出错: ${e.message}")
            }
        }

        /**
         * 发送确认心跳消息给客户端
         */
        fun sendHeartbeatACK() {
            val json = JSONObject()
            json.put("topic", HEARTBEAT_ACK_TOPIC)
            sendMessage(json.toString())
        }

        /**
         * 停止客户端连接
         */
        fun stop() {
            try {
                writer.close()
                clientSocket.close()
                synchronized(clients) {
                    clients.remove(this)
                }
                if (clients.isEmpty()) {
                    stopHeartbeatCheckThread()
                }
            } catch (e: IOException) {
                Log.e(TAG, "关闭客户端连接时出错: ${e.message}")
            }
        }
    }
}