package com.yuwjoo.myhome.common.topic

import com.yuwjoo.myhome.common.topic.base.TopicDef
import com.yuwjoo.myhome.common.topic.payload.CmdBedroomACPayload
import com.yuwjoo.myhome.common.topic.payload.DataBedroomACPayload
import com.yuwjoo.myhome.common.topic.payload.DataESP8266Payload
import com.yuwjoo.myhome.common.topic.payload.DataTempHumidSensorPayload

/**
 * 卧室空调遥控指令
 */
data object CmdBedroomACTopic : TopicDef<CmdBedroomACPayload>() {
    override val topic = "YHome/cmd/bedroomAC"
    override val qos = 1
    override fun toPayload(json: String) = CmdBedroomACPayload(json)
}

/**
 * 卧室空调上报数据
 */
data object DataBedroomACTopic : TopicDef<DataBedroomACPayload>() {
    override val topic = "YHome/data/bedroomAC"
    override val qos = 1
    override fun toPayload(json: String) = DataBedroomACPayload(json)
}

/**
 * 温湿度传感器上报数据
 */
data object DataTempHumidSensorTopic : TopicDef<DataTempHumidSensorPayload>() {
    override val topic = "YHome/data/tempHumidSensor"
    override val qos = 1
    override fun toPayload(json: String) = DataTempHumidSensorPayload(json)
}

/**
 * ESP8266 上报数据
 */
data object DataESP8266Topic : TopicDef<DataESP8266Payload>() {
    override val topic = "YHome/data/ESP8266"
    override val qos = 1
    override fun toPayload(json: String) = DataESP8266Payload(json)
}
