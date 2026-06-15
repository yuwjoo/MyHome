# MQTT 客户端模块设计文档

> 基于 Eclipse Paho Android Service，封装 MQTT 长连接、订阅、发布。
> 核心设计：内部管理连接信息，对外暴露最小化 API。

## 目录

- [1. 简介](#1-简介)
- [2. 运行流程图](#2-运行流程图)
- [3. 模块关系图](#3-模块关系图)
- [4. 目录结构](#4-目录结构)
- [5. 实现流程](#5-实现流程)

---

## 1. 简介

### 1.1 模块定位

MQTT 客户端模块负责 Android 端与 MQTT Broker 之间的双向消息通信。

### 1.2 设计原则

MqttManager 以单例形式提供，MQTT 服务器地址、账号密码、心跳间隔等连接信息全部内置于模块内部。调用方需要的能力：

- 初始化（仅传 `context`）
- 注册 / 移除全局回调
- 订阅 / 取消订阅主题
- 发布消息
- 查询连接状态

### 1.3 对外 API

```kotlin
// 初始化
MqttManager.init(context: Context)

// 获取单例
val mqtt = MqttManager.getInstance()

// 连接
mqtt.connect()
mqtt.disconnect()
val connected: Boolean = mqtt.isConnected

// 全局回调
mqtt.addCallback(callback: MqttCallback)
mqtt.removeCallback(callback: MqttCallback)

// 主题操作
mqtt.subscribe(
    topic: String,
    qos: Int = 1,
    callback: MqttTopicCallback? = null
)
mqtt.unsubscribe(
    topic: String,
    callback: MqttTopicCallback? = null
)
mqtt.publish(
    topic: String,
    payload: String,
    qos: Int = 1,
    retained: Boolean = false
)
```

### 1.4 依赖

```toml
# gradle/libs.versions.toml
[versions]
paho-mqtt = "1.2.5"
paho-mqtt-android = "1.1.1"

[libraries]
paho-mqtt-client = { group = "org.eclipse.paho", name = "org.eclipse.paho.client.mqttv3", version.ref = "paho-mqtt" }
paho-mqtt-android-service = { group = "org.eclipse.paho", name = "org.eclipse.paho.android.service", version.ref = "paho-mqtt-android" }
```

```kotlin
// app/build.gradle.kts
dependencies {
    implementation(libs.paho.mqtt.client)
    implementation(libs.paho.mqtt.android.service)
}
```

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<service android:name="org.eclipse.paho.android.service.MqttService" />
```

---

## 2. 运行流程图

### 2.1 连接与订阅

```
调用方                          MqttManager                      MqttAndroidClient
  │                                │                                    │
  │ ① connect()                    │                                    │
  │                                ├─ 创建 MqttAndroidClient ──────────→
  │                                ├─ 构建 MqttConnectOptions            │
  │                                └─ client.connect() ────────────────→
  │                                │    │                               │
  │                                │    │ onSuccess()                   │
  │                                │  ←─┘  └─ callbacks.onConnected()   │
  │  ←─ callback.onConnected()     │                                    │
  │                                │                                    │
  │ ② subscribe(topic, qos, cb)    │                                    │
  │                                ├─ 未连接 → 直接返回                  │
  │                                ├─ 已订阅 → 跳过 broker 请求          │
  │                                ├─ 注册 cb → topicCallbacks          │
  │                                └─ client.subscribe() ──────────────→
  │                                │    │ onSuccess()                   │
  │                                │  ←─┘                               │
  │                                │                                    │
  │                                │ ③ Broker 推送消息                   │
  │                                │  ←── messageArrived ────────────── │
  │                                ├─ callbacks（全局）                  │
  │  ←─ callback.onMessageArrived()│                                    │
  │                                ├─ topicCallbacks[topic]（按主题）    │
  │  ←─ topicCb.onMessageArrived() │                                    │
  │                                │                                    │
  │ ④ publish(topic, payload)      │                                    │
  │                                └─ client.publish() ────────────────→
  │                                │    │ onSuccess() / onFailure()     │
  │                                │  ←─┘                               │
  │                                │                                    │
  │ ⑤ disconnect()                 │                                    │
  │                                └─ client.disconnect() ─────────────→
  │                                │    │ onSuccess()                   │
  │  ←─ callback.onDisconnected()  │  ←─┘                              │
```

### 2.2 断开与重连

```
  连接异常断开
    │
    ▼
  MqttCallbackExtended.connectionLost(cause)
    │
    ├─ 通知 callbacks.onDisconnected(cause)
    │
    └─ Paho 自动重连（isAutomaticReconnect = true）
          │
          ├─ 指数退避，最大延迟 maxReconnectDelay 秒
          ├─ 成功 → connectComplete(reconnect=true) → callbacks.onConnected()
          └─ 订阅的 topic 自动恢复
```

---

## 3. 模块关系图

### 3.1 内部结构

```
┌─────────────────────────────────────────────────────────────┐
│                     mqtt/ 模块内部                            │
│                                                             │
│  ┌──────────────────┐                                       │
│  │ MqttConfig       │  (internal)                           │
│  │ ─────────────────│                                       │
│  │ + brokerUrl      │                                       │
│  │ + clientId       │                                       │
│  │ + username       │                                       │
│  │ + password       │                                       │
│  │ + keepAlive      │                                       │
│  │ + willTopic      │                                       │
│  │ + willPayload    │                                       │
│  └────────┬─────────┘                                       │
│           │                                             │
│  ┌────────▼─────────┐       ┌──────────────────┐            │
│  │  MqttManager     │──────▶│ MqttAndroidClient │            │
│  │  (单例)          │  持有  │  (Paho Service)  │            │
│  │ ─────────────────│       └──────────────────┘            │
│  │ + init()         │                                       │
│  │ + getInstance()  │       ┌──────────────────┐            │
│  │ + connect()      │  持有  │ MqttCallback 列表 │            │
│  │ + disconnect()   │──────▶│ (全局回调)        │            │
│  │ + isConnected    │       └──────────────────┘            │
│  │ + subscribe()    │                                       │
│  │ + unsubscribe()  │       ┌──────────────────┐            │
│  │ + publish()      │  持有  │ Set<subscribed>   │            │
│  │ + addCallback()  │──────▶│ Map<topic,         │            │
│  │ + removeCallback()│      │   List<            │            │
│  └──────────────────┘       │   TopicCallback>>  │            │
│                              └──────────────────┘            │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│         调用方                │
│                              │
│ MqttCallback (接口)           │
│ ────────────────────────────│
│ + onConnected()              │
│ + onDisconnected(cause)      │
│ + onMessageArrived(topic, msg)│
│ + onError(error)             │
│                              │
│ MqttTopicCallback (接口)      │
│ ────────────────────────────│
│ + onMessageArrived(topic, msg)│
│                              │
│ MqttManager.init(app)         │
│ MqttManager.getInstance()    │
│   .addCallback(callback)     │
│   .connect()                 │
│   .subscribe(topic, qos, cb) │
│   .publish(topic, payload)   │
│   .disconnect()              │
└──────────────────────────────┘
```

### 3.2 接口可见性

| 类 / 接口 | 可见性 | 说明 |
|-----------|--------|------|
| `MqttManager` | public | 单例管理类，对外唯一入口 |
| `MqttCallback` | public | 全局回调，监听连接事件及所有消息 |
| `MqttTopicCallback` | public | 主题回调，仅监听指定 topic 的消息 |
| `MqttConfig` | internal | 连接配置，模块内部可见 |

### 3.3 内部配置

```kotlin
internal object MqttConfig {
    const val BROKER_URL = "tcp://192.168.1.100:1883"
    const val USERNAME = "myhome"
    const val PASSWORD = "your_password_here"
    const val KEEP_ALIVE = 60
    const val CLEAN_SESSION = true
    const val CONNECTION_TIMEOUT = 30
    const val MAX_RECONNECT_DELAY = 30
    const val WILL_TOPIC = "device/offline"
    const val WILL_PAYLOAD = """{"status":"offline"}"""
    const val WILL_QOS = 1
    const val WILL_RETAINED = false
    /** 每次 init 时根据时间戳自动生成 */
    fun clientId() = "android-${System.currentTimeMillis()}"
}
```

---

## 4. 目录结构

```
app/src/main/java/com/yuwjoo/myhome/modules/mqtt/
├── DESIGN.md
├── MqttCallback.kt
├── MqttTopicCallback.kt
├── MqttConfig.kt
└── MqttManager.kt
```

| 文件 | 可见性 | 职责 |
|------|--------|------|
| `MqttManager.kt` | public | 单例入口，封装连接、订阅、发布 |
| `MqttCallback.kt` | public | 全局回调接口 |
| `MqttTopicCallback.kt` | public | 主题回调接口 |
| `MqttConfig.kt` | internal | 连接配置数据类 |

---

## 5. 实现流程

### 5.1 步骤 1 — `MqttCallback`

```kotlin
package com.yuwjoo.myhome.modules.mqtt

interface MqttCallback {
    /** 连接成功 */
    fun onConnected()

    /**
     * 连接断开
     * @param cause 断开原因，主动 disconnect() 时传入 null
     */
    fun onDisconnected(cause: Throwable?)

    /**
     * 收到订阅消息
     * @param topic  消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: String)

    /**
     * 发生异常
     * @param error 异常信息
     */
    fun onError(error: Throwable)
}
```

### 5.2 步骤 2 — `MqttTopicCallback`

```kotlin
package com.yuwjoo.myhome.modules.mqtt

/**
 * 主题专属回调，用于 subscribe() 时传入。
 * 仅包含消息到达方法，不含连接相关事件。
 */
interface MqttTopicCallback {
    /**
     * 收到该主题的订阅消息
     * @param topic  消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: String)
}
```

### 5.3 步骤 3 — `MqttConfig`

```kotlin
package com.yuwjoo.myhome.modules.mqtt

internal object MqttConfig {
    const val BROKER_URL = "tcp://192.168.1.100:1883"
    const val USERNAME = "myhome"
    const val PASSWORD = "your_password_here"
    const val KEEP_ALIVE = 60
    const val CLEAN_SESSION = true
    const val CONNECTION_TIMEOUT = 30
    const val MAX_RECONNECT_DELAY = 30
    const val WILL_TOPIC = "device/offline"
    const val WILL_PAYLOAD = """{"status":"offline"}"""
    const val WILL_QOS = 1
    const val WILL_RETAINED = false
    fun clientId() = "android-${System.currentTimeMillis()}"
}
```

### 5.4 步骤 4 — `MqttManager`

```kotlin
package com.yuwjoo.myhome.modules.mqtt

import android.content.Context
import android.os.Handler
import android.os.Looper
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*

class MqttManager private constructor(
    private val context: Context,
) {

    companion object {
        @Volatile private var instance: MqttManager? = null

        fun init(context: Context): MqttManager {
            return instance ?: synchronized(this) {
                instance ?: MqttManager(context.applicationContext).also {
                    instance = it
                }
            }
        }

        fun getInstance(): MqttManager {
            return instance ?: throw IllegalStateException(
                "MqttManager 未初始化，请先调用 init(context)"
            )
        }
    }

    // ──────────────── 内部状态 ────────────────

    private var client: MqttAndroidClient? = null
    private val callbacks = mutableListOf<MqttCallback>()
    private val topicCallbacks = mutableMapOf<String, MutableList<MqttTopicCallback>>()
    private val subscribedTopics = mutableSetOf<String>()
    private val handler = Handler(Looper.getMainLooper())

    val isConnected: Boolean
        get() = client?.isConnected == true

    // ──────────────── 回调管理 ────────────────

    fun addCallback(callback: MqttCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: MqttCallback) {
        callbacks.remove(callback)
        val emptyTopics = mutableListOf<String>()
        topicCallbacks.forEach { (topic, cbs) ->
            cbs.remove(callback)
            if (cbs.isEmpty()) emptyTopics.add(topic)
        }
        emptyTopics.forEach { doUnsubscribe(it) }
    }

    // ──────────────── 连接管理 ────────────────

    fun connect() {
        if (client?.isConnected == true) return

        val mqttClient = MqttAndroidClient(context, MqttConfig.BROKER_URL, MqttConfig.clientId())
        this.client = mqttClient

        mqttClient.setCallback(object : MqttCallbackExtended {
            override fun connectComplete(reconnect: Boolean, serverURI: String) {
                handler.post { callbacks.forEach { it.onConnected() } }
            }

            override fun connectionLost(cause: Throwable?) {
                handler.post { callbacks.forEach { it.onDisconnected(cause) } }
            }

            override fun messageArrived(topic: String?, message: MqttMessage?) {
                if (topic != null && message != null) {
                    handler.post {
                        val payload = String(message.payload, Charsets.UTF_8)
                        callbacks.forEach { it.onMessageArrived(topic, payload) }
                        topicCallbacks[topic]?.forEach { it.onMessageArrived(topic, payload) }
                    }
                }
            }

            override fun deliveryComplete(token: IMqttDeliveryToken?) {}
        })

        val options = MqttConnectOptions().apply {
            userName = MqttConfig.USERNAME
            password = MqttConfig.PASSWORD.toCharArray()
            isCleanSession = MqttConfig.CLEAN_SESSION
            keepAliveInterval = MqttConfig.KEEP_ALIVE
            connectionTimeout = MqttConfig.CONNECTION_TIMEOUT
            isAutomaticReconnect = true
            maxReconnectDelay = MqttConfig.MAX_RECONNECT_DELAY

            setWill(
                MqttConfig.WILL_TOPIC,
                MqttConfig.WILL_PAYLOAD.toByteArray(),
                MqttConfig.WILL_QOS,
                MqttConfig.WILL_RETAINED,
            )
        }

        mqttClient.connect(options, null, object : IMqttActionListener {
            override fun onSuccess(token: IMqttToken?) {}
            override fun onFailure(token: IMqttToken?, exception: Throwable?) {
                handler.post {
                    callbacks.forEach { it.onError(exception ?: Exception("连接失败")) }
                }
            }
        })
    }

    fun disconnect() {
        try {
            client?.disconnect(null, object : IMqttActionListener {
                override fun onSuccess(token: IMqttToken?) {
                    handler.post { callbacks.forEach { it.onDisconnected(null) } }
                }
                override fun onFailure(token: IMqttToken?, exception: Throwable?) {}
            })
        } catch (_: Exception) { }
    }

    // ──────────────── 消息操作 ────────────────

    fun subscribe(topic: String, qos: Int = 1, callback: MqttTopicCallback? = null) {
        if (client?.isConnected != true) return

        if (callback != null) {
            topicCallbacks.getOrPut(topic) { mutableListOf() }.add(callback)
        }

        if (subscribedTopics.contains(topic)) return
        subscribedTopics.add(topic)

        client?.subscribe(topic, qos, null, object : IMqttActionListener {
            override fun onSuccess(token: IMqttToken?) {}
            override fun onFailure(token: IMqttToken?, exception: Throwable?) {
                handler.post {
                    callbacks.forEach { it.onError(exception ?: Exception("订阅失败 [$topic]")) }
                }
            }
        })
    }

    fun unsubscribe(topic: String, callback: MqttTopicCallback? = null) {
        if (callback != null) {
            topicCallbacks[topic]?.remove(callback)
            if (topicCallbacks[topic].isNullOrEmpty()) {
                topicCallbacks.remove(topic)
                doUnsubscribe(topic)
            }
        } else {
            topicCallbacks.remove(topic)
            doUnsubscribe(topic)
        }
    }

    private fun doUnsubscribe(topic: String) {
        subscribedTopics.remove(topic)
        client?.unsubscribe(topic, null, object : IMqttActionListener {
            override fun onSuccess(token: IMqttToken?) {}
            override fun onFailure(token: IMqttToken?, exception: Throwable?) {}
        })
    }

    fun publish(
        topic: String,
        payload: String,
        qos: Int = 1,
        retained: Boolean = false,
    ) {
        client?.publish(
            topic,
            MqttMessage().apply {
                this.payload = payload.toByteArray(Charsets.UTF_8)
                this.qos = qos
                this.isRetained = retained
            },
            null,
            object : IMqttActionListener {
                override fun onSuccess(token: IMqttToken?) {}
                override fun onFailure(token: IMqttToken?, exception: Throwable?) {
                    handler.post {
                        callbacks.forEach { it.onError(exception ?: Exception("发布失败 [$topic]")) }
                    }
                }
            },
        )
    }
}
```

### 5.5 步骤 5 — 使用示例

```kotlin
// Application 初始化
class MyHomeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        MqttManager.init(this)
    }
}

// Activity 中使用
class MainActivity : AppCompatActivity() {

    // 全局回调
    private val globalCallback = object : MqttCallback {
        override fun onConnected() {
            MqttManager.getInstance().subscribe("home/broadcast", qos = 0)
        }
        override fun onDisconnected(cause: Throwable?) {
            Log.w("MQTT", "断开连接: ${cause?.message}")
        }
        override fun onMessageArrived(topic: String, payload: String) {
            Log.d("MQTT", "$topic → $payload")
        }
        override fun onError(error: Throwable) {
            Log.e("MQTT", "异常: ${error.message}", error)
        }
    }

    // 主题回调
    private val lightCallback = object : MqttTopicCallback {
        override fun onMessageArrived(topic: String, payload: String) {
            handleLightControl(topic, payload)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val mqtt = MqttManager.getInstance()
        mqtt.addCallback(globalCallback)
        mqtt.subscribe("home/light/control", qos = 1, lightCallback)
        mqtt.connect()
    }

    override fun onDestroy() {
        super.onDestroy()

        val mqtt = MqttManager.getInstance()
        mqtt.unsubscribe("home/light/control", lightCallback)
        mqtt.removeCallback(globalCallback)
        mqtt.disconnect()
    }

    private fun handleLightControl(topic: String, payload: String) {}
}

// 任意位置发送消息
MqttManager.getInstance().publish("home/light/status", """{"status":"on"}""")
MqttManager.getInstance().publish("sensor/temperature", "25.6", qos = 0)
```
