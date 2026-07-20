package com.yuwjoo.myhome.module.udp.client

/**
 * 数据包快速预校验（魔数 + CRC16 + 帧长），在解码前过滤无效帧
 */
internal object PacketValidator {

    /**
     * 校验原始 UDP 数据是否可能是有效帧
     *
     * @param data   原始字节数组
     * @param offset 起始偏移
     * @param length 有效数据长度
     * @return 是否通过预校验
     */
    fun validate(data: ByteArray, offset: Int = 0, length: Int = data.size): Boolean {
        // 最少包长校验
        if (length < UdpConfig.HEADER_SIZE) return false

        // 魔数校验
        val magic = ((data[offset].toInt() and 0xFF) shl 8) or (data[offset + 1].toInt() and 0xFF)
        if (magic != UdpConfig.MAGIC) return false

        // payload 长度校验（PayLen 位于字节 7-8）
        val payLen = ((data[offset + 7].toInt() and 0xFF) shl 8) or (data[offset + 8].toInt() and 0xFF)
        if (length < UdpConfig.HEADER_SIZE + payLen + UdpConfig.CRC_SIZE) return false

        // CRC16 校验
        val computedCrc = FrameCodec.crc16(data, offset, UdpConfig.HEADER_SIZE + payLen)
        val crcOffset = offset + UdpConfig.HEADER_SIZE + payLen
        val expectedCrc = ((data[crcOffset].toInt() and 0xFF) shl 8) or (data[crcOffset + 1].toInt() and 0xFF)

        return computedCrc == expectedCrc
    }
}
