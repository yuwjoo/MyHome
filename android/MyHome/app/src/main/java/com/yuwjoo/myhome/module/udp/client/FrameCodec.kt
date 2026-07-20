package com.yuwjoo.myhome.module.udp.client

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream

/**
 * 帧编解码 + CRC16-CCITT 校验
 *
 * 帧布局（大端序）：
 * ```
 * [0-1]   MAGIC (2 bytes, 0x59 0x48)
 * [2]     version  (1 byte)
 * [3]     type     (1 byte)
 * [4-5]   seqNum   (2 bytes, uint16)
 * [6]     flags    (1 byte)
 * [7-8]   payLen   (2 bytes, uint16)
 * [9..]   payload  (payLen bytes)
 * [..]    CRC16    (2 bytes, 帧尾)
 * ```
 * CRC 覆盖 MAGIC～payLen（9 字节）+ payload。帧头固定 11 字节（含 CRC），完整帧长 = 11 + payLen。
 */
internal object FrameCodec {

    private val crcTable = IntArray(256) { i -> // CRC16-CCITT 查找表
        var crc = i shl 8
        repeat(8) {
            crc = if (crc and 0x8000 != 0) (crc shl 1) xor 0x1021 else crc shl 1
        }
        crc and 0xFFFF
    }

    /**
     * 计算 CRC16-CCITT
     *
     * @param data   数据
     * @param offset 起始偏移
     * @param length 校验长度（字节数）
     * @return 16 位 CRC 值
     */
    fun crc16(data: ByteArray, offset: Int = 0, length: Int = data.size - offset): Int {
        var crc = 0xFFFF
        val end = offset + length
        for (i in offset until end) {
            val b = data[i].toInt() and 0xFF
            crc = ((crc shl 8) xor crcTable[((crc ushr 8) xor b) and 0xFF]) and 0xFFFF
        }
        return crc
    }

    /**
     * 编码帧（含 CRC）
     *
     * @param type    消息类型
     * @param seqNum  消息序号
     * @param flags   标志位
     * @param payload 负载数据
     * @return 完整帧字节数组
     */
    fun encode(type: Byte, seqNum: Int, flags: Byte, payload: ByteArray): ByteArray {
        val payLen = payload.size
        val totalLen = UdpConfig.HEADER_SIZE + payLen + UdpConfig.CRC_SIZE
        val buf = ByteArrayOutputStream(totalLen)
        val out = DataOutputStream(buf)

        out.writeShort(UdpConfig.MAGIC)           // [0-1] MAGIC
        out.writeByte(UdpConfig.VERSION.toInt())   // [2]   version
        out.writeByte(type.toInt())                // [3]   type
        out.writeShort(seqNum)                     // [4-5] seqNum
        out.writeByte(flags.toInt())               // [6]   flags
        out.writeShort(payLen)                     // [7-8] payLen

        out.write(payload)
        out.writeShort(0) // CRC 占位

        val raw = buf.toByteArray()
        val crc = crc16(raw, 0, UdpConfig.HEADER_SIZE + payLen)

        val crcOffset = UdpConfig.HEADER_SIZE + payLen
        raw[crcOffset] = ((crc shr 8) and 0xFF).toByte()
        raw[crcOffset + 1] = (crc and 0xFF).toByte()

        return raw
    }

    /**
     * 解码帧
     *
     * @param data   原始字节
     * @param offset 起始偏移
     * @param length 有效数据长度
     * @return 解码后的帧，魔数或 CRC 不匹配时返回 null
     */
    fun decode(data: ByteArray, offset: Int = 0, length: Int = data.size - offset): FrameData? {
        if (length < UdpConfig.HEADER_SIZE + UdpConfig.CRC_SIZE) return null

        val input = DataInputStream(ByteArrayInputStream(data, offset, length))

        val magic = input.readUnsignedShort()
        if (magic != UdpConfig.MAGIC) return null

        val version = input.readByte()
        val type = input.readByte()
        val seqNum = input.readUnsignedShort()
        val flags = input.readByte()
        val payLen = input.readUnsignedShort()

        if (length < UdpConfig.HEADER_SIZE + payLen + UdpConfig.CRC_SIZE) return null

        val payload = ByteArray(payLen)
        if (payLen > 0) {
            input.readFully(payload)
        }

        val expectedCrc = input.readUnsignedShort()
        val computedCrc = crc16(data, offset, UdpConfig.HEADER_SIZE + payLen)

        if (computedCrc != expectedCrc) return null

        return FrameData(
            version = version,
            type = type,
            seqNum = seqNum,
            flags = flags,
            payload = payload,
        )
    }

    /** 便捷重载：从完整字节数组解码 */
    fun decode(data: ByteArray): FrameData? = decode(data, 0, data.size)
}

/**
 * 解码后的帧数据
 *
 * @property version     协议版本
 * @property type        帧类型（见 [UdpConfig.Type]）
 * @property seqNum      消息序号
 * @property flags       标志位（见 [UdpConfig.Flags]）
 * @property payload     负载字节
 */
data class FrameData(
    val version: Byte,
    val type: Byte,
    val seqNum: Int,
    val flags: Byte,
    val payload: ByteArray,
) {
    /** 是否需要回复 ACK */
    val isAckRequired: Boolean get() = (flags.toInt() and UdpConfig.Flags.NEED_ACK.toInt()) != 0

    /** 是否有序消息（需要去重） */
    val isOrdered: Boolean get() = (flags.toInt() and UdpConfig.Flags.ORDERED.toInt()) != 0
}
