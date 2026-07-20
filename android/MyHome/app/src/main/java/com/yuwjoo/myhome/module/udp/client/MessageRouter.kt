package com.yuwjoo.myhome.module.udp.client

import android.util.Log

/**
 * 消息路由：按帧类型分发到不同处理器，连接接收层与业务模块
 */
internal class MessageRouter(
    private val socketManager: SocketManager,
    private val deviceRegistry: DeviceRegistry,
    private val ackEngine: AckEngine,
    private val seqManager: SeqManager,
) {
    companion object {
        private const val TAG = "MessageRouter"
    }

    var onMessageListener: ((frame: FrameData, fromIp: String) -> Unit)? = null // 原始消息回调（JSON/Raw）→ 通知上层

    /**
     * 分发收到的帧到对应处理器
     *
     * @param frame  解码后的帧
     * @param fromIp 来源 IP
     */
    fun dispatch(frame: FrameData, fromIp: String) {
        when (frame.type) {
            UdpConfig.Type.HEARTBEAT -> handleHeartbeat(frame, fromIp)
            UdpConfig.Type.OFFLINE   -> handleOffline(frame, fromIp)
            UdpConfig.Type.CALL       -> handleCall(frame, fromIp)
            UdpConfig.Type.ANSWER     -> handleAnswer(frame, fromIp)
            UdpConfig.Type.ACK        -> handleAck(frame, fromIp)
            UdpConfig.Type.JSON       -> handleJson(frame, fromIp)
            UdpConfig.Type.RAW        -> handleRaw(frame, fromIp)
            else                      -> Log.w(TAG, "Unknown frame type: ${frame.type}")
        }
    }

    /**
     * 处理心跳帧：标记设备在线，首次发现时发起 CALL 探索
     */
    private fun handleHeartbeat(frame: FrameData, fromIp: String) {
        val isNew = deviceRegistry.get(fromIp) == null
        deviceRegistry.markOnline(fromIp)

        if (isNew) {
            // 首次发现设备，发送 CALL 帧以触发设备信息交换
            val payload = buildLocalDevicePayload()
            val callFrame = FrameCodec.encode(
                type = UdpConfig.Type.CALL,
                seqNum = 0,
                flags = UdpConfig.Flags.NONE,
                payload = payload,
            )
            socketManager.sendUnicast(callFrame, fromIp)
            Log.d(TAG, "Sent CALL to new device: $fromIp")
        }

        // 检查是否需要回复 ACK（心跳一般不需要，但协议支持）
        replyAckIfNeeded(frame, fromIp)
    }

    /**
     * 处理离线帧：标记设备离线
     */
    private fun handleOffline(frame: FrameData, fromIp: String) {
        deviceRegistry.markOffline(fromIp)
        Log.d(TAG, "Device offline: $fromIp")
    }

    /**
     * 处理 CALL 帧：记录对方设备信息，回复 ANSWER
     */
    private fun handleCall(frame: FrameData, fromIp: String) {
        val device = parseDeviceInfo(frame.payload)
        deviceRegistry.register(
            ip = fromIp,
            deviceName = device.deviceName,
            abilities = device.abilities,
        )

        // 回复本机信息
        val payload = buildLocalDevicePayload()
        val answerFrame = FrameCodec.encode(
            type = UdpConfig.Type.ANSWER,
            seqNum = 0,
            flags = UdpConfig.Flags.NONE,
            payload = payload,
        )
        socketManager.sendUnicast(answerFrame, fromIp)
        Log.d(TAG, "Responded ANSWER to $fromIp")

        replyAckIfNeeded(frame, fromIp)
    }

    /**
     * 处理 ANSWER 帧：记录对方设备信息
     */
    private fun handleAnswer(frame: FrameData, fromIp: String) {
        val device = parseDeviceInfo(frame.payload)
        deviceRegistry.register(
            ip = fromIp,
            deviceName = device.deviceName,
            abilities = device.abilities,
        )
        Log.d(TAG, "Answered device info from $fromIp")

        replyAckIfNeeded(frame, fromIp)
    }

    /**
     * 处理 ACK 帧：通知 AckEngine 确认
     */
    private fun handleAck(frame: FrameData, fromIp: String) {
        val ackSeq = parseAckSeq(frame.payload)
        if (ackSeq >= 0) {
            ackEngine.onAck(fromIp, ackSeq)
        }
    }

    /**
     * 处理 JSON 帧：去重 → 通知上层
     */
    private fun handleJson(frame: FrameData, fromIp: String) {
        if (frame.isOrdered && seqManager.isDuplicate(fromIp, frame.seqNum)) {
            Log.d(TAG, "Duplicate JSON from $fromIp seq=${frame.seqNum}")
            return
        }
        replyAckIfNeeded(frame, fromIp)
        onMessageListener?.invoke(frame, fromIp)
    }

    /**
     * 处理 RAW 帧：去重 → 通知上层
     */
    private fun handleRaw(frame: FrameData, fromIp: String) {
        if (frame.isOrdered && seqManager.isDuplicate(fromIp, frame.seqNum)) {
            Log.d(TAG, "Duplicate RAW from $fromIp seq=${frame.seqNum}")
            return
        }
        replyAckIfNeeded(frame, fromIp)
        onMessageListener?.invoke(frame, fromIp)
    }

    /**
     * 如果帧要求 ACK，则发送 ACK 回复（负载：[AckSeq: uint16][CurrentSeq: uint16] 共 4 字节）
     */
    private fun replyAckIfNeeded(frame: FrameData, fromIp: String) {
        if (frame.isAckRequired) {
            val ackPayload = ByteArray(UdpConfig.ACK_PAYLOAD_SIZE)
            // AckSeq (uint16 BE)
            ackPayload[0] = ((frame.seqNum shr 8) and 0xFF).toByte()
            ackPayload[1] = (frame.seqNum and 0xFF).toByte()
            // CurrentSeq (uint16 BE)，当前暂用 0 占位
            ackPayload[2] = 0
            ackPayload[3] = 0

            val ackFrame = FrameCodec.encode(
                type = UdpConfig.Type.ACK,
                seqNum = 0,
                flags = UdpConfig.Flags.NONE,
                payload = ackPayload,
            )
            socketManager.sendUnicast(ackFrame, fromIp)
        }
    }

    /**
     * 从 ACK payload 解析被确认的序号（uint16 AckSeq）
     */
    private fun parseAckSeq(payload: ByteArray): Int {
        if (payload.size < 2) return -1
        return ((payload[0].toInt() and 0xFF) shl 8) or
                (payload[1].toInt() and 0xFF)
    }

    /**
     * 解析设备信息 payload 中的 deviceName 和 abilities
     */
    private fun parseDeviceInfo(payload: ByteArray): DeviceInfo {
        return try {
            val json = org.json.JSONObject(String(payload, Charsets.UTF_8))
            val abilities = mutableListOf<String>()
            val arr = json.optJSONArray("abilities")
            if (arr != null) {
                for (i in 0 until arr.length()) {
                    abilities.add(arr.getString(i))
                }
            }
            DeviceInfo(
                deviceName = json.optString("deviceName", ""),
                abilities = abilities,
            )
        } catch (_: Exception) {
            DeviceInfo()
        }
    }

    private data class DeviceInfo(
        val deviceName: String = "",
        val abilities: List<String> = emptyList(),
    )
}
