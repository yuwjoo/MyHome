package com.yuwjoo.myhome.module.udp.listener

import com.yuwjoo.myhome.module.udp.client.FrameData

/**
 * 消息监听器
 */
fun interface MessageListener {
    /**
     * 收到有效帧时回调
     *
     * @param frame    解码后的帧数据
     * @param fromIp   发送方 IP
     * @param fromPort 发送方端口
     */
    fun onMessage(frame: FrameData, fromIp: String, fromPort: Int)
}
