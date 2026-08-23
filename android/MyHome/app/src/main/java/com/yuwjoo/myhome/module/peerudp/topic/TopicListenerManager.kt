package com.yuwjoo.myhome.module.peerudp.topic

import android.util.Log
import com.yuwjoo.myhome.module.peerudp.device.LanDeviceManager
import com.yuwjoo.myhome.module.peerudp.frame.AckPayload
import com.yuwjoo.myhome.module.peerudp.frame.FrameData
import com.yuwjoo.myhome.module.peerudp.frame.toBytes
import com.yuwjoo.myhome.module.peerudp.transport.Transport
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import org.json.JSONObject

/**
 * 主题监听管理器：仅负责主题监听器的注册、取消注册与消息分发（帧监听由 PeerUdp 统一注册并路由到本类处理入口）
 *
 * @param transport      底层传输器（用于回复 Ack）
 * @param deviceManager  设备管理器（获取接收方下一个期望接收序号）
 */
internal class TopicListenerManager(
    private val transport: Transport, // udp传输器
    private val deviceManager: LanDeviceManager, // 设备管理器（获取接收方下一个期望接收序号）
) {

    companion object {
        private const val TAG = "TopicListenerManager"
    }

    private val listeners = HashMap<String, MutableList<(topic: String, payload: JSONObject?) -> Unit>>() // 主题消息监听器集合

    /**
     * 注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 消息到达时的回调
     */
    fun registerListener(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        listeners.getOrPut(topic) { mutableListOf() }.add(callback)
    }

    /**
     * 取消注册主题监听器
     *
     * @param topic    主题名称
     * @param callback 待移除的回调
     */
    fun unregisterListener(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        val list = listeners[topic] ?: return
        list.remove(callback)
        if (list.isEmpty()) listeners.remove(topic)
    }

    /**
     * 处理收到的 JSON 帧：解析并分发给对应主题的监听器
     *
     * @param frame  收到的帧数据
     * @param fromIp 来源 IP
     */
    fun handleJsonFrame(frame: FrameData, fromIp: String) {
        // 有序消息需回复 Ack（文档 §3：Ordered 隐含需回复 Ack）
        if (frame.isOrdered) {
            // 先更新接收方已接收序号，再计算当前允许接收的序号填入 Ack 负载
            deviceManager.getDevice(fromIp)?.updateRecvSeq(frame.seqNum)
            val recvSeq = deviceManager.getDevice(fromIp)?.nextRecvSeq() ?: 1
            val ackPayload = AckPayload(frame.seqNum, recvSeq).toBytes()
            transport.sendFrame(FrameConfig.Type.ACK, ackPayload, null, fromIp)
        }
        try {
            val json = JSONObject(String(frame.payload, Charsets.UTF_8))
            val topicMsg = jsonToTopicMessage(json) ?: return
            listeners[topicMsg.topic]?.forEach { it(topicMsg.topic, topicMsg.payload) }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse incoming message from $fromIp: ${e.message}")
        }
    }
}
