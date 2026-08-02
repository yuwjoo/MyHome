package com.yuwjoo.myhome.module.udp.client.router

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import com.yuwjoo.myhome.module.udp.client.config.NetConfig
import com.yuwjoo.myhome.module.udp.client.codec.FrameCodec
import com.yuwjoo.myhome.module.udp.client.codec.PayloadCodec
import com.yuwjoo.myhome.module.udp.client.device.SeqManager
import com.yuwjoo.myhome.module.udp.client.model.FrameData
import com.yuwjoo.myhome.module.udp.client.transport.UdpSocket

/**
 * 处理消息帧：有序帧做序号校验 + 回复 ACK，无序帧直接回调
 */
internal class OrderedMsgHandler(
    private val seqManager: SeqManager,
    private val udpSocket: UdpSocket,
) {
    companion object {
        private const val TAG = "OrderedMsgHandler"
    }

    /** 消息回调（序号校验通过或无序帧 → 通知上层，isJson 标识是否为 JSON 帧） */
    var onMessageListener: ((frame: FrameData, fromIp: String, isJson: Boolean) -> Unit)? = null

    /**
     * 处理消息帧：有序帧做序号校验，无序帧直接回调
     *
     * @param frame 消息帧
     * @param fromIp 发送方 IP
     * @param isJson 是否为 JSON 帧
     */
    fun handle(frame: FrameData, fromIp: String, isJson: Boolean) {
        if (!frame.isOrdered) {
            onMessageListener?.invoke(frame, fromIp, isJson)
            return
        }
        val hostId = NetConfig.hostId(fromIp)
        when (seqManager.tryConsume(hostId, frame.seqNum)) {
            SeqManager.Result.ACCEPTED -> {
                onMessageListener?.invoke(frame, fromIp, isJson)
                replyAck(frame, fromIp, seqManager.getRecvSeq(hostId))
            }
            SeqManager.Result.DISCARD_BUT_ACK -> {
                Log.d(TAG, "Duplicate ordered msg from $fromIp seq=${frame.seqNum}")
                replyAck(frame, fromIp, seqManager.getRecvSeq(hostId))
            }
            SeqManager.Result.DISCARD_NO_ACK -> {
                Log.d(TAG, "Out-of-order msg from $fromIp seq=${frame.seqNum}, ignored")
            }
        }
    }

    /**
     * 回复 ACK 帧（4 字节负载：AckSeq + CurrentSeq，大端序）
     *
     * @param frame 原始消息帧
     * @param fromIp 发送方 IP
     * @param currentSeq 当前接收序号
     */
    private fun replyAck(frame: FrameData, fromIp: String, currentSeq: Int) {
        val ackPayload = PayloadCodec.buildAckPayload(frame.seqNum, currentSeq)
        val ackFrame = FrameCodec.encode(
            type = FrameConfig.Type.ACK,
            seqNum = 0,
            flags = FrameConfig.Flags.NONE,
            payload = ackPayload,
        )
        udpSocket.sendUnicast(ackFrame, fromIp)
    }
}
