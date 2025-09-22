package com.yuwjoo.myirrc.common.telecontrol.devices

import android.content.Context.CONSUMER_IR_SERVICE
import android.hardware.ConsumerIrManager
import android.widget.Toast
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.yuwjoo.myirrc.MyApplication
import com.yuwjoo.myirrc.activity.main.MainActivity
import org.json.JSONObject

/**
 * 卧室空调类
 */
class BedroomAirConditioner {

    /**
     * 空调设备类
     */
    class ACDevice {

        companion object {
            private val gson = Gson()

            const val MODE_COOLING = "COOLING" // 制冷
            const val MODE_HEATING = "HEATING" // 制热

            const val FAN_SPEED_AUTO = -1 // 自动
            const val FAN_SPEED_LEVEL_1 = 1 // 风速1
            const val FAN_SPEED_LEVEL_2 = 2 // 风速2
            const val FAN_SPEED_LEVEL_3 = 3 // 风速3
            const val FAN_SPEED_LEVEL_4 = 4 // 风速4
            const val FAN_SPEED_LEVEL_5 = 5 // 风速5
            const val FAN_SPEED_LEVEL_6 = 6 // 风速6
            const val FAN_SPEED_LEVEL_7 = 7  // 风速7

            const val WIND_DIRECTION_UP = "UP"  // 上
            const val WIND_DIRECTION_MIDDLE = "MIDDLE"  // 中
            const val WIND_DIRECTION_DOWN = "DOWN"  // 下
            const val WIND_DIRECTION_UNKNOWN = "UNKNOWN"  // 未知

            const val MIN_TEMPERATURE = 16 // 最小温度
            const val MAX_TEMPERATURE = 32 // 最大温度
        }

        @SerializedName("isPowerOn")
        var isPowerOn: Boolean = false // 电源状态

        @SerializedName("temperature")
        var temperature: Int = 16 // 温度（摄氏度）

        @SerializedName("mode")
        var mode: String = MODE_COOLING // 运行模式

        @SerializedName("fanSpeed")
        var fanSpeed: Int = FAN_SPEED_AUTO // 风速

        @SerializedName("windDirection")
        var windDirection: String = WIND_DIRECTION_UNKNOWN // 风向

        @SerializedName("isAutoSwing")
        var isAutoSwing: Boolean = false // 是否自动扫风

        @SerializedName("isScreenDisplay")
        var isScreenDisplay: Boolean = false // 是否屏显

        @SerializedName("timerStartTimestamp")
        var timerStartTimestamp: Long? = null // 定时开始时间戳（毫秒）

        @SerializedName("timerEndTimestamp")
        var timerEndTimestamp: Long? = null // 定时结束时间戳（毫秒）

        /**
         * 将空调状态转换为JSON字符串
         * @return JSON格式的字符串
         */
        fun toJSON(): String {
            return gson.toJson(this)
        }
    }

    companion object {
        private val cim =
            MyApplication.appContext.getSystemService(CONSUMER_IR_SERVICE) as ConsumerIrManager
        var aCDevice = ACDevice()

        /**
         * 触发动作
         * @param action 动作
         * @param params 参数
         * @return 是否有效动作
         */
        fun triggerAction(action: String, params: JSONObject? = null): Boolean {
            when (action) {
                "togglePower" -> togglePower() // 切换空调电源状态（开机/关机）
                "increaseTemperature" -> increaseTemperature() // 增加温度
                "decreaseTemperature" -> decreaseTemperature() // 降低温度
                "toggleSwing" -> toggleSwing() // 切换摆风状态
                "setCoolingMode" -> setCoolingMode() // 设置制冷模式
                "setHeatingMode" -> setHeatingMode() // 设置制热模式
                "toggleWindSpeed" -> toggleWindSpeed()// 切换风速
                "enableGentleMode" -> enableGentleMode() // 启用舒风模式
                "toggleSleepMode" -> toggleSleepMode() // 切换睡眠模式
                "setTiming" -> setTiming(params) // 设置定时
                "cancelTiming" -> cancelTiming() // 取消定时
                else -> return false
            }
            Toast.makeText(MainActivity.activity, "执行指令：$action", Toast.LENGTH_LONG).show()
            return true
        }

        /**
         * 开机/关机
         */
        private fun togglePower() {
            sendIRCode("00010000")
            aCDevice.isPowerOn = !aCDevice.isPowerOn
            aCDevice.timerStartTimestamp = null
            aCDevice.timerEndTimestamp = null
        }

        /**
         * 增加温度
         */
        private fun increaseTemperature() {
            if (aCDevice.temperature >= ACDevice.MAX_TEMPERATURE) return
            sendIRCode("10001000")
            aCDevice.temperature++
        }

        /**
         * 降低温度
         */
        private fun decreaseTemperature() {
            if (aCDevice.temperature <= ACDevice.MIN_TEMPERATURE) return
            sendIRCode("10110000")
            aCDevice.temperature--
        }

        /**
         * 切换摆风状态
         */
        private fun toggleSwing() {
            sendIRCode("01100000")
            aCDevice.isAutoSwing = !aCDevice.isAutoSwing
            aCDevice.windDirection = ACDevice.WIND_DIRECTION_UNKNOWN
        }

        /**
         * 设置制冷模式
         */
        private fun setCoolingMode() {
            sendIRCode("01101000")
            aCDevice.mode = ACDevice.MODE_COOLING
        }

        /**
         * 设置制热模式
         */
        private fun setHeatingMode() {
            sendIRCode("00101000")
            aCDevice.mode = ACDevice.MODE_HEATING
        }

        /**
         * 切换风速
         */
        private fun toggleWindSpeed() {
            sendIRCode("10100000")
            aCDevice.fanSpeed = when (aCDevice.fanSpeed) {
                ACDevice.FAN_SPEED_AUTO -> ACDevice.FAN_SPEED_LEVEL_1
                ACDevice.FAN_SPEED_LEVEL_1 -> ACDevice.FAN_SPEED_LEVEL_2
                ACDevice.FAN_SPEED_LEVEL_2 -> ACDevice.FAN_SPEED_LEVEL_3
                ACDevice.FAN_SPEED_LEVEL_3 -> ACDevice.FAN_SPEED_LEVEL_4
                ACDevice.FAN_SPEED_LEVEL_4 -> ACDevice.FAN_SPEED_LEVEL_5
                ACDevice.FAN_SPEED_LEVEL_5 -> ACDevice.FAN_SPEED_LEVEL_6
                ACDevice.FAN_SPEED_LEVEL_6 -> ACDevice.FAN_SPEED_LEVEL_7
                else -> ACDevice.FAN_SPEED_AUTO
            }
        }

        /**
         * 启用舒风模式
         */
        private fun enableGentleMode() {
            sendIRCode("10000000")
            aCDevice.isAutoSwing = false
            aCDevice.windDirection = ACDevice.WIND_DIRECTION_UP
        }

        /**
         * 切换睡眠模式
         */
        private fun toggleSleepMode() {
            sendIRCode("00100000")
            aCDevice.isScreenDisplay = !aCDevice.isScreenDisplay
        }

        /**
         * 设置定时
         * @param params 参数
         */
        private fun setTiming(params: JSONObject? = null) {
            if (aCDevice.timerEndTimestamp != null) return
            val hours = params?.optInt("hours", 0) ?: 0
            if (hours <= 0) return
            sendIRCode("01110000")
            for (i in 1 until hours) {
                sendIRCode("10001000")
            }
            sendIRCode("10000000")
            val now = System.currentTimeMillis()
            aCDevice.timerStartTimestamp = now
            aCDevice.timerEndTimestamp = now + (hours * 60 * 60 * 1000)
        }

        /**
         * 取消定时
         */
        private fun cancelTiming() {
            if ((aCDevice.timerEndTimestamp ?: 0) <= System.currentTimeMillis()) return
            sendIRCode("01110000")
            aCDevice.timerStartTimestamp = null
            aCDevice.timerEndTimestamp = null
        }

        /**
         * 生成红外码数据
         * @param binaryText 二进制字符串
         * @return 红外码集合
         */
        private fun generateCodeArr(binaryText: String): IntArray {
            val codeList = mutableListOf<Int>()
            // 添加引导码
            codeList.add(9000)
            codeList.add(4500)
            // 添加用户码
            codeList.addAll(
                listOf(
                    560, 1650, 560, 560, 560, 560, 560, 560,
                    560, 1650, 560, 560, 560, 560, 560, 560,
                    560, 560, 560, 1650, 560, 1650, 560, 1650,
                    560, 1696, 560, 1650, 560, 1650, 560, 560
                )
            )
            val dataBinaryArr = binaryText.map { it.toString().toInt() }.toIntArray()
            // 添加数据码
            dataBinaryArr.forEach {
                // 1 对应 560, 1650
                // 0 对应 560, 560
                codeList.add(560)
                codeList.add(if (it == 1) 1650 else 560)
            }
            // 添加数据反码
            dataBinaryArr.forEach {
                // 反码：1 -> 0, 0 -> 1
                val inverseBit = if (it == 1) 0 else 1
                codeList.add(560)
                codeList.add(if (inverseBit == 1) 1650 else 560)
            }
            // 添加结束码
            codeList.add(560)

            return codeList.toIntArray()
        }

        /**
         * 发送红外信号
         * @param dataCode 数据二进制码
         */
        private fun sendIRCode(dataCode: String) {
            cim.transmit(38000, generateCodeArr(dataCode)) // 使用38KHz频率发送红外信号
        }
    }
}