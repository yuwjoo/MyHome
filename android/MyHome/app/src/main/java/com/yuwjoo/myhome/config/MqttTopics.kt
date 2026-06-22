package com.yuwjoo.myhome.config

/**
 * MQTT 主题集中配置
 *
 * 所有 MQTT 主题在此统一定义，各模块通过 import 引用，
 * 避免主题字符串散落在多处，便于统一维护和修改。
 */
object MqttTopics {
    // ── 设备控制 ──

    /** 卧室空调遥控指令（publish） */
    const val TOPIC_AC_RC = "YHHome/RC/bedroomAC"

    /** 卧室空调设备状态（subscribe, retained） */
    const val TOPIC_AC_DEVICE = "YHHome/device/bedroomAC"

    // ── 传感器 ──

    /** 温湿度传感器数据（subscribe, retained） */
    const val TOPIC_TEMP_HUMID = "YHHome/sensor/tempHumid"

    // ── 系统 ──

    /** 设备遗嘱/在线状态（MQTT will + subscribe） */
    const val TOPIC_DEVICE_OFFLINE = "device/offline"
}
