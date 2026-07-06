package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.tempHumidSensor.TempHumidSensorDevice
import com.yuwjoo.myhome.common.device.tempHumidSensor.TempHumidSensorCallback
import com.yuwjoo.myhome.module.bridge.annotation.BridgeGroup
import com.yuwjoo.myhome.module.bridge.annotation.BridgeMessage
import com.yuwjoo.myhome.module.bridge.core.MessageSender
import org.json.JSONObject

/**
 * 传感器分组
 */
@BridgeGroup("sensor")
class SensorGroup {

    private var stateCallback: TempHumidSensorCallback? = null

    /**
     * 温湿度传感器事件处理，根据 action 订阅或取消状态监听
     *
     * @param params 包含 action 字段 ("on" / "off") 的 JSON 对象
     */
    @BridgeMessage("tempHumid")
    fun tempHumid(params: JSONObject, sender: MessageSender) {
        val action = params.getString("action")

        when (action) {
            "on" -> {
                sender.sendEventMessage(JSONObject(TempHumidSensorDevice.sensorState.toJson()), isRetained = true)
                if (stateCallback == null) {
                    stateCallback = TempHumidSensorCallback { state ->
                        sender.sendEventMessage(JSONObject(state.toJson()), isRetained = true)
                    }
                    TempHumidSensorDevice.registerSensorListener(stateCallback!!)
                }
            }
            "off" -> {
                stateCallback?.let { TempHumidSensorDevice.unregisterSensorListener(it) }
                stateCallback = null
            }
        }
    }
}
