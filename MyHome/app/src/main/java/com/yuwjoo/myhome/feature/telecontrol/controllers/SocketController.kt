package com.yuwjoo.myhome.feature.telecontrol.controllers

import com.yuwjoo.myhome.MainActivity
import com.yuwjoo.myhome.common.bridge.BridgeConstant
import com.yuwjoo.myhome.feature.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.feature.telecontrol.utils.MQTTTConstant
import com.yuwjoo.myhome.feature.telecontrol.utils.MessageUtil
import com.yuwjoo.myhome.feature.telecontrol.utils.SocketClient

/**
 * Socket控制器
 */
object SocketController {

    private const val TAG = "SocketTelecontrol"
    private var socketClient: SocketClient? = null // socket连接实例
    private var serverIp: String? = null // 服务器IP
    private var serverPort: Int? = null // 服务器端口

    val isConnected: Boolean get() = socketClient?.isConnected ?: false // 连接状态

    /**
     * 连接到Socket服务器
     * @param ip 服务器IP地址
     * @param port 服务器端口
     */
    fun connect(ip: String? = serverIp, port: Int? = serverPort) {
        if (isConnected && ip == serverIp && port == serverPort) return
        if (ip == null || port == null) return

        serverIp = ip
        serverPort = port

        socketClient = SocketClient(serverIp!!, serverPort!!)

        // 监听连接状态改变
        socketClient!!.setOnConnectListener { _ ->
            updateMqttStateToWeb()
        }
        // 监听接收的消息
        socketClient!!.setOnMessageListener { message ->
            onMessage(message)
        }

        socketClient!!.connect()
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        socketClient?.disconnect()
    }

    /**
     * 关闭连接
     */
    fun close() {
        socketClient?.close()
    }

    /**
     * 监听消息
     * @param message 消息
     */
    private fun onMessage(message: String) {
        val msg = MessageUtil.MessageBody.parse(message)

        when (msg?.topic) {
            // 卧室空调状态改变
            MQTTTConstant.TOPIC_DEVICE_BEDROOM_AC -> {
                BedroomAC.syncACState(msg.data as? String)
            }
        }
    }

    /**
     * 发送消息
     * @param topic 消息主题
     * @param data 消息内容
     */
    fun sendMessage(topic: String, data: String? = null) {
        val message = MessageUtil.MessageBody.text(topic, data)
        socketClient?.sendMessage(message)
    }

    /**
     * 更新连接状态到web端
     */
    private fun updateMqttStateToWeb() {
        MainActivity.instance?.apply {
            homeWebView.channel.send(
                BridgeConstant.EVENT_SYNC_SOCKET_STATE,
                isConnected
            )
        }
    }
}