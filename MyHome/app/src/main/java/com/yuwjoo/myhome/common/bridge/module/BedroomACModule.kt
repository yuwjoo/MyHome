package com.yuwjoo.myhome.common.bridge.module

import com.yuwjoo.myhome.common.bridge.BridgeConstant
import com.yuwjoo.myhome.feature.telecontrol.controllers.MQTTController
import com.yuwjoo.myhome.feature.telecontrol.controllers.SocketController
import com.yuwjoo.myhome.feature.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.common.bridge.core.WebViewBridge

/**
 * 卧室空调模块
 */
object BedroomACModule {

    /**
     * 初始化
     * @param bridge web桥对象
     */
    fun init(bridge: WebViewBridge) {
        bridge.apply {
            // 开机/关机
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_TOGGLE_POWER) { _, channel ->
                BedroomAC.togglePower()
                channel.done()
            }
            // 增加温度
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_INCREASE_TEMPERATURE) { _, channel ->
                BedroomAC.increaseTemperature()
                channel.done()
            }
            // 降低温度
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_DECREASE_TEMPERATURE) { _, channel ->
                BedroomAC.decreaseTemperature()
                channel.done()
            }
            // 切换摆风状态
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_TOGGLE_SWING) { _, channel ->
                BedroomAC.toggleSwing()
                channel.done()
            }
            // 设置制冷模式
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_SET_COOLING_MODE) { _, channel ->
                BedroomAC.setCoolingMode()
                channel.done()
            }
            // 设置制热模式
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_SET_HEATING_MODE) { _, channel ->
                BedroomAC.setHeatingMode()
                channel.done()
            }
            // 切换风速
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_TOGGLE_WIND_SPEED) { _, channel ->
                BedroomAC.toggleWindSpeed()
                channel.done()
            }
            // 启用舒风模式
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_ENABLE_GENTLE_MODE) { _, channel ->
                BedroomAC.enableGentleMode()
                channel.done()
            }
            // 切换睡眠模式
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_TOGGLE_SLEEP_MODE) { _, channel ->
                BedroomAC.toggleSleepMode()
                channel.done()
            }
            // 设置定时
            router.register<String>(BridgeConstant.API_BEDROOM_AC_SET_TIMING) { payload, channel ->
                BedroomAC.setTiming(payload)
                channel.done()
            }
            // 取消定时
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_CANCEL_TIMING) { _, channel ->
                BedroomAC.cancelTiming()
                channel.done()
            }
            // 获取空调状态
            router.register<Any?>(BridgeConstant.API_BEDROOM_AC_GET_AC_STATE) { _, channel ->
                channel.done(payload = BedroomAC.aCStateJSONText)
            }
            // 获取MQTT状态
            router.register<Any?>(BridgeConstant.API_TELECONTROL_GET_MQTT_STATE) { _, channel ->
                channel.done(payload = MQTTController.isConnected)
            }
            // 获取Socket状态
            router.register<Any?>(BridgeConstant.API_TELECONTROL_GET_SOCKET_STATE) { _, channel ->
                channel.done(payload = SocketController.isConnected)
            }
        }
    }
}