package com.yuwjoo.myhome.modules.udp

import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class UdpManager private constructor() {

    companion object {
        private val _instance: UdpManager by lazy { UdpManager() }

        fun getInstance(): UdpManager = _instance
    }

    // ──────────────── 内部状态 ────────────────

    private var socket: DatagramSocket? = null
    private var receiveThread: Thread? = null
    private var running = false

    private val callbacks = mutableListOf<UdpCallback>()
    private val topicCallbacks = mutableMapOf<String, MutableList<UdpTopicCallback>>()
    private val onlineDevices = mutableMapOf<String, UdpDevice>()
    private val handler = Handler(Looper.getMainLooper())

    val deviceList: List<UdpDevice>
        get() = onlineDevices.values.toList()

    // ──────────────── 生命周期 ────────────────

    init {
        startReceive()
    }

    fun close() {
        running = false
        receiveThread?.interrupt()
        socket?.close()
        socket = null
    }

    // ──────────────── 回调管理 ────────────────

    fun addCallback(callback: UdpCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: UdpCallback) {
        callbacks.remove(callback)
    }

    // ──────────────── 设备发现 ────────────────

    fun scanDevices() {
        onlineDevices.clear()
        callbacks.forEach { it.onDeviceChanged(emptyList()) }
        sendBroadcast(
            UdpConfig.BROADCAST_PORT,
            buildMessage(UdpConfig.TOPIC_SCAN_DEVICES),
            UdpConfig.SCAN_COUNT,
            UdpConfig.SCAN_INTERVAL,
        )
    }

    // ──────────────── Topic 操作 ────────────────

    fun subscribe(topic: String, callback: UdpTopicCallback) {
        topicCallbacks.getOrPut(topic) { mutableListOf() }.add(callback)
    }

    fun unsubscribe(topic: String, callback: UdpTopicCallback? = null) {
        if (callback != null) {
            topicCallbacks[topic]?.remove(callback)
            if (topicCallbacks[topic].isNullOrEmpty()) {
                topicCallbacks.remove(topic)
            }
        } else {
            topicCallbacks.remove(topic)
        }
    }

    fun publish(topic: String, payload: Any?, targetIp: String? = null) {
        val message = buildMessage(topic, payload)

        if (targetIp != null) {
            sendUnicast(targetIp, UdpConfig.BROADCAST_PORT, message)
        } else {
            sendBroadcast(UdpConfig.BROADCAST_PORT, message)
        }
    }

    // ──────────────── 接收消息处理 ────────────────

    private fun startReceive() {
        running = true
        socket = DatagramSocket(UdpConfig.LISTEN_PORT)
        socket?.broadcast = true

        receiveThread = Thread {
            val buffer = ByteArray(UdpConfig.BUFFER_SIZE)
            while (running && !Thread.currentThread().isInterrupted) {
                try {
                    val packet = DatagramPacket(buffer, buffer.size)
                    socket?.receive(packet)
                    val msgText = String(packet.data, 0, packet.length, Charsets.UTF_8)
                    val (topic, data) = parseMessage(msgText)
                    handleMessage(topic, data, packet.address?.hostAddress ?: "", packet.port)
                } catch (_: Exception) { }
            }
        }.apply { start() }
    }

    private fun handleMessage(topic: String?, data: Any?, ip: String, port: Int) {
        if (topic == null) return

        handler.post {
            when (topic) {
                UdpConfig.TOPIC_DEVICE_ONLINE -> handleDeviceOnline(data, ip, port)
                else -> dispatchMessage(topic, data)
            }
        }
    }

    private fun handleDeviceOnline(data: Any?, ip: String, port: Int) {
        val json = data as? JSONObject ?: return
        val deviceId = json.optString("deviceId", "").takeIf { it.isNotEmpty() } ?: return
        val device = UdpDevice(
            ipAddress = ip,
            port = json.optInt("port", port),
            deviceId = deviceId,
            deviceName = json.optString("deviceName", ""),
            deviceType = json.optString("deviceType", ""),
        )
        onlineDevices[deviceId] = device
        val list = onlineDevices.values.toList()
        callbacks.forEach { it.onDeviceChanged(list) }
    }

    private fun dispatchMessage(topic: String, data: Any?) {
        callbacks.forEach { it.onMessageArrived(topic, data) }
        topicCallbacks[topic]?.forEach { it.onMessageArrived(topic, data) }
    }

    // ──────────────── UDP 收发底层 ────────────────

    private fun sendBroadcast(port: Int, message: String, count: Int = 1, interval: Long = 0) {
        Thread {
            val address = InetAddress.getByName("255.255.255.255")
            repeat(count) { i ->
                try {
                    DatagramSocket().use { s ->
                        s.broadcast = true
                        val data = message.toByteArray(Charsets.UTF_8)
                        s.send(DatagramPacket(data, data.size, address, port))
                    }
                } catch (_: Exception) { }
                if (i < count - 1 && interval > 0) Thread.sleep(interval)
            }
        }.start()
    }

    private fun sendUnicast(targetIp: String, port: Int, message: String) {
        Thread {
            try {
                DatagramSocket().use { s ->
                    val data = message.toByteArray(Charsets.UTF_8)
                    s.send(DatagramPacket(data, data.size, InetAddress.getByName(targetIp), port))
                }
            } catch (_: Exception) { }
        }.start()
    }

    private fun buildMessage(topic: String, data: Any? = null): String {
        val json = JSONObject()
        json.put("topic", topic)
        if (data != null) json.put("data", data)
        return json.toString()
    }

    private fun parseMessage(msgText: String): Pair<String?, Any?> {
        return try {
            val json = JSONObject(msgText)
            val topic = json.optString("topic", "").takeIf { it.isNotEmpty() }
            val data = if (json.has("data")) json.get("data") else null
            topic to data
        } catch (_: Exception) {
            null to null
        }
    }
}
