package com.yuwjoo.myhome.module.udp.client.router

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import com.yuwjoo.myhome.module.udp.client.model.FrameData

/**
 * 消息路由：按帧类型 when 分发到各 Handler
 */
internal class MessageRouter(
    private val heartbeatHandler: HeartbeatHandler,
    private val handshakeHandler: HandshakeHandler,
    private val offlineHandler: OfflineHandler,
    private val ackHandler: AckHandler,
    private val orderedMsgHandler: OrderedMsgHandler,
) {
    companion object {
        private const val TAG = "MessageRouter"
    }

    /**
     * 根据帧类型分发到对应的 Handler 处理
     *
     * @param frame 解码后的帧数据
     * @param fromIp 发送方 IP
     */
    fun dispatch(frame: FrameData, fromIp: String) {
        when (frame.type) {
            FrameConfig.Type.HEARTBEAT -> heartbeatHandler.handle(fromIp) // 心跳帧 → 记录心跳或触发握手
            FrameConfig.Type.OFFLINE   -> offlineHandler.handle(fromIp) // 离线帧 → 标记设备离线
            FrameConfig.Type.CALL      -> handshakeHandler.handleCall(frame.payload, fromIp) // 呼叫帧 → 注册设备并回复 Answer
            FrameConfig.Type.ANSWER    -> handshakeHandler.handleAnswer(frame.payload, fromIp) // 应答帧 → 注册设备并初始化序号
            FrameConfig.Type.ACK       -> ackHandler.handle(frame.payload, fromIp) // ACK 帧 → 通知 AckEngine
            FrameConfig.Type.JSON      -> orderedMsgHandler.handle(frame, fromIp, isJson = true) // JSON 帧 → 序号校验后透传给上层
            FrameConfig.Type.RAW       -> orderedMsgHandler.handle(frame, fromIp, isJson = false) // 原始帧 → 序号校验后透传给上层
            else                        -> Log.w(TAG, "Unknown frame type: ${frame.type}")
        }
    }
}
