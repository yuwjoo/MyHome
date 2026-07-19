package com.yuwjoo.myhome.module.udp

import android.util.Log
import com.yuwjoo.myhome.module.udp.model.LanDevice
import com.yuwjoo.myhome.module.udp.model.LocalDevice
import com.yuwjoo.myhome.module.udp.model.TopicMessage
import org.json.JSONObject

/**
 * 消息分发器，按消息类型路由到对应处理器
 */
internal class MessageDispatcher(
    private val client: UdpClient,
    private val deviceManager: DeviceManager,
    private val topicManager: TopicManager,
    private val ackManager: AckManager,
    private val seqTracker: SeqTracker,
) {

    /**
     * 按消息类型分发处理
     *
     * @param frame  解码后的帧数据
     * @param fromIp 发送方 IP
     */
    fun dispatch(frame: FrameData, fromIp: String) {
        when (frame.type) {
            UdpConfig.Type.HEARTBEAT -> handleHeartbeat(fromIp)
            UdpConfig.Type.OFFLINE -> handleOffline(fromIp)
            UdpConfig.Type.CALL -> handleCall(fromIp, frame)
            UdpConfig.Type.ANSWER -> handleAnswer(fromIp, frame)
            UdpConfig.Type.ACK -> handleAck(fromIp, frame)
            UdpConfig.Type.JSON -> handleJson(fromIp, frame)
            UdpConfig.Type.RAW -> handleRaw(fromIp, frame)
        }
    }

    /**
     * 心跳
     *
     * @param fromIp 发送方 IP
     */
    private fun handleHeartbeat(fromIp: String) {
        Log.d(TAG, "收到心跳 $fromIp")
        if (deviceManager.hasDevice(fromIp)) {
            deviceManager.updateHeartbeatTime(fromIp)
        } else {
            val payload = LocalDevice.toObject(deviceManager.createLocalDevice())
            val payloadBytes = payload.toString().toByteArray(Charsets.UTF_8)
            val frame = UdpFrame.encode(
                type = UdpConfig.Type.CALL,
                seqNum = 0,
                flags = UdpConfig.Flags.NONE,
                payload = payloadBytes,
            )
            client.sendUnicast(frame, fromIp)
        }
    }

    /**
     * 离线
     *
     * @param fromIp 发送方 IP
     */
    private fun handleOffline(fromIp: String) {
        deviceManager.updateOnlineStatus(fromIp, false)
    }

    /**
     * Call：B 单播 Call 给新发现的 A，负载含 B 的设备信息
     *
     * @param fromIp 发送方 IP
     * @param frame  解码后的帧数据
     */
    private fun handleCall(fromIp: String, frame: FrameData) {
        val json = parsePayloadJson(frame.payload) ?: return
        val device = LanDevice.from(fromIp, json) ?: return
        deviceManager.saveDevice(device)

        val localPayload = LocalDevice.toObject(deviceManager.createLocalDevice())
        val payloadBytes = localPayload.toString().toByteArray(Charsets.UTF_8)
        val answer = UdpFrame.encode(
            type = UdpConfig.Type.ANSWER,
            seqNum = 0,
            flags = UdpConfig.Flags.NONE,
            payload = payloadBytes,
        )
        client.sendUnicast(answer, fromIp)
    }

    /**
     * Answer：A 收到 Answer，记录 B 的设备信息
     *
     * @param fromIp 发送方 IP
     * @param frame  解码后的帧数据
     */
    private fun handleAnswer(fromIp: String, frame: FrameData) {
        val json = parsePayloadJson(frame.payload) ?: return
        val device = LanDevice.from(fromIp, json) ?: return
        deviceManager.saveDevice(device)
    }

    /**
     * Ack：同步对方 seq，交给 AckManager 移除对应条目
     *
     * @param fromIp 发送方 IP
     * @param frame  解码后的帧数据
     */
    private fun handleAck(fromIp: String, frame: FrameData) {
        if (frame.payload.size < UdpConfig.ACK_PAYLOAD_SIZE) return
        val ackSeq = ((frame.payload[0].toInt() and 0xFF) shl 8) or (frame.payload[1].toInt() and 0xFF) // 被确认的 seqNum
        val currentSeq = ((frame.payload[2].toInt() and 0xFF) shl 8) or (frame.payload[3].toInt() and 0xFF) // 对方当前 seqNum
        seqTracker.initFromPeer(fromIp, currentSeq)
        ackManager.onAck(fromIp, ackSeq)
    }

    /**
     * Json：校验有序性，Reply Ack，分发给 TopicManager
     *
     * @param fromIp 发送方 IP
     * @param frame  解码后的帧数据
     */
    private fun handleJson(fromIp: String, frame: FrameData) {
        if (!checkOrdered(fromIp, frame)) return
        replyAckIfNeeded(fromIp, frame)

        val json = parsePayloadJson(frame.payload) ?: return
        val msg = TopicMessage.from(json) ?: return
        topicManager.notifyListener(msg.topic, msg.payload)
    }

    /**
     * Raw：校验有序性，Reply Ack，分发给 Raw 监听器
     *
     * @param fromIp 发送方 IP
     * @param frame  解码后的帧数据
     */
    private fun handleRaw(fromIp: String, frame: FrameData) {
        if (!checkOrdered(fromIp, frame)) return
        replyAckIfNeeded(fromIp, frame)
        // TODO: 分发给 Raw 消息监听器
    }

    /**
     * 检查有序消息，返回 true 表示可以消费
     *
     * @param fromIp 发送方 IP
     * @param frame  解码后的帧数据
     */
    private fun checkOrdered(fromIp: String, frame: FrameData): Boolean {
        if (!frame.isOrdered) return true
        return seqTracker.check(fromIp, frame.seqNum) == SeqResult.CONSUMED
    }

    /**
     * 需要 Ack 时回复确认包
     *
     * @param fromIp 发送方 IP
     * @param frame  解码后的帧数据
     */
    private fun replyAckIfNeeded(fromIp: String, frame: FrameData) {
        if (!frame.isAckRequired) return
        val ackPayload = ByteArray(UdpConfig.ACK_PAYLOAD_SIZE)
        ackPayload[0] = ((frame.seqNum shr 8) and 0xFF).toByte()
        ackPayload[1] = (frame.seqNum and 0xFF).toByte()
        val current = seqTracker.currentSeq(fromIp)
        ackPayload[2] = ((current shr 8) and 0xFF).toByte()
        ackPayload[3] = (current and 0xFF).toByte()
        val ack = UdpFrame.encode(
            type = UdpConfig.Type.ACK,
            seqNum = 0,
            flags = UdpConfig.Flags.NONE,
            payload = ackPayload,
        )
        client.sendUnicast(ack, fromIp)
    }

    /**
     * 将 payload 字节解析为 JSONObject
     *
     * @param payload 负载字节
     */
    private fun parsePayloadJson(payload: ByteArray): JSONObject? {
        return try {
            JSONObject(String(payload, Charsets.UTF_8))
        } catch (_: Exception) {
            null
        }
    }

    private companion object {
        private const val TAG = "MessageDispatcher"
    }
}
