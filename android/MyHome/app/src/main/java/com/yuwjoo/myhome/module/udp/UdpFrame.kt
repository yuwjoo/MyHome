package com.yuwjoo.myhome.module.udp

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream

/**
 * UDP 协议帧编解码及 CRC16 校验
 */
internal object UdpFrame {

    private val crcTable = IntArray(256) {
        var crc = it shl 8
        for (j in 0 until 8) {
            crc = if (crc and 0x8000 != 0) (crc shl 1) xor 0x1021 else crc shl 1
        }
        crc and 0xFFFF
    }

    /**
     * 计算 CRC16-CCITT
     *
     * @param data   数据
     * @param offset 起始偏移
     * @param len    校验长度
     */
    fun crc16(data: ByteArray, offset: Int = 0, len: Int = data.size): Int {
        var crc = 0xFFFF
        for (i in offset until offset + len) {
            val b = data[i].toInt() and 0xFF
            crc = ((crc shl 8) xor crcTable[((crc ushr 8) xor b) and 0xFF]) and 0xFFFF
        }
        return crc
    }

    /**
     * 编码帧
     *
     * @param type    消息类型
     * @param seqNum  消息序号
     * @param flags   标志位
     * @param payload 负载数据
     */
    fun encode(type: Byte, seqNum: Int, flags: Byte, payload: ByteArray): ByteArray {
        val payLen = payload.size
        val buf = ByteArrayOutputStream(HEADER_SIZE + payLen)
        val out = DataOutputStream(buf)

        out.writeShort(MAGIC)
        out.writeByte(VERSION.toInt())
        out.writeByte(type.toInt())
        out.writeShort(seqNum)
        out.writeByte(flags.toInt())
        out.writeShort(payLen)

        // CRC16 占位
        out.writeShort(0)
        out.write(payload)

        val raw = buf.toByteArray()
        val crc = crc16(raw, 0, 9 + payLen)
        raw[9] = ((crc shr 8) and 0xFF).toByte()
        raw[10] = (crc and 0xFF).toByte()

        return raw
    }

    /**
     * 解码帧
     *
     * @param data   原始数据
     * @param offset 起始偏移
     * @param length 数据长度
     * @return 解码后的帧数据，魔数或 CRC 不匹配时返回 null
     */
    fun decode(data: ByteArray, offset: Int, length: Int): FrameData? {
        if (length < HEADER_SIZE) return null

        val input = DataInputStream(ByteArrayInputStream(data, offset, length))

        val magic = input.readUnsignedShort()
        if (magic != MAGIC) return null

        val version = input.readByte()
        val type = input.readByte()
        val seqNum = input.readUnsignedShort()
        val flags = input.readByte()
        val payLen = input.readUnsignedShort()
        val crc = input.readUnsignedShort()

        if (length < HEADER_SIZE + payLen) return null

        val payload = ByteArray(payLen)
        input.readFully(payload)

        val computedCrc = crc16(data, offset, 9 + payLen)
        if (computedCrc != crc) return null

        return FrameData(
            version = version,
            type = type,
            seqNum = seqNum,
            flags = flags,
            payload = payload,
        )
    }

    private const val MAGIC = 0x5948
    private const val VERSION = 0x01.toByte()
    private const val HEADER_SIZE = 11
}

/**
 * 解码后的帧数据
 */
data class FrameData(
    val version: Byte, // 协议版本
    val type: Byte, // 消息类型，见 Type
    val seqNum: Int, // 消息序号
    val flags: Byte, // 标志位
    val payload: ByteArray, // 负载数据
) {
    val isAckRequired get() = (flags.toInt() and 0x01) != 0 // 是否需要回复 Ack
    val isOrdered get() = (flags.toInt() and 0x02) != 0 // 是否有序消息
}
