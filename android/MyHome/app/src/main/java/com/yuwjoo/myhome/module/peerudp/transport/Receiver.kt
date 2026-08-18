package com.yuwjoo.myhome.module.peerudp.transport

import android.util.Log
import com.yuwjoo.myhome.module.peerudp.frame.FrameCodec
import com.yuwjoo.myhome.module.peerudp.frame.FrameData
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig

/**
 * 消息回调：收到帧数据时触发
 */
typealias MessageCallback = (FrameData, String) -> Unit

/**
 * UDP 接收者
 *
 * 持有按帧类型分组的回调映射表，外部收到消息调用 [dispatch] 时按帧类型触发对应回调。
 */
internal class Receiver {

    companion object {
        private const val TAG = "Receiver"
    }

    private val callbackMap = mutableMapOf<Byte, MutableSet<MessageCallback>>() // 按帧类型分组的回调集合

    /**
     * 分发消息：解析帧并按类型触发对应回调
     *
     * @param data   原始字节数据
     * @param fromIp 来源设备 IP
     */
    fun dispatch(data: ByteArray, fromIp: String) {
        val frame = FrameCodec.decode(data)
        if (frame == null) {
            Log.w(TAG, "dispatch: decode frame failed from $fromIp")
            return
        }
        callbackMap[frame.type]?.forEach { it.invoke(frame, fromIp) }
    }

    /**
     * 注册心跳消息回调
     *
     * @param callback 消息回调
     * @return 是否注册成功（同一回调重复注册返回 false）
     */
    fun registerHeartbeatCallback(callback: MessageCallback) = register(FrameConfig.Type.HEARTBEAT, callback)

    /**
     * 取消注册心跳消息回调
     *
     * @param callback 消息回调
     * @return 是否取消注册成功（回调不存在时返回 false）
     */
    fun unregisterHeartbeatCallback(callback: MessageCallback) = unregister(FrameConfig.Type.HEARTBEAT, callback)

    /**
     * 注册离线消息回调
     *
     * @param callback 消息回调
     * @return 是否注册成功（同一回调重复注册返回 false）
     */
    fun registerOfflineCallback(callback: MessageCallback) = register(FrameConfig.Type.OFFLINE, callback)

    /**
     * 取消注册离线消息回调
     *
     * @param callback 消息回调
     * @return 是否取消注册成功（回调不存在时返回 false）
     */
    fun unregisterOfflineCallback(callback: MessageCallback) = unregister(FrameConfig.Type.OFFLINE, callback)

    /**
     * 注册呼叫消息回调
     *
     * @param callback 消息回调
     * @return 是否注册成功（同一回调重复注册返回 false）
     */
    fun registerCallCallback(callback: MessageCallback) = register(FrameConfig.Type.CALL, callback)

    /**
     * 取消注册呼叫消息回调
     *
     * @param callback 消息回调
     * @return 是否取消注册成功（回调不存在时返回 false）
     */
    fun unregisterCallCallback(callback: MessageCallback) = unregister(FrameConfig.Type.CALL, callback)

    /**
     * 注册应答消息回调
     *
     * @param callback 消息回调
     * @return 是否注册成功（同一回调重复注册返回 false）
     */
    fun registerAnswerCallback(callback: MessageCallback) = register(FrameConfig.Type.ANSWER, callback)

    /**
     * 取消注册应答消息回调
     *
     * @param callback 消息回调
     * @return 是否取消注册成功（回调不存在时返回 false）
     */
    fun unregisterAnswerCallback(callback: MessageCallback) = unregister(FrameConfig.Type.ANSWER, callback)

    /**
     * 注册确认消息回调
     *
     * @param callback 消息回调
     * @return 是否注册成功（同一回调重复注册返回 false）
     */
    fun registerAckCallback(callback: MessageCallback) = register(FrameConfig.Type.ACK, callback)

    /**
     * 取消注册确认消息回调
     *
     * @param callback 消息回调
     * @return 是否取消注册成功（回调不存在时返回 false）
     */
    fun unregisterAckCallback(callback: MessageCallback) = unregister(FrameConfig.Type.ACK, callback)

    /**
     * 注册 JSON 消息回调
     *
     * @param callback 消息回调
     * @return 是否注册成功（同一回调重复注册返回 false）
     */
    fun registerJsonCallback(callback: MessageCallback) = register(FrameConfig.Type.JSON, callback)

    /**
     * 取消注册 JSON 消息回调
     *
     * @param callback 消息回调
     * @return 是否取消注册成功（回调不存在时返回 false）
     */
    fun unregisterJsonCallback(callback: MessageCallback) = unregister(FrameConfig.Type.JSON, callback)

    /**
     * 注册原始消息回调
     *
     * @param callback 消息回调
     * @return 是否注册成功（同一回调重复注册返回 false）
     */
    fun registerRawCallback(callback: MessageCallback) = register(FrameConfig.Type.RAW, callback)

    /**
     * 取消注册原始消息回调
     *
     * @param callback 消息回调
     * @return 是否取消注册成功（回调不存在时返回 false）
     */
    fun unregisterRawCallback(callback: MessageCallback) = unregister(FrameConfig.Type.RAW, callback)

    /**
     * 注册指定帧类型的消息回调
     */
    private fun register(type: Byte, callback: MessageCallback) =
        callbackMap.getOrPut(type) { mutableSetOf() }.add(callback)

    /**
     * 取消注册指定帧类型的消息回调
     */
    private fun unregister(type: Byte, callback: MessageCallback) =
        callbackMap[type]?.remove(callback) ?: false

}
