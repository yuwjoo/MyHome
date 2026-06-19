package com.yuwjoo.myhomeserver.config

/**
 * MQTT 主题集中配置
 *
 * 所有 MQTT 主题在此统一定义，各模块通过 import 引用，
 * 避免主题字符串散落多处，便于统一维护和修改。
 */
object MqttTopics {
    // ── 系统 ──
    /** 设备遗嘱/在线状态（MQTT will + subscribe） */
    const val TOPIC_DEVICE_OFFLINE = "device/offline"

    // ── 直播 ──
    /** 直播推流远程指令（subscribe）：{ action: "start"|"stop", streamId } */
    const val TOPIC_LIVE_COMMAND = "YHHome/live/command"

    /** 直播推流状态上报（publish）：{ status, streamId, timestamp } */
    const val TOPIC_LIVE_STATUS = "YHHome/live/status"
}
