package com.yuwjoo.myhome.module.peerudp.transport

import android.util.Log
import com.yuwjoo.myhome.module.peerudp.config.SocketConfig
import com.yuwjoo.myhome.module.peerudp.frame.FrameCodec
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import org.json.JSONArray
import org.json.JSONObject
import java.net.InetAddress

/**
 * UDP 发送者
 *
 * 封装 UDP 单播/组播/广播发送，并提供各类协议帧的发送方法。
 *
 * @param udpSocketFactory UdpSocket 工厂函数，每次需要发送时调用获取
 */
internal class Sender(
    private val udpSocketFactory: () -> UdpSocket,
) {
    companion object {
        private const val TAG = "Sender"
    }

    private val multicastInet: InetAddress by lazy { InetAddress.getByName(SocketConfig.MULTICAST_ADDRESS) } // 组播地址
    private val broadcastInet: InetAddress by lazy { InetAddress.getByName(SocketConfig.BROADCAST_ADDRESS) } // 广播地址

    /**
     * 发送心跳消息（广播，设备在线宣告）
     */
    fun sendHeartbeat() {
        val frame = FrameCodec.encode(FrameConfig.Type.HEARTBEAT, 0, FrameConfig.Flags.NONE, ByteArray(0))
        sendBroadcast(frame)
    }

    /**
     * 发送离线消息（广播，设备主动离网宣告）
     */
    fun sendOffline() {
        val frame = FrameCodec.encode(FrameConfig.Type.OFFLINE, 0, FrameConfig.Flags.NONE, ByteArray(0))
        sendBroadcast(frame)
    }

    /**
     * 发送呼叫消息（单播，向目标设备发起呼叫）
     *
     * @param targetIp          目标设备 IP
     * @param deviceName        本机设备名称
     * @param abilities         本机设备能力列表
     * @param latestSeq         本机最新接收序号
     * @param heartbeatInterval 心跳发送间隔（毫秒）
     * @param heartbeatTimeout  心跳超时阈值（毫秒）
     */
    fun sendCall(
        targetIp: String,
        deviceName: String,
        abilities: List<String>,
        latestSeq: Int,
        heartbeatInterval: Long,
        heartbeatTimeout: Long,
    ) {
        val frame = FrameCodec.encode(
            FrameConfig.Type.CALL, 0, FrameConfig.Flags.NONE,
            buildDevicePayload(deviceName, abilities, latestSeq, heartbeatInterval, heartbeatTimeout),
        )
        sendUnicast(frame, targetIp)
    }

    /**
     * 发送应答消息（单播，回应 Call）
     *
     * @param targetIp          目标设备 IP
     * @param deviceName        本机设备名称
     * @param abilities         本机设备能力列表
     * @param latestSeq         本机最新接收序号
     * @param heartbeatInterval 心跳发送间隔（毫秒）
     * @param heartbeatTimeout  心跳超时阈值（毫秒）
     */
    fun sendAnswer(
        targetIp: String,
        deviceName: String,
        abilities: List<String>,
        latestSeq: Int,
        heartbeatInterval: Long,
        heartbeatTimeout: Long,
    ) {
        val frame = FrameCodec.encode(
            FrameConfig.Type.ANSWER, 0, FrameConfig.Flags.NONE,
            buildDevicePayload(deviceName, abilities, latestSeq, heartbeatInterval, heartbeatTimeout),
        )
        sendUnicast(frame, targetIp)
    }

    /**
     * 发送确认应答消息（单播）
     *
     * @param targetIp    目标设备 IP
     * @param ackSeq      被确认的消息序号
     * @param currentSeq  当前接收序号
     */
    fun sendAck(targetIp: String, ackSeq: Int, currentSeq: Int) {
        val frame = FrameCodec.encode(FrameConfig.Type.ACK, 0, FrameConfig.Flags.NONE, buildAckPayload(ackSeq, currentSeq))
        sendUnicast(frame, targetIp)
    }

    /**
     * 发送 JSON 消息（封装为 JSON 协议帧后发送）
     *
     * @param data     JSON 字节数组
     * @param seqNum   消息序号，为 null 时标记为无序消息，非 null 时标记为有序消息（隐含需 Ack）
     * @param targetIp 目标 IP，为 null 时广播发送
     */
    fun sendJson(data: ByteArray, seqNum: Int? = null, targetIp: String? = null) {
        val flags = if (seqNum != null) FrameConfig.Flags.ORDERED else FrameConfig.Flags.NONE
        val frame = FrameCodec.encode(FrameConfig.Type.JSON, seqNum ?: 0, flags, data)
        if (targetIp != null) {
            sendUnicast(frame, targetIp)
        } else {
            sendBroadcast(frame)
        }
    }

    /**
     * 发送原始消息（封装为 RAW 协议帧后发送）
     *
     * @param data     待发送字节数组
     * @param seqNum   消息序号，为 null 时标记为无序消息，非 null 时标记为有序消息（隐含需 Ack）
     * @param targetIp 目标 IP，为 null 时广播发送
     */
    fun sendRaw(data: ByteArray, seqNum: Int? = null, targetIp: String? = null) {
        val flags = if (seqNum != null) FrameConfig.Flags.ORDERED else FrameConfig.Flags.NONE
        val frame = FrameCodec.encode(FrameConfig.Type.RAW, seqNum ?: 0, flags, data)
        if (targetIp != null) {
            sendUnicast(frame, targetIp)
        } else {
            sendBroadcast(frame)
        }
    }

    /**
     * 构建设备信息负载（CALL/ANSWER 帧使用）
     *
     * @param deviceName        本机设备名称
     * @param abilities         本机设备能力列表
     * @param latestSeq         本机最新接收序号
     * @param heartbeatInterval 心跳发送间隔（毫秒）
     * @param heartbeatTimeout  心跳超时阈值（毫秒）
     */
    private fun buildDevicePayload(
        deviceName: String,
        abilities: List<String>,
        latestSeq: Int,
        heartbeatInterval: Long,
        heartbeatTimeout: Long,
    ): ByteArray {
        val json = JSONObject().apply {
            put("deviceName", deviceName)
            put("abilities", JSONArray(abilities))
            put("latestSeq", latestSeq)
            put("heartbeatInterval", heartbeatInterval)
            put("heartbeatTimeout", heartbeatTimeout)
        }
        return json.toString().toByteArray(Charsets.UTF_8)
    }

    /**
     * 构建确认应答负载（4 字节：ackSeq + currentSeq，均 uint16 大端序）
     */
    private fun buildAckPayload(ackSeq: Int, currentSeq: Int): ByteArray {
        val payload = ByteArray(FrameConfig.ACK_PAYLOAD_SIZE)
        payload[0] = ((ackSeq shr 8) and 0xFF).toByte()
        payload[1] = (ackSeq and 0xFF).toByte()
        payload[2] = ((currentSeq shr 8) and 0xFF).toByte()
        payload[3] = (currentSeq and 0xFF).toByte()
        return payload
    }
    
    /**
     * 单播发送到指定 IP
     *
     * @param data     待发送字节数组
     * @param targetIp 目标 IP 地址
     * @return true 发送成功，false 发送失败
     */
    private fun sendUnicast(data: ByteArray, targetIp: String): Boolean {
        return try {
            udpSocketFactory().send(data, InetAddress.getByName(targetIp), SocketConfig.PORT)
        } catch (e: Exception) {
            Log.e(TAG, "sendUnicast to $targetIp error: ${e.message}")
            false
        }
    }

    /**
     * 组播发送到组播组
     *
     * @param data 待发送字节数组
     * @return true 发送成功，false 发送失败
     */
    private fun sendMulticast(data: ByteArray): Boolean {
        return try {
            udpSocketFactory().send(data, multicastInet, SocketConfig.PORT)
        } catch (e: Exception) {
            Log.e(TAG, "sendMulticast error: ${e.message}")
            false
        }
    }

    /**
     * 广播发送到子网
     *
     * @param data 待发送字节数组
     * @return true 发送成功，false 发送失败
     */
    private fun sendBroadcast(data: ByteArray): Boolean {
        return try {
            udpSocketFactory().send(data, broadcastInet, SocketConfig.PORT)
        } catch (e: Exception) {
            Log.e(TAG, "sendBroadcast error: ${e.message}")
            false
        }
    }
}
