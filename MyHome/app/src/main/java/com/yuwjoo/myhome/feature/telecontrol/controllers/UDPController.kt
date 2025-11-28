package com.yuwjoo.myhome.feature.telecontrol.controllers

import com.yuwjoo.myhome.feature.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.feature.telecontrol.utils.MQTTTConstant
import com.yuwjoo.myhome.feature.telecontrol.utils.MessageUtil
import com.yuwjoo.myhome.common.utils.UDPBroadcasterUtil
import java.net.DatagramSocket

/**
 * UDP遥控
 */
object UDPController {

    data class DeviceInfo(
        val ip: String, // 服务设备ip
        val socketPort: Int // 服务设备socket端口
    )

    private const val TOPIC_SCAN_RC_DEVICES = "YHHome/scanRCDevices" // 扫描遥控服务设备消息主题
    private const val TOPIC_IS_RC_DEVICE = "YHHome/isRCDevice" // 遥控服务设备应答消息主题
    private const val UDP_SERVER_PORT = 8000 // UDP服务端监听端口
    private const val UDP_CLIENT_PORT = 8001 // UDP客户端监听端口
    private var receiveDatagramSocket: DatagramSocket? = null // udp socket实例
    private var onServerDeviceAdd: ((info: DeviceInfo) -> Unit)? = null // 监听服务设备添加

    val devices: HashSet<DeviceInfo> = HashSet() // 服务设备集合

    /**
     * 启动
     */
    fun start() {
        if (receiveDatagramSocket != null) return
        receiveDatagramSocket = UDPBroadcasterUtil.receiveBroadcast(UDP_CLIENT_PORT) { packet, _ ->
            val message = String(packet.data, 0, packet.length)
            val msg = MessageUtil.MessageBody.parse(message)

            when (msg?.topic) {
                // 遥控服务设备应答
                TOPIC_IS_RC_DEVICE -> {
                    val ip = packet.address.hostAddress // 服务端ip
                    val socketPort = msg.data as Int // 服务端Socket端口号
                    val info = DeviceInfo(ip!!, socketPort)
                    devices.plus(info)
                    onServerDeviceAdd?.invoke(info)
                }
                // 卧室空调设备状态变更
                MQTTTConstant.TOPIC_DEVICE_BEDROOM_AC -> {
                    BedroomAC.syncACState(msg.data as? String)
                }
            }
        }
    }

    /**
     * 关闭
     */
    fun close() {
        receiveDatagramSocket?.close()
        receiveDatagramSocket = null
    }

    /**
     * 扫描服务设备
     * @param callback 完成回调
     */
    fun scanDevice(callback: (() -> Unit)? = null) {
        devices.clear()
        UDPBroadcasterUtil.sendBroadcast(
            UDP_SERVER_PORT,
            MessageUtil.MessageBody.text(TOPIC_SCAN_RC_DEVICES),
            3,
            1000,
            callback
        )
    }

    /**
     * 设置服务设备添加监听器
     * @param callback 回调函数
     */
    fun setOnServerDeviceAdd(callback: ((info: DeviceInfo) -> Unit)?) {
        onServerDeviceAdd = callback
    }

    /**
     * 发送消息
     * @param topic 主题
     * @param data 数据
     */
    fun sendMessage(topic: String, data: String? = null) {
        val msg = MessageUtil.MessageBody.text(topic, data)
        devices.forEach { info ->
            UDPBroadcasterUtil.sendUnicast(info.ip, UDP_SERVER_PORT, msg)
        }
    }
}