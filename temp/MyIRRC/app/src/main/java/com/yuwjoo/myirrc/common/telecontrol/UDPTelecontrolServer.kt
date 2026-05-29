package com.yuwjoo.myirrc.common.telecontrol

import com.yuwjoo.myirrc.common.telecontrol.devices.BedroomAirConditioner
import com.yuwjoo.myirrc.common.telecontrol.utils.TelecontrolHelper
import com.yuwjoo.myirrc.utils.UDPBroadcaster
import org.json.JSONObject
import java.net.DatagramSocket

/**
 * UDP遥控服务
 */
object UDPTelecontrolServer {
    const val TOPIC_SCAN_RC_DEVICES = "YHHome/scanRCDevices" // 扫描遥控服务设备消息主题
    const val TOPIC_IS_RC_DEVICE = "YHHome/isRCDevice" // 遥控服务设备应答消息主题
    private const val UDP_SERVER_PORT = 8000 // UDP服务端监听端口
    private const val UDP_CLIENT_PORT = 8001 // UDP客户端监听端口
    private var receiveDatagramSocket: DatagramSocket? = null // 监听UDP广播的Socket对象

    /**
     * 开始接收udp广播
     */
    fun startReceive() {
        if (receiveDatagramSocket != null) return
        receiveDatagramSocket = UDPBroadcaster.receiveBroadcast(UDP_SERVER_PORT) { packet, _ ->
            val msgText = String(packet.data, 0, packet.length)
            val message = TelecontrolHelper.parseMessage(msgText)

            when (message.topic) {
                // 扫描遥控服务设备
                TOPIC_SCAN_RC_DEVICES -> {
                    val host = packet.address.hostAddress ?: "255.255.255.255"
                    val resp = TelecontrolHelper.createMessage(
                        TOPIC_IS_RC_DEVICE,
                        SocketTelecontrolServer.getInstance().getSocketPort()
                    )
                    UDPBroadcaster.sendUnicast(host, UDP_CLIENT_PORT, resp)
                }
                // 卧室空调控制
                TelecontrolHelper.TOPIC_RC_BEDROOM_AC -> {
                    try {
                        val dataJSON = message.data as JSONObject
                        val action = dataJSON.optString("action")
                        val params = dataJSON.optJSONObject("params")
                        if (BedroomAirConditioner.triggerAction(action, params)) {
                            sendBedroomACStateMessage(BedroomAirConditioner.aCDevice) // 通过udp广播发送卧室空调状态
                            MQTTTelecontrolServer.getInstance().publish(
                                TelecontrolHelper.TOPIC_DEVICE_BEDROOM_AC,
                                BedroomAirConditioner.aCDevice.toJSON(),
                                1,
                                true
                            ) // 通过mqtt发送卧室空调状态
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    /**
     * 关闭接收udp广播
     */
    fun closeReceive() {
        receiveDatagramSocket?.close()
        receiveDatagramSocket = null
    }

    /**
     * 发送卧室空调状态消息
     * @param aCDevice 空调状态对象
     */
    fun sendBedroomACStateMessage(aCDevice: BedroomAirConditioner.ACDevice) {
        val msg =
            TelecontrolHelper.createMessage(TelecontrolHelper.TOPIC_DEVICE_BEDROOM_AC, aCDevice)
        UDPBroadcaster.sendBroadcast(UDP_CLIENT_PORT, msg)
    }

    /**
     * 是否监听UDP广播中
     * @return 是否监听中
     */
    fun isListening(): Boolean {
        return receiveDatagramSocket != null
    }
}