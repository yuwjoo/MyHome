package com.yuwjoo.myhome.common.telecontrol.devices

import com.yuwjoo.myhome.activity.main.ui.webview.BridgeConstant
import com.yuwjoo.myhome.activity.main.ui.webview.getBridge
import com.yuwjoo.myhome.common.telecontrol.MQTTTelecontrol
import com.yuwjoo.myhome.common.telecontrol.SocketTelecontrol
import com.yuwjoo.myhome.common.telecontrol.utils.TelecontrolHelper
import com.yuwjoo.myhome.common.telecontrol.UDPTelecontrol
import com.yuwjoo.myhome.utils.webviewbridge.BridgeChannel
import org.json.JSONObject

object BedroomAC {
    private var aCStateJSONText: String? = null // 空调状态JSON字符串

    /**
     * 开机/关机
     */
    fun togglePower(payload: Any?, channel: BridgeChannel) {
        sendMessage("togglePower", payload)
    }

    /**
     * 增加温度
     */
    fun increaseTemperature(payload: Any?, channel: BridgeChannel) {
        sendMessage("increaseTemperature", payload)
    }

    /**
     * 降低温度
     */
    fun decreaseTemperature(payload: Any?, channel: BridgeChannel) {
        sendMessage("decreaseTemperature", payload)
    }

    /**
     * 切换摆风状态
     */
    fun toggleSwing(payload: Any?, channel: BridgeChannel) {
        sendMessage("toggleSwing", payload)
    }

    /**
     * 设置制冷模式
     */
    fun setCoolingMode(payload: Any?, channel: BridgeChannel) {
        sendMessage("setCoolingMode", payload)
    }

    /**
     * 设置制热模式
     */
    fun setHeatingMode(payload: Any?, channel: BridgeChannel) {
        sendMessage("setHeatingMode", payload)
    }

    /**
     * 切换风速
     */
    fun toggleWindSpeed(payload: Any?, channel: BridgeChannel) {
        sendMessage("toggleWindSpeed", payload)
    }

    /**
     * 启用舒风模式
     */
    fun enableGentleMode(payload: Any?, channel: BridgeChannel) {
        sendMessage("enableGentleMode", payload)
    }

    /**
     * 切换睡眠模式
     */
    fun toggleSleepMode(payload: Any?, channel: BridgeChannel) {
        sendMessage("toggleSleepMode", payload)
    }

    /**
     * 设置定时
     */
    fun setTiming(payload: Any?, channel: BridgeChannel) {
        sendMessage("setTiming", payload)
    }

    /**
     * 取消定时
     */
    fun cancelTiming(payload: Any?, channel: BridgeChannel) {
        sendMessage("cancelTiming", payload)
    }

    /**
     * 更新空调状态
     * @param stateJSON 空调状态JSON字符串
     */
    fun updateACState(stateJSON: String?) {
        aCStateJSONText = stateJSON
        getBridge()?.globalChannel?.send(BridgeConstant.EVENT_SYNC_BEDROOM_AC_STATE, stateJSON)
    }

    /**
     * 获取空调状态
     */
    fun getACState(payload: Any?, channel: BridgeChannel) {
        channel.done(payload = aCStateJSONText ?: "")
    }

    /**
     * 获取MQTT状态
     */
    fun getMQTTState(payload: Any?, channel: BridgeChannel) {
        channel.done(payload = MQTTTelecontrol.getInstance().isConnected())
    }

    /**
     * 获取Socket状态
     */
    fun getSocketState(payload: Any?, channel: BridgeChannel) {
        channel.done(payload = SocketTelecontrol.getInstance().isConnected())
    }

    /**
     * 发送消息
     * @param action 动作
     * @param params 参数
     */
    private fun sendMessage(action: String, params: Any?) {
        if (SocketTelecontrol.getInstance().isConnected()) {
            val data = JSONObject()
            data.put("action", action)
            data.put("params", params)
            val msg =
                TelecontrolHelper.createMessage(TelecontrolHelper.TOPIC_RC_BEDROOM_AC, data)
            SocketTelecontrol.getInstance().sendMessage(msg)
        } else if (UDPTelecontrol.serverIP != null) {
            UDPTelecontrol.sendBedroomACMessage(action, params)
        } else {
            val data = JSONObject()
            data.put("action", action)
            data.put("params", params)
            MQTTTelecontrol.getInstance()
                .publish(TelecontrolHelper.TOPIC_RC_BEDROOM_AC, data.toString())
        }
    }
}