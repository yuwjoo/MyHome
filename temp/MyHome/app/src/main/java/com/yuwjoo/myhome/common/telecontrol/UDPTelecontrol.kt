package com.yuwjoo.myhome.common.telecontrol

import com.yuwjoo.myhome.common.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.common.telecontrol.utils.TelecontrolHelper
import com.yuwjoo.myhome.utils.UDPBroadcaster
import org.json.JSONObject

/**
 * UDP遥控
 */
object UDPTelecontrol {
    const val TOPIC_SCAN_RC_DEVICES = "YHHome/scanRCDevices" // 扫描遥控服务设备消息主题
    const val TOPIC_IS_RC_DEVICE = "YHHome/isRCDevice" // 遥控服务设备应答消息主题
    private const val UDP_SERVER_PORT = 8000 // UDP服务端监听端口
    private const val UDP_CLIENT_PORT = 8001 // UDP客户端监听端口
    var serverIP: String? = null // 服务端IP

    init {
        UDPBroadcaster.receiveBroadcast(UDP_CLIENT_PORT) { packet, _ ->
            val msgText = String(packet.data, 0, packet.length)
            val message = TelecontrolHelper.parseMessage(msgText)

            when (message.topic) {
                // 遥控服务设备应答
                TOPIC_IS_RC_DEVICE -> {
                    val serverSocketPort = message.data as? Int // 服务端Socket端口
                    serverIP = packet.address.hostAddress // 服务端IP
                    if (!SocketTelecontrol.getInstance().isConnected()) {
                        SocketTelecontrol.getInstance()
                            .connect(serverIP, serverSocketPort) // 连接Socket遥控
                    }
                }
                // 卧室空调设备状态变更
                TelecontrolHelper.TOPIC_DEVICE_BEDROOM_AC -> {
                    BedroomAC.updateACState(message.data as? String)
                }
            }
        }
    }

    /**
     * 扫描服务设备
     */
    fun scanServerDevices() {
        UDPBroadcaster.sendBroadcast(
            UDP_SERVER_PORT,
            TelecontrolHelper.createMessage(TOPIC_SCAN_RC_DEVICES),
            3,
            1000
        )
    }

    /**
     * 发送卧室空调控制消息
     * @param action 动作
     * @param params 参数
     */
    fun sendBedroomACMessage(action: String, params: Any?) {
        if (serverIP == null) return
        val data = JSONObject()
        data.put("action", action)
        data.put("params", params)
        val msg = TelecontrolHelper.createMessage(TelecontrolHelper.TOPIC_RC_BEDROOM_AC, data)
        UDPBroadcaster.sendUnicast(serverIP!!, UDP_SERVER_PORT, msg)
    }
}