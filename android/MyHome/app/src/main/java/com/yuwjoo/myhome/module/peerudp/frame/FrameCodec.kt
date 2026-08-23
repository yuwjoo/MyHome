package com.yuwjoo.myhome.module.peerudp.frame

import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
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
     * 计算 CRC16-CCITT 校验值
     *
     * @param data 待校验数据
     * @param offset 起始偏移
     * @param length 校验长度
     * @return CRC16 校验值
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
     * 编码 FrameData 为字节数组
     *
     * @param data 帧数据
     * @return 编码后的完整帧字节数组
     */
    fun encode(data: FrameData): ByteArray = encode(data.type, data.seqNum, data.flags, data.payload)

    /**
     * 编码帧数据为字节数组
     *
     * @param type 帧类型
     * @param seqNum 序号（uint16，取值 0-65535，超出会被截断为 16 位，调用方需自行回绕）
     * @param flags 标志位
     * @param payload 帧负载
     * @return 编码后的完整帧字节数组
     */
    fun encode(type: Byte, seqNum: Int, flags: FrameDataFlags, payload: ByteArray): ByteArray {
        val payLen = payload.size
        val totalLen = FrameConfig.HEADER_SIZE + payLen
        val raw = ByteArray(totalLen)

        val headerBuf = ByteArrayOutputStream()
        val out = DataOutputStream(headerBuf)
        out.writeShort(FrameConfig.MAGIC)           // Magic   [0-1]
        out.writeByte(type.toInt())                   // Type    [2]
        out.writeShort(seqNum)                        // SeqNum  [3-4]
        out.writeByte(flags.toByte().toInt())               // Flags   [5]
        out.writeShort(payLen)                        // PayLen  [6-7]
        val headerBytes = headerBuf.toByteArray()     // 前 8 字节（不含 CRC）

        System.arraycopy(headerBytes, 0, raw, 0, 8)                        // 写入帧头前 8 字节
        System.arraycopy(payload, 0, raw, FrameConfig.HEADER_SIZE, payLen) // 写入 Payload [10..]

        val crcInput = ByteArray(8 + payLen) // CRC 校验范围 = 前 8 字节 + Payload
        System.arraycopy(headerBytes, 0, crcInput, 0, 8)
        System.arraycopy(payload, 0, crcInput, 8, payLen)
        val crc = crc16(crcInput)

        raw[8] = ((crc shr 8) and 0xFF).toByte()   // CRC16 高字节 [8]
        raw[9] = (crc and 0xFF).toByte()            // CRC16 低字节 [9]
        return raw
    }

    /**
     * 解码帧数据
     *
     * @param data 原始字节数据
     * @param offset 起始偏移
     * @param length 数据长度
     * @return 解码后的 FrameData，校验失败或数据非法返回 null
     */
    fun decode(data: ByteArray, offset: Int = 0, length: Int = data.size - offset): FrameData? {
        return try {
            if (length < FrameConfig.HEADER_SIZE) null // 数据过短，连 10 字节帧头都不够
            else {
                val input = DataInputStream(ByteArrayInputStream(data, offset, length))

                val magic = input.readUnsignedShort()               // Magic     [0-1]
                if (magic != FrameConfig.MAGIC) return null          // 魔数不匹配，非本协议报文

                val type = input.readByte()                         // Type      [2]
                val seqNum = input.readUnsignedShort()              // SeqNum    [3-4]
                val flags = FrameDataFlags.fromByte(input.readByte())  // Flags  [5]
                val payLen = input.readUnsignedShort()              // PayLen    [6-7]
                val expectedCrc = input.readUnsignedShort()         // CRC16     [8-9]

                if (length < FrameConfig.HEADER_SIZE + payLen) return null // PayLen 声明的长度超出实际数据，数据截断或损坏

                val payload = ByteArray(payLen)                       // Payload   [10..]
                if (payLen > 0) {
                    input.readFully(payload)
                }

                // CRC 校验范围 = 前 8 字节 + Payload
                val crcInput = ByteArray(8 + payLen)
                System.arraycopy(data, offset, crcInput, 0, 8)
                if (payLen > 0) {
                    System.arraycopy(data, offset + FrameConfig.HEADER_SIZE, crcInput, 8, payLen)
                }
                val computedCrc = crc16(crcInput)
                if (computedCrc != expectedCrc) null                 // CRC 校验失败，数据传输中发生比特错误或帧被篡改
                else {
                    FrameData(
                        type = type,
                        seqNum = seqNum,
                        flags = flags,
                        payload = payload,
                    )
                }
            }
        } catch (_: Exception) {
            null // 任意解析异常（越界、截断、非法参数等）均视为无效帧
        }
    }
}
