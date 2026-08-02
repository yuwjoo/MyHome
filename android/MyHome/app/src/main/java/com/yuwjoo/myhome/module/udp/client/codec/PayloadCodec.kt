package com.yuwjoo.myhome.module.udp.client.codec

import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import com.yuwjoo.myhome.module.udp.client.config.LocalConfig
import com.yuwjoo.myhome.module.udp.client.model.DeviceInfo
import org.json.JSONArray
import org.json.JSONObject

/**
 * Payload 序列化/反序列化：DeviceInfo JSON + ACK payload
 */
internal object PayloadCodec {

    /**
     * 生成本机设备信息的 JSON payload（用于 CALL/ANSWER 帧）
     *
     * @param latestSeq 本机对目标主机记录的最新有序序号
     */
    fun buildLocalDevicePayload(latestSeq: Int = 0): ByteArray {
        val json = JSONObject().apply {
            put("deviceName", LocalConfig.DEVICE_NAME)
            put("abilities", JSONArray(LocalConfig.DEVICE_ABILITIES))
            put("latestSeq", latestSeq)
            put("heartbeatInterval", LocalConfig.HEARTBEAT_INTERVAL_MS)
            put("heartbeatTimeout", LocalConfig.HEARTBEAT_TIMEOUT_MS)
        }
        return json.toString().toByteArray(Charsets.UTF_8)
    }

    /**
     * 从字节数组解析设备信息
     *
     * @param payload 设备信息 JSON 编码的字节数组
     * @return 解析后的 DeviceInfo，解析失败返回默认值
     */
    fun parseDeviceInfo(payload: ByteArray): DeviceInfo {
        return try {
            val json = JSONObject(String(payload, Charsets.UTF_8))
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
     * 构建 ACK payload（4 字节：AckSeq uint16 + CurrentSeq uint16，大端序）
     *
     * @param ackSeq 确认的序号
     * @param currentSeq 当前接收序号
     * @return 4 字节 ACK 负载
     */
    fun buildAckPayload(ackSeq: Int, currentSeq: Int): ByteArray {
        val payload = ByteArray(FrameConfig.ACK_PAYLOAD_SIZE)
        payload[0] = ((ackSeq shr 8) and 0xFF).toByte()
        payload[1] = (ackSeq and 0xFF).toByte()
        payload[2] = ((currentSeq shr 8) and 0xFF).toByte()
        payload[3] = (currentSeq and 0xFF).toByte()
        return payload
    }

    /**
     * 解析 ACK payload
     *
     * @param payload 4 字节 ACK 负载
     * @return (ackSeq, currentSeq) 序号对
     */
    fun parseAckPayload(payload: ByteArray): Pair<Int, Int> {
        if (payload.size < 4) return Pair(0, 0)
        val ackSeq = ((payload[0].toInt() and 0xFF) shl 8) or (payload[1].toInt() and 0xFF)
        val currentSeq = ((payload[2].toInt() and 0xFF) shl 8) or (payload[3].toInt() and 0xFF)
        return Pair(ackSeq, currentSeq)
    }
}
