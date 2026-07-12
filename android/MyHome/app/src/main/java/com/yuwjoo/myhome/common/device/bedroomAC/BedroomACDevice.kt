package com.yuwjoo.myhome.common.device.bedroomAC

import com.yuwjoo.myhome.common.topic.CmdBedroomACTopic
import com.yuwjoo.myhome.common.topic.DataBedroomACTopic
import com.yuwjoo.myhome.common.topic.enums.ACAction
import com.yuwjoo.myhome.common.topic.payload.CmdBedroomACPayload
import com.yuwjoo.myhome.common.topic.payload.DataBedroomACPayload
import com.yuwjoo.myhome.module.mqtt.MqttManager
import com.yuwjoo.myhome.module.mqtt.TopicCallback

/**
 * 卧室空调设备
 */
object BedroomACDevice {

    // 空调状态监听器集合
    private val acStateListeners = LinkedHashSet<ACStateCallback>()

    // 当前空调状态
    val acState = DataBedroomACPayload()

    init {
        MqttManager.subscribe(
            topic = DataBedroomACTopic.topic,
            qos = DataBedroomACTopic.qos,
            callback = TopicCallback { _, payload -> applyState(payload) }
        )
    }

    /**
     * 注册空调状态监听器
     *
     * @param listener 状态回调
     */
    fun registerACStateListener(listener: ACStateCallback) {
        acStateListeners.add(listener)
    }

    /**
     * 移除空调状态监听器
     *
     * @param listener 要移除的回调
     */
    fun unregisterACStateListener(listener: ACStateCallback) {
        acStateListeners.remove(listener)
    }

    /**
     * 切换电源开关
     */
    fun togglePower() = sendCommand(ACAction.TOGGLE_POWER)

    /**
     * 升高温度
     */
    fun increaseTemperature() = sendCommand(ACAction.INCREASE_TEMPERATURE)

    /**
     * 降低温度
     */
    fun decreaseTemperature() = sendCommand(ACAction.DECREASE_TEMPERATURE)

    /**
     * 切换摆风
     */
    fun toggleSwing() = sendCommand(ACAction.TOGGLE_SWING)

    /**
     * 设为制冷模式
     */
    fun setCoolingMode() = sendCommand(ACAction.SET_COOLING_MODE)

    /**
     * 设为制热模式
     */
    fun setHeatingMode() = sendCommand(ACAction.SET_HEATING_MODE)

    /**
     * 设为除湿模式
     */
    fun setDryMode() = sendCommand(ACAction.SET_DRY_MODE)

    /**
     * 设为送风模式
     */
    fun setFanMode() = sendCommand(ACAction.SET_FAN_MODE)

    /**
     * 切换风速
     */
    fun toggleWindSpeed() = sendCommand(ACAction.TOGGLE_WIND_SPEED)

    /**
     * 开启舒风模式
     */
    fun enableGentleMode() = sendCommand(ACAction.ENABLE_GENTLE_MODE)

    /**
     * 切换屏显开关
     */
    fun toggleLight() = sendCommand(ACAction.TOGGLE_LIGHT)

    /**
     * 设置定时开机
     *
     * @param minutes 定时分钟数，范围 0~720
     */
    fun setOnTimer(minutes: Int) {
        val params = mapOf("minutes" to minutes.coerceIn(0, 720))
        sendCommand(ACAction.SET_ON_TIMER, params)
    }

    /**
     * 设置定时关机
     *
     * @param minutes 定时分钟数，范围 0~720
     */
    fun setOffTimer(minutes: Int) {
        val params = mapOf("minutes" to minutes.coerceIn(0, 720))
        sendCommand(ACAction.SET_OFF_TIMER, params)
    }

    /**
     * 取消定时开机
     */
    fun cancelOnTimer() = sendCommand(ACAction.CANCEL_ON_TIMER)

    /**
     * 取消定时关机
     */
    fun cancelOffTimer() = sendCommand(ACAction.CANCEL_OFF_TIMER)

    /**
     * 发送遥控指令
     *
     * @param action 遥控指令
     * @param params 指令参数，仅定时类指令携带
     */
    private fun sendCommand(action: ACAction, params: Map<String, Any>? = null) {
        val payload = CmdBedroomACPayload(action = action, params = params)
        val json = payload.toJson()
        MqttManager.publish(
            topic = CmdBedroomACTopic.topic,
            payload = json,
            qos = CmdBedroomACTopic.qos,
        )
    }

    /**
     * 解析 MQTT 收到的 retained 状态 JSON
     *
     * @param jsonStr MQTT 消息内容
     */
    private fun applyState(jsonStr: String) {
        acState.fromJson(jsonStr)
        acStateListeners.forEach { it.onStateChanged(acState) }
    }
}
