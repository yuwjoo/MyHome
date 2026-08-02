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
 * 处理 HEARTBEAT 帧：记录心跳 + 未知设备触发握手
 */
internal class HeartbeatHandler(
    private val deviceRegistry: DeviceRegistry,
    private val heartbeatEngine: HeartbeatEngine,
    private val seqManager: SeqManager,
    private val udpSocket: UdpSocket,
) {
    companion object {
        private const val TAG = "HeartbeatHandler"
    }

    /**
     * 处理心跳帧，已知设备记录心跳，未知设备触发握手
     *
     * @param fromIp 发送方 IP
     */
    fun handle(fromIp: String) {
        val existing = deviceRegistry.get(fromIp)
        val isOffline = existing == null || !existing.online

        if (isOffline) {
            val hostId = NetConfig.hostId(fromIp)
            val latestSeq = seqManager.getRecvSeq(hostId)
            val payload = PayloadCodec.buildLocalDevicePayload(latestSeq)
            val callFrame = FrameCodec.encode(
                type = FrameConfig.Type.CALL,
                seqNum = 0,
                flags = FrameConfig.Flags.NONE,
                payload = payload,
            )
            udpSocket.sendUnicast(callFrame, fromIp)
            Log.d(TAG, "Sent CALL to device: $fromIp")
        } else {
            heartbeatEngine.recordHeartbeat(fromIp)
            deviceRegistry.markOnline(fromIp)
        }
    }
}
