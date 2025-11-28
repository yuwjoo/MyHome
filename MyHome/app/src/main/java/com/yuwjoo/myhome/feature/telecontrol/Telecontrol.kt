package com.yuwjoo.myhome.feature.telecontrol

import com.yuwjoo.myhome.feature.telecontrol.controllers.MQTTController
import com.yuwjoo.myhome.feature.telecontrol.utils.MessageUtil.ActionMessage

/**
 * 遥控类
 */
object Telecontrol {

    /**
     * 启动
     */
    fun start() {
        // 连接mqtt控制器
        if (!MQTTController.isConnected) {
            MQTTController.connect()
        }
//        // 启动udp控制器
//        UDPController.start()
//        // 服务设备添加监听器
//        UDPController.setOnServerDeviceAdd { info ->
//            if (!SocketController.isConnected) {
//                // 连接socket控制器
//                SocketController.connect(info.ip, info.socketPort)
//            }
//        }
//        // 主动扫描服务设备
//        UDPController.scanDevice()
    }

    /**
     * 停止
     */
    fun stop() {
        // 断开mqtt连接
        MQTTController.disconnect()
//        // 断开socket连接
//        SocketController.disconnect()
//        // 关闭udp控制器
//        UDPController.close()
    }

    /**
     * 关闭
     */
    fun close() {
        // 关闭mqtt控制器
        MQTTController.close()
//        // 关闭socket连接
//        SocketController.close()
//        // 关闭udp控制器
//        UDPController.close()
    }

    /**
     * 发送消息
     * @param topic 主题
     * @param action 动作
     * @param params 参数
     */
    fun sendMessage(topic: String, action: String, params: Any? = null) {
        val data = ActionMessage.text(action, params)

        // 通过mqtt控制器发送消息
        MQTTController.sendMessage(topic, data)
//        // 通过socket控制器发送消息
//        SocketController.sendMessage(topic, data)
//        // 通过udp控制器发送消息
//        UDPController.sendMessage(topic, data)
    }
}