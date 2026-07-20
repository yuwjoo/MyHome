package com.yuwjoo.myhome.module.udp.client

import android.util.Log

/**
 * 消息路由：按帧类型分发到不同处理器
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
     * 分发帧到对应处理器
     */
    fun dispatch(frame: FrameData, fromIp: String) {
        when (frame.type) {
            ClientConfig.Type.HEARTBEAT -> handleHeartbeat(frame, fromIp)
            ClientConfig.Type.OFFLINE   -> handleOffline(frame, fromIp)
            ClientConfig.Type.CALL      -> handleCall(frame, fromIp)
            ClientConfig.Type.ANSWER    -> handleAnswer(frame, fromIp)
            ClientConfig.Type.ACK       -> handleAck(frame, fromIp)
            ClientConfig.Type.JSON      -> handleJson(frame, fromIp)
            ClientConfig.Type.RAW       -> handleRaw(frame, fromIp)
            else                        -> Log.w(TAG, "Unknown frame type: ${frame.type}")
        }
    }

    /**
     * 处理心跳帧：标记在线，设备处于离线（或无记录）时发起 Call 重新握手
     */
    private fun handleHeartbeat(frame: FrameData, fromIp: String) {
        val existing = deviceRegistry.get(fromIp)
        val isOffline = existing == null || !existing.online

        if (isOffline) {
            val hostId = ClientConfig.hostId(fromIp)
            val latestSeq = seqManager.getRecvSeq(hostId)
            val payload = buildLocalDevicePayload(latestSeq)
            val callFrame = FrameCodec.encode(
                type = ClientConfig.Type.CALL,
                seqNum = 0,
                flags = ClientConfig.Flags.NONE,
                payload = payload,
            )
            socketManager.sendUnicast(callFrame, fromIp)
            Log.d(TAG, "Sent CALL to device: $fromIp")
        }
    }

    /**
     * 处理离线帧
     */
    private fun handleOffline(frame: FrameData, fromIp: String) {
        deviceRegistry.markOffline(fromIp)
        Log.d(TAG, "Device offline: $fromIp")
    }

    /**
     * 处理 Call 帧：注册设备、初始化序号、回复 Answer
     */
    private fun handleCall(frame: FrameData, fromIp: String) {
        val device = parseDeviceInfo(frame.payload)
        deviceRegistry.register(
            ip = fromIp,
            deviceName = device.deviceName,
            abilities = device.abilities,
            heartbeatInterval = device.heartbeatInterval,
            heartbeatTimeout = device.heartbeatTimeout,
        )

        val hostId = ClientConfig.hostId(fromIp)
        seqManager.initSendSeq(hostId, device.latestSeq)

        val myLatestSeq = seqManager.getRecvSeq(hostId)
        val payload = buildLocalDevicePayload(myLatestSeq)
        val answerFrame = FrameCodec.encode(
            type = ClientConfig.Type.ANSWER,
            seqNum = 0,
            flags = ClientConfig.Flags.NONE,
            payload = payload,
        )
        socketManager.sendUnicast(answerFrame, fromIp)
        Log.d(TAG, "Responded ANSWER to $fromIp, latestSeq=$myLatestSeq")
    }

    /**
     * 处理 Answer 帧：注册设备、初始化序号
     */
    private fun handleAnswer(frame: FrameData, fromIp: String) {
        val device = parseDeviceInfo(frame.payload)
        deviceRegistry.register(
            ip = fromIp,
            deviceName = device.deviceName,
            abilities = device.abilities,
            heartbeatInterval = device.heartbeatInterval,
            heartbeatTimeout = device.heartbeatTimeout,
        )

        val hostId = ClientConfig.hostId(fromIp)
        seqManager.initSendSeq(hostId, device.latestSeq)
        Log.d(TAG, "Answered device info from $fromIp, latestSeq=${device.latestSeq}")
    }

    /**
     * 处理 Ack 帧：通知 AckEngine + 同步序号
     */
    private fun handleAck(frame: FrameData, fromIp: String) {
        val (ackSeq, currentSeq) = parseAckPayload(frame.payload)
        val hostId = ClientConfig.hostId(fromIp)

        ackEngine.onAck(hostId, ackSeq)
        Log.d(TAG, "Ack from $fromIp: ackSeq=$ackSeq currentSeq=$currentSeq")
    }

    /**
     * 处理 JSON 帧
     */
    private fun handleJson(frame: FrameData, fromIp: String) {
        if (frame.isOrdered) {
            handleOrderedMessage(frame, fromIp)
        } else {
            onMessageListener?.invoke(frame, fromIp)
        }
    }

    /**
     * 处理 Raw 帧
     */
    private fun handleRaw(frame: FrameData, fromIp: String) {
        if (frame.isOrdered) {
            handleOrderedMessage(frame, fromIp)
        } else {
            onMessageListener?.invoke(frame, fromIp)
        }
    }

    /**
     * 处理有序消息：三路序号校验
     */
    private fun handleOrderedMessage(frame: FrameData, fromIp: String) {
        val hostId = ClientConfig.hostId(fromIp)
        when (seqManager.tryConsume(hostId, frame.seqNum)) {
            SeqManager.Result.ACCEPTED -> {
                onMessageListener?.invoke(frame, fromIp)
                replyAck(frame, fromIp)
            }
            SeqManager.Result.DISCARD_BUT_ACK -> {
                Log.d(TAG, "Duplicate ordered msg from $fromIp seq=${frame.seqNum}")
                replyAck(frame, fromIp)
            }
            SeqManager.Result.DISCARD_NO_ACK -> {
                Log.d(TAG, "Out-of-order msg from $fromIp seq=${frame.seqNum}, ignored")
            }
        }
    }

    /**
     * 回复 Ack（4 字节负载：AckSeq + CurrentSeq）
     */
    private fun replyAck(frame: FrameData, fromIp: String) {
        val hostId = ClientConfig.hostId(fromIp)
        val currentSeq = seqManager.getRecvSeq(hostId)
        val ackPayload = ByteArray(ClientConfig.ACK_PAYLOAD_SIZE)

        // AckSeq (uint16 BE) - 被确认的消息序号
        ackPayload[0] = ((frame.seqNum shr 8) and 0xFF).toByte()
        ackPayload[1] = (frame.seqNum and 0xFF).toByte()
        // CurrentSeq (uint16 BE) - 接收方处理后的最新有序序号
        ackPayload[2] = ((currentSeq shr 8) and 0xFF).toByte()
        ackPayload[3] = (currentSeq and 0xFF).toByte()

        val ackFrame = FrameCodec.encode(
            type = ClientConfig.Type.ACK,
            seqNum = 0,
            flags = ClientConfig.Flags.NONE,
            payload = ackPayload,
        )
        socketManager.sendUnicast(ackFrame, fromIp)
    }

    /**
     * 从 Ack payload 解析 AckSeq 和 CurrentSeq
     */
    private fun parseAckPayload(payload: ByteArray): Pair<Int, Int> {
        if (payload.size < 4) return Pair(0, 0)
        val ackSeq = ((payload[0].toInt() and 0xFF) shl 8) or (payload[1].toInt() and 0xFF)
        val currentSeq = ((payload[2].toInt() and 0xFF) shl 8) or (payload[3].toInt() and 0xFF)
        return Pair(ackSeq, currentSeq)
    }

    /**
     * 解析设备信息
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
                latestSeq = json.optInt("latestSeq", 0),
                heartbeatInterval = json.optLong("heartbeatInterval", 0L),
                heartbeatTimeout = json.optLong("heartbeatTimeout", 0L),
            )
        } catch (_: Exception) {
            DeviceInfo()
        }
    }

    /**
     * 从 Call/Answer 帧 payload 解析出的远端设备信息
     */
    private data class DeviceInfo(
        val deviceName: String = "", // 设备名称
        val abilities: List<String> = emptyList(), // 能力列表
        val latestSeq: Int = 0, // 该设备记录的本机最新有序序号
        val heartbeatInterval: Long = 0L, // 该设备宣告的心跳间隔
        val heartbeatTimeout: Long = 0L, // 该设备宣告的心跳过期时间
    )
}
