package com.yuwjoo.myhome.module.udp.client.router

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.config.NetConfig
import com.yuwjoo.myhome.module.udp.client.codec.PayloadCodec
import com.yuwjoo.myhome.module.udp.client.engine.AckEngine

/**
 * 处理 ACK 帧：解析 payload + 通知 AckEngine
 */
internal class AckHandler(
    private val ackEngine: AckEngine,
) {
    companion object {
        private const val TAG = "AckHandler"
    }

    /**
     * 处理 ACK 帧，解析确认序号并通知 AckEngine
     *
     * @param payload ACK 帧负载（AckSeq + CurrentSeq）
     * @param fromIp 发送方 IP
     */
    fun handle(payload: ByteArray, fromIp: String) {
        val (ackSeq, currentSeq) = PayloadCodec.parseAckPayload(payload)
        val hostId = NetConfig.hostId(fromIp)
        ackEngine.onAck(hostId, ackSeq)
        Log.d(TAG, "Ack from $fromIp: ackSeq=$ackSeq currentSeq=$currentSeq")
    }
}
