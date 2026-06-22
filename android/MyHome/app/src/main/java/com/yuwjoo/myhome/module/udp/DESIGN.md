# UDP 局域网消息模块设计文档

> 基于 UDP 广播/单播，实现局域网设备发现与 Topic 消息通信。
> 核心设计：内部管理端口配置，对外暴露 Topic 订阅/发布 API。

## 目录

- [1. 简介](#1-简介)
- [2. 运行流程图](#2-运行流程图)
- [3. 模块关系图](#3-模块关系图)
- [4. 目录结构](#4-目录结构)
- [5. 实现流程](#5-实现流程)

---

## 1. 简介

### 1.1 模块定位

UDP 局域网消息模块负责局域网内设备发现及 Topic 消息通信，用于智能家居设备的本地直连控制和状态同步。

### 1.2 设计原则

UdpManager 以单例形式提供，UDP 端口等配置全部内置于模块内部。调用方需要的能力：

- 扫描一次，刷新并记录在线设备
- 订阅 / 取消订阅 Topic 消息
- 发送 Topic 消息（广播或单播）

### 1.3 对外 API

```kotlin
// 获取单例（首次调用自动初始化）
val udp = UdpManager.getInstance()

// 设备发现
udp.scanDevices()                               // 扫描一次，刷新在线设备列表
val devices: List<UdpDevice> = udp.deviceList   // 读取扫描结果

// 全局回调
udp.addCallback(callback: UdpCallback)
udp.removeCallback(callback: UdpCallback)

// Topic 操作
udp.subscribe(
    topic: String,
    callback: UdpTopicCallback
)
udp.unsubscribe(
    topic: String,
    callback: UdpTopicCallback? = null
)
udp.publish(
    topic: String,
    payload: Any? = null,
    targetIp: String? = null                    // null → 广播，指定 IP → 单播
)
```

### 1.4 消息格式

消息体为 JSON，结构固定为 `topic` + `data`：

```json
{"topic": "YHHome/device/bedroomAC", "data": {"status": "on"}}
```

设备发现和应答使用内置 Topic：

| 内置 Topic | 方向 | 用途 |
|---|---|---|
| `YHHome/scanDevices` | 广播 → 设备 | 扫描局域网设备 |
| `YHHome/deviceOnline` | 设备 → 客户端 | 设备在线应答，携带设备信息 |

### 1.5 依赖与权限

无额外第三方依赖，使用 `java.net.DatagramSocket`。需要声明的权限：

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

---

## 2. 运行流程图

### 2.1 设备发现

```
调用方                    UdpManager                      局域网设备
  │                            │                                  │
  │ ① scanDevices()            │                                  │
  │                            ├─ 清空 onlineDevices              │
  │                            ├─ callback.onDeviceChanged([])   │
  │  ←─ onDeviceChanged([])     │                                  │
  │                            ├─ sendBroadcast(                 │
  │                            │    YHHome/scanDevices,           │
  │                            │    count=3, interval=1000) ─────→
  │                            │    │        (广播到 255.255.255.255)
  │                            │    │                             │
  │                            │    │  设备收到扫描，回复：          │
  │                            │  ←──── YHHome/deviceOnline ─────│
  │                            │       {deviceId, deviceName,     │
  │                            │        deviceType, port}         │
  │                            │    │                             │
  │                            │    ├─ 解析设备信息                │
  │                            │    ├─ 加入 onlineDevices         │
  │                            │    └─ callback.onDeviceChanged() │
  │  ←─ onDeviceChanged(devices)│                                  │
  │                            │                                  │
  │ ② 读取 udp.deviceList       │                                  │
  │  ←─ 返回扫描到的设备列表     │                                  │
```

### 2.2 Topic 消息收发

```
调用方                    UdpManager                      局域网设备
  │                            │                                  │
  │ ③ subscribe(topic, cb)     │                                  │
  │                            ├─ 注册 topic → cb                 │
  │                            │                                  │
  │                            │  设备发送消息：                    │
  │                            │  ←── msg={topic, data} ──────────│
  │                            │    ├─ callbacks.onMessageArrived()│
  │  ←─ callback.onMessageArrived()│                               │
  │                            │    ├─ topicCallbacks[topic]       │
  │  ←─ topicCb.onMessageArrived()│                                │
  │                            │                                  │
  │ ④ publish(topic, payload)  │                                  │
  │                            ├─ sendBroadcast(msg) ────────────→
  │                            │    │  (targetIp=null → 广播)     │
  │                            │                                  │
  │ ⑤ publish(topic, p, ip)    │                                  │
  │                            ├─ sendUnicast(msg, ip) ──────────→
  │                            │    │  (targetIp 指定 → 单播)     │
```

---

## 3. 模块关系图

### 3.1 内部结构

```
┌─────────────────────────────────────────────────────────────┐
│                     udp/ 模块内部                             │
│                                                             │
│  ┌──────────────────┐                                       │
│  │ UdpConfig        │  (internal)                           │
│  │ ─────────────────│                                       │
│  │ + LISTEN_PORT    │                                       │
│  │ + BROADCAST_PORT │                                       │
│  │ + SCAN_COUNT     │                                       │
│  │ + SCAN_INTERVAL  │                                       │
│  └────────┬─────────┘                                       │
│           │                                             │
│  ┌────────▼─────────┐       ┌──────────────────┐            │
│  │  UdpManager      │──────▶│ DatagramSocket   │            │
│  │  (单例)          │  持有  │  (接收)          │            │
│  │ ─────────────────│       └──────────────────┘            │
│  │ + getInstance()  │       ┌──────────────────┐            │
│  │ + deviceList     │──────▶│ Map<id, UdpDevice>│            │
│  │ + scanDevices()  │       │ (扫描结果, 快照)  │            │
│  │ + subscribe()    │       └──────────────────┘            │
│  │ + unsubscribe()  │                                       │
│  │ + publish()      │       ┌──────────────────┐            │
│  │ + addCallback()  │  持有  │ UdpCallback 列表  │            │
│  │ + removeCallback()│──────▶│ Map<topic,         │            │
│  │ + close()        │       │   List<            │            │
│  └──────────────────┘       │   TopicCallback>>  │            │
│                              └──────────────────┘            │
│                                                             │
│  ┌──────────────────┐                                       │
│  │ UdpDevice        │  (public)                             │
│  │ ─────────────────│                                       │
│  │ + ipAddress      │                                       │
│  │ + port           │                                       │
│  │ + deviceId       │                                       │
│  │ + deviceName     │                                       │
│  │ + deviceType     │                                       │
│  └──────────────────┘                                       │
│                                                             │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│         调用方                │
│                              │
│ UdpCallback (接口)            │
│ ────────────────────────────│
│ + onDeviceChanged(devices)   │
│ + onMessageArrived(topic, msg)│
│                              │
│ UdpTopicCallback (接口)       │
│ ────────────────────────────│
│ + onMessageArrived(topic, msg)│
│                              │
│ UdpManager.getInstance()    │
│   .scanDevices()            │
│   .subscribe(topic, cb)     │
│   .publish(topic, payload)  │
│   .close()                  │
└──────────────────────────────┘
```

### 3.2 接口可见性

| 类 / 接口 | 可见性 | 说明 |
|-----------|--------|------|
| `UdpManager` | public | 单例管理类，对外唯一入口 |
| `UdpDevice` | public | 设备信息数据类 |
| `UdpCallback` | public | 全局回调，设备变化 + 所有消息 |
| `UdpTopicCallback` | public | Topic 回调，仅监听指定 Topic 的消息 |
| `UdpConfig` | internal | 端口等配置，模块内部可见 |

### 3.3 内部配置

```kotlin
internal object UdpConfig {
    const val LISTEN_PORT = 8001
    const val BROADCAST_PORT = 8000
    const val SCAN_COUNT = 3
    const val SCAN_INTERVAL = 1000L
    const val BUFFER_SIZE = 1024
    const val TOPIC_SCAN_DEVICES = "YHHome/scanDevices"
    const val TOPIC_DEVICE_ONLINE = "YHHome/deviceOnline"
}
```

---

## 4. 目录结构

```
app/src/main/java/com/yuwjoo/myhome/modules/udp/
├── DESIGN.md
├── UdpCallback.kt
├── UdpTopicCallback.kt
├── UdpDevice.kt
├── UdpConfig.kt
└── UdpManager.kt
```

| 文件 | 可见性 | 职责 |
|------|--------|------|
| `UdpManager.kt` | public | 单例入口，封装设备发现、订阅、发布 |
| `UdpDevice.kt` | public | 在线设备信息数据类 |
| `UdpCallback.kt` | public | 全局回调接口 |
| `UdpTopicCallback.kt` | public | Topic 回调接口 |
| `UdpConfig.kt` | internal | 端口等配置常量 |

---

## 5. 实现流程

### 5.1 步骤 1 — `UdpDevice`

```kotlin
package com.yuwjoo.myhome.modules.udp

data class UdpDevice(
    val ipAddress: String,
    val port: Int,
    val deviceId: String,
    val deviceName: String,
    val deviceType: String,
)
```

### 5.2 步骤 2 — `UdpCallback`

```kotlin
package com.yuwjoo.myhome.modules.udp

interface UdpCallback {
    /**
     * 设备列表发生变化（scanDevices 收到应答时回调）
     * @param devices 当前全部已发现的设备
     */
    fun onDeviceChanged(devices: List<UdpDevice>)

    /**
     * 收到任意 Topic 消息
     * @param topic   消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: Any?)
}
```

### 5.3 步骤 3 — `UdpTopicCallback`

```kotlin
package com.yuwjoo.myhome.modules.udp

interface UdpTopicCallback {
    /**
     * 收到匹配 Topic 的消息
     * @param topic   消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: Any?)
}
```

### 5.4 步骤 4 — `UdpConfig`

```kotlin
package com.yuwjoo.myhome.modules.udp

internal object UdpConfig {
    const val LISTEN_PORT = 8001
    const val BROADCAST_PORT = 8000
    const val SCAN_COUNT = 3
    const val SCAN_INTERVAL = 1000L
    const val BUFFER_SIZE = 1024
    const val TOPIC_SCAN_DEVICES = "YHHome/scanDevices"
    const val TOPIC_DEVICE_ONLINE = "YHHome/deviceOnline"
}
```

### 5.5 步骤 5 — `UdpManager`

```kotlin
package com.yuwjoo.myhome.modules.udp

import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class UdpManager private constructor() {

    companion object {
        private val instance: UdpManager by lazy { UdpManager() }

        fun getInstance(): UdpManager = instance
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
                    handleMessage(topic, data, packet.address.hostAddress, packet.port)
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
        val deviceId = json.optString("deviceId") ?: return
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
            val topic = json.optString("topic", null)
            val data = if (json.has("data")) json.get("data") else null
            topic to data
        } catch (_: Exception) {
            null to null
        }
    }
}
```

### 5.6 步骤 6 — 使用示例

```kotlin
class DeviceListActivity : AppCompatActivity() {

    // 全局回调
    private val globalCallback = object : UdpCallback {
        override fun onDeviceChanged(devices: List<UdpDevice>) {
            updateDeviceList(devices)
        }
        override fun onMessageArrived(topic: String, payload: Any?) {
            Log.d("UDP", "$topic → $payload")
        }
    }

    // Topic 回调
    private val acCallback = object : UdpTopicCallback {
        override fun onMessageArrived(topic: String, payload: Any?) {
            handleACState(payload)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val udp = UdpManager.getInstance()
        udp.addCallback(globalCallback)
        udp.subscribe("YHHome/device/bedroomAC", acCallback)

        // 扫描设备
        udp.scanDevices()
    }

    override fun onDestroy() {
        super.onDestroy()
        val udp = UdpManager.getInstance()
        udp.unsubscribe("YHHome/device/bedroomAC", acCallback)
        udp.removeCallback(globalCallback)
    }

    private fun updateDeviceList(devices: List<UdpDevice>) {}
    private fun handleACState(payload: Any?) {}
}

// 控制设备（广播）
UdpManager.getInstance().publish(
    "YHHome/RC/bedroomAC",
    JSONObject().apply { put("action", "powerOn") }
)

// 控制设备（单播）
UdpManager.getInstance().publish(
    "YHHome/RC/bedroomAC",
    JSONObject().apply { put("action", "powerOff") },
    targetIp = "192.168.1.100"
)
```
