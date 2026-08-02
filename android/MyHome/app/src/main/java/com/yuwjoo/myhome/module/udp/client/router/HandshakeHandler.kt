package com.yuwjoo.myhome.module.udp.client.router

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import com.yuwjoo.myhome.module.udp.client.config.NetConfig
import com.yuwjoo.myhome.module.udp.client.codec.FrameCodec
import com.yuwjoo.myhome.module.udp.client.codec.PayloadCodec
import com.yuwjoo.myhome.module.udp.client.device.DeviceRegistry
import com.yuwjoo.myhome.module.udp.client.device.SeqManager
import com.yuwjoo.myhome.module.udp.client.engine.HeartbeatEngine
import com.yuwjoo.myhome.module.udp.client.transport.UdpSocket

/**
 * 处理 CALL/ANSWER 帧：注册设备 + 初始化序号 + 回复
 */
internal class HandshakeHandler(
    private val deviceRegistry: DeviceRegistry,
    private val seqManager: SeqManager,
    private val udpSocket: UdpSocket,
    private val heartbeatEngine: HeartbeatEngine,
) {
    companion object {
        private const val TAG = "HandshakeHandler"
    }

    /**
     * 处理 CALL 帧：注册设备、初始化序号、回复 ANSWER
     *
     * @param payload CALL 帧负载（DeviceInfo 编码）
     * @param fromIp 发送方 IP
     */
    fun handleCall(payload: ByteArray, fromIp: String) {
        val device = PayloadCodec.parseDeviceInfo(payload)
        deviceRegistry.register(
            ip = fromIp,
            deviceName = device.deviceName,
            abilities = device.abilities,
            heartbeatInterval = device.heartbeatInterval,
            heartbeatTimeout = device.heartbeatTimeout,
        )
        heartbeatEngine.recordHeartbeat(fromIp)

        val hostId = NetConfig.hostId(fromIp)
        seqManager.initSendSeq(hostId, device.latestSeq)

        val myLatestSeq = seqManager.getRecvSeq(hostId)
        val answerPayload = PayloadCodec.buildLocalDevicePayload(myLatestSeq)
        val answerFrame = FrameCodec.encode(
            type = FrameConfig.Type.ANSWER,
            seqNum = 0,
            flags = FrameConfig.Flags.NONE,
            payload = answerPayload,
        )
        udpSocket.sendUnicast(answerFrame, fromIp)
        Log.d(TAG, "Responded ANSWER to $fromIp, latestSeq=$myLatestSeq")
    }

    /**
     * 处理 ANSWER 帧：注册设备、初始化序号
     *
     * @param payload ANSWER 帧负载（DeviceInfo 编码）
     * @param fromIp 发送方 IP
     */
    fun handleAnswer(payload: ByteArray, fromIp: String) {
        val device = PayloadCodec.parseDeviceInfo(payload)
        deviceRegistry.register(
            ip = fromIp,
            deviceName = device.deviceName,
            abilities = device.abilities,
            heartbeatInterval = device.heartbeatInterval,
            heartbeatTimeout = device.heartbeatTimeout,
        )
        heartbeatEngine.recordHeartbeat(fromIp)

        val hostId = NetConfig.hostId(fromIp)
        seqManager.initSendSeq(hostId, device.latestSeq)
        Log.d(TAG, "Answered device info from $fromIp, latestSeq=${device.latestSeq}")
    }
}
