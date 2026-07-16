package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.module.bridge.annotation.BridgeGroup
import com.yuwjoo.myhome.module.bridge.annotation.BridgeMessage
import com.yuwjoo.myhome.module.bridge.core.MessageSender
import com.yuwjoo.myhome.module.udp.UdpManager
import com.yuwjoo.myhome.module.udp.listener.ConnectionListener
import com.yuwjoo.myhome.module.udp.listener.DeviceListener
import com.yuwjoo.myhome.module.udp.model.LanDevice
import org.json.JSONArray
import org.json.JSONObject

/**
 * 局域网udp分组
 */
@BridgeGroup("lanUdp")
class LanUdpGroup {

    private var deviceListener: DeviceListener? = null // 设备变更监听
    private var connectionListener: ConnectionListener? = null // 连接状态监听

    /**
     * 获取内网设备列表
     */
    @BridgeMessage("getDeviceList")
    fun getDeviceList(params: JSONObject, sender: MessageSender) {
        val devices = UdpManager.onlineDeviceList
        val jsonArray = JSONArray()
        for (device in devices) {
            jsonArray.put(LanDevice.toObject(device))
        }
        val data = JSONObject().apply {
            put("devices", jsonArray)
        }
        sender.send("getDeviceList", data)
    }

    /**
     * 监听内网设备变更
     *
     * @param params 包含 action 字段 ("on" / "off") 的 JSON 对象
     */
    @BridgeMessage("deviceChanged")
    fun deviceChanged(params: JSONObject, sender: MessageSender) {
        val action = params.getString("action")
        when (action) {
            "on" -> {
                if (deviceListener == null) {
                    deviceListener = DeviceListener { devices ->
                        val jsonArray = JSONArray()
                        for (device in devices) {
                            jsonArray.put(LanDevice.toObject(device))
                        }
                        val data = JSONObject().apply {
                            put("devices", jsonArray)
                        }
                        sender.send("deviceChanged", data)
                    }
                    UdpManager.registerDeviceListener(deviceListener!!)
                }
            }
            "off" -> {
                deviceListener?.let { UdpManager.unregisterDeviceListener(it) }
                deviceListener = null
            }
        }
    }

    /**
     * 监听连接状态变更
     *
     * @param params 包含 action 字段 ("on" / "off") 的 JSON 对象
     */
    @BridgeMessage("connectionChanged")
    fun connectionChanged(params: JSONObject, sender: MessageSender) {
        val action = params.getString("action")
        when (action) {
            "on" -> {
                if (connectionListener == null) {
                    connectionListener = ConnectionListener { connected ->
                        sender.sendEventMessage(
                            JSONObject().apply {
                                put("connected", connected)
                            },
                            isRetained = true,
                        )
                    }
                    UdpManager.registerConnectionListener(connectionListener!!)
                }
            }
            "off" -> {
                connectionListener?.let { UdpManager.unregisterConnectionListener(it) }
                connectionListener = null
            }
        }
    }
}
