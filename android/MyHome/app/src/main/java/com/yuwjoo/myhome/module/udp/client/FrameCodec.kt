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
 * [0-1]   MAGIC  (2 bytes, 0x59 0x48)
 * [2]     type    (1 byte)
 * [3-4]   seqNum  (2 bytes, uint16)
 * [5]     flags   (1 byte)
 * [6-7]   payLen  (2 bytes, uint16)
 * [8-9]   CRC16   (2 bytes, uint16)
 * [10..]  payload (payLen bytes)
 * ```
 * CRC 覆盖前 8 字节 + Payload（共 8+N 字节），不包含 CRC 自身。帧头固定 10 字节。
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
     * 编码帧
     */
    fun encode(type: Byte, seqNum: Int, flags: Byte, payload: ByteArray): ByteArray {
        val payLen = payload.size
        val totalLen = ClientConfig.HEADER_SIZE + payLen
        val raw = ByteArray(totalLen)

        val headerBuf = ByteArrayOutputStream()
        val out = DataOutputStream(headerBuf)
        out.writeShort(ClientConfig.MAGIC)           // Magic   [0-1]
        out.writeByte(type.toInt())                   // Type    [2]
        out.writeShort(seqNum)                        // SeqNum  [3-4]
        out.writeByte(flags.toInt())                  // Flags   [5]
        out.writeShort(payLen)                        // PayLen  [6-7]
        val headerBytes = headerBuf.toByteArray()     // 前 8 字节（不含 CRC）

        System.arraycopy(headerBytes, 0, raw, 0, 8)                        // 写入帧头前 8 字节
        System.arraycopy(payload, 0, raw, ClientConfig.HEADER_SIZE, payLen) // 写入 Payload [10..]

        val crcInput = ByteArray(8 + payLen) // CRC 校验范围 = 前 8 字节 + Payload
        System.arraycopy(headerBytes, 0, crcInput, 0, 8)
        System.arraycopy(payload, 0, crcInput, 8, payLen)
        val crc = crc16(crcInput)

        raw[8] = ((crc shr 8) and 0xFF).toByte()   // CRC16 高字节 [8]
        raw[9] = (crc and 0xFF).toByte()            // CRC16 低字节 [9]
        return raw
    }

    /**
     * 解码帧
     */
    fun decode(data: ByteArray, offset: Int = 0, length: Int = data.size - offset): FrameData? {
        if (length < ClientConfig.HEADER_SIZE) return null // 数据过短，连 10 字节帧头都不够

        val input = DataInputStream(ByteArrayInputStream(data, offset, length))

        val magic = input.readUnsignedShort()               // Magic     [0-1]
        if (magic != ClientConfig.MAGIC) return null          // 魔数不匹配，非本协议报文

        val type = input.readByte()                         // Type      [2]
        val seqNum = input.readUnsignedShort()              // SeqNum    [3-4]
        val flags = input.readByte()                        // Flags     [5]
        val payLen = input.readUnsignedShort()              // PayLen    [6-7]
        val expectedCrc = input.readUnsignedShort()         // CRC16     [8-9]

        if (length < ClientConfig.HEADER_SIZE + payLen) return null // PayLen 声明的长度超出实际数据，数据截断或损坏

        val payload = ByteArray(payLen)                       // Payload   [10..]
        if (payLen > 0) {
            input.readFully(payload)
        }

        // CRC 校验范围 = 前 8 字节 + Payload
        val crcInput = ByteArray(8 + payLen)
        System.arraycopy(data, offset, crcInput, 0, 8)
        if (payLen > 0) {
            System.arraycopy(data, offset + ClientConfig.HEADER_SIZE, crcInput, 8, payLen)
        }
        val computedCrc = crc16(crcInput)
        if (computedCrc != expectedCrc) return null           // CRC 校验失败，数据传输中发生比特错误或帧被篡改

        return FrameData(
            type = type,
            seqNum = seqNum,
            flags = flags,
            payload = payload,
        )
    }

    /** 便捷重载 */
    fun decode(data: ByteArray): FrameData? = decode(data, 0, data.size)
}

/**
 * 解码后的帧数据
 *
 * @property type    帧类型（见 [ClientConfig.Type]）
 * @property seqNum  消息序号
 * @property flags   标志位（见 [ClientConfig.Flags]）
 * @property payload 负载字节
 */
data class FrameData(
    val type: Byte,
    val seqNum: Int,
    val flags: Byte,
    val payload: ByteArray,
) {
    /** 是否有序消息 */
    val isOrdered: Boolean get() = (flags.toInt() and ClientConfig.Flags.ORDERED.toInt()) != 0
}
