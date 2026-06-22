# MQTT 客户端模块开发文档

> 基于 Eclipse Paho Android Service，封装 MQTT 连接、订阅、发布、回调

## 目录

- [1. 简介](#1-简介)
- [2. 流程图](#2-流程图)
  - [2.1 业务流程图](#21-业务流程图)
  - [2.2 模块流程图](#22-模块流程图)
- [3. 运行流程](#3-运行流程)
- [4. 目录结构（建议）](#4-目录结构建议)
- [5. 总结](#5-总结)

---

## 1. 简介

MQTT 客户端模块基于 **Eclipse Paho** 实现，用于 Android 端与 MQTT Broker 的双向通信。核心类 `MqttAndroidClient` 继承自 `MqttClient`，内部启动 `MqttService` 保持长连接，支持自动重连、离线消息、遗嘱消息。

- `MqttConfig` — 连接配置数据类（broker、clientId、认证、topic 等）
- `MqttCallback` — 事件回调接口（连接成功/断开、消息到达、异常）
- `MqttManager` — 核心管理类，封装 `MqttAndroidClient` 的连接/订阅/发布/断开逻辑

依赖声明：

```toml
# gradle/libs.versions.toml
[versions]
paho-mqtt = "1.2.5"
paho-mqtt-android = "1.1.1"

[libraries]
paho-mqtt-client = { group = "org.eclipse.paho", name = "org.eclipse.paho.client.mqttv3", version.ref = "paho-mqtt" }
paho-mqtt-android-service = { group = "org.eclipse.paho", name = "org.eclipse.paho.android.service", version.ref = "paho-mqtt-android" }
```

AndroidManifest 声明：

```xml
<uses-permission android:name="android.permission.WAKE_LOCK" />

<service android:name="org.eclipse.paho.android.service.MqttService" />
```

---

## 2. 流程图

### 2.1 业务流程图

展示一次完整的 **连接 → 订阅 → 接收消息** 的调用链：

```
调用方                          MqttManager                     MqttAndroidClient
  │                                │                                  │
  │ ① connect(config, callback)    │                                  │
  │  ├─ 构建 MqttConnectOptions    │                                  │
  │  └─ 创建 MqttAndroidClient     │                                  │
  │                                │                                  │
  │                                │ ② client.connect(options) ──────→
  │                                │    │                             │
  │                                │    │ ③ IMqttActionListener      │
  │                                │    │    onSuccess()              │
  │                                │  ←─┘    ├─ 启动重连器            │
  │                                │          └─ callback.onConnected()│
  │  ←─ callback.onConnected()     │                                  │
  │                                │                                  │
  │ ④ subscribe(topics, qos)       │                                  │
  │                                │ ⑤ client.subscribe() ──────────→
  │                                │    │                             │
  │                                │    │ onSuccess()                 │
  │                                │  ←─┘                             │
  │                                │                                  │
  │                                │ ⑥ MqttCallback.messageArrived()  │
  │  ←─ callback.onMessageArrived()│  ←── Broker 推送消息 ────────── │
  │                                │                                  │
  │ ⑦ publish(topic, payload)      │                                  │
  │                                │ ⑧ client.publish() ────────────→
  │                                │    │                             │
  │                                │    │ onSuccess()                 │
  │                                │  ←─┘                             │
```

**断开与重连**：

```
  MqttManager.disconnect()
    ├─ 取消 PendingIntent 重连
    └─ client.disconnect()
          └─ MqttCallback.connectionLost()
                ├─ callback.onDisconnected()
                └─ 启动重连定时器 ──→ 定时 connect() 重试
```

### 2.2 模块流程图

展示 `mqtt/` 包内类与接口的依赖关系：

```
┌──────────────────────────────────────────────────────────────┐
│                       mqtt/ 模块                              │
│                                                              │
│  ┌────────────────┐           ┌───────────────────┐          │
│  │  MqttConfig    │──────────▶│  MqttManager      │          │
│  │ brokerUrl      │  注入      │                   │          │
│  │ clientId       │           │ + connect()       │──┐       │
│  │ username?      │           │ + disconnect()    │  │ 持有   │
│  │ password?      │           │ + subscribe()     │  │       │
│  │ keepAlive      │           │ + publish()       │  ▼       │
│  │ cleanSession   │           │ + isConnected()   │          │
│  │ connectionTimeOut│         │                   │  MqttAndroidClient
│  │ will*          │           └────────┬──────────┘          │
│  └────────────────┘                    │                     │
│                                        │ 持有               │
│                          ┌─────────────▼──────────┐          │
│                          │   MqttCallback          │          │
│                          │ + onConnected()         │          │
│                          │ + onDisconnected(cause) │          │
│                          │ + onMessageArrived(     │          │
│                          │     topic, payload)     │          │
│                          │ + onError(error)        │          │
│                          └─────────────────────────┘          │
│                                                              │
│  调用方                                                       │
│    │                                                         │
│    │ ① 构建 config                                            │
│    │ ② manager.connect(config, callback)                     │
│    │ ③ callback.onConnected() → subscribe(topic, qos)       │
│    │ ④ manager.publish(topic, payload)                       │
│    └ ⑤ manager.disconnect()                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. 运行流程

### 步骤 1 — 添加依赖与权限

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
<uses-permission android:name="android.permission.WAKE_LOCK" />

<service android:name="org.eclipse.paho.android.service.MqttService" />
```

### 步骤 2 — 编写配置类 `MqttConfig`

```kotlin
// MqttConfig.kt
package com.yuwjoo.myhome.modules.mqtt

data class MqttConfig(
    val brokerUrl: String,           // tcp://host:1883 或 ssl://host:8883
    val clientId: String,            // 客户端唯一标识
    val username: String? = null,    // 认证用户名
    val password: String? = null,    // 认证密码
    val keepAlive: Int = 60,         // 心跳间隔（秒）
    val cleanSession: Boolean = true, // 是否清除会话
    val connectionTimeout: Int = 30, // 连接超时（秒）
    val autoReconnect: Boolean = true, // 断线后自动重连
    val reconnectInterval: Long = 5000L, // 重连间隔（毫秒）
    val willTopic: String? = null,   // 遗嘱消息 topic
    val willPayload: String? = null, // 遗嘱消息内容
    val willQos: Int = 1,            // 遗嘱消息 QoS
    val willRetained: Boolean = false // 遗嘱消息是否保留
)
```

### 步骤 3 — 编写回调接口 `MqttCallback`

```kotlin
// MqttCallback.kt
package com.yuwjoo.myhome.modules.mqtt

interface MqttCallback {
    /**
     * 连接成功
     */
    fun onConnected()

    /**
     * 连接断开
     * @param cause 断开原因，主动 disconnect() 时传入 null
     */
    fun onDisconnected(cause: Throwable?)

    /**
     * 收到订阅消息
     * @param topic 消息主题
     * @param payload 消息内容（字符串）
     */
    fun onMessageArrived(topic: String, payload: String)

    /**
     * 异常
     * @param error 异常信息
     */
    fun onError(error: Throwable)
}
```

### 步骤 4 — 编写核心管理类 `MqttManager`

封装 `MqttAndroidClient` 的连接、订阅、发布、断开逻辑，内置自动重连：

```kotlin
// MqttManager.kt
package com.yuwjoo.myhome.modules.mqtt

import android.content.Context
import android.os.Handler
import android.os.Looper
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*

class MqttManager(private val context: Context) {

    private var client: MqttAndroidClient? = null
    private var callback: MqttCallback? = null
    private var config: MqttConfig? = null
    private val handler = Handler(Looper.getMainLooper())
    private var reconnectRunnable: Runnable? = null

    val isConnected: Boolean
        get() = client?.isConnected == true

    /**
     * 连接 MQTT Broker
     */
    fun connect(config: MqttConfig, callback: MqttCallback) {
        this.config = config
        this.callback = callback

        val mqttClient = MqttAndroidClient(context, config.brokerUrl, config.clientId)
        this.client = mqttClient

        mqttClient.setCallback(object : MqttCallbackExtended {
            override fun connectComplete(reconnect: Boolean, serverURI: String) {
                handler.post { callback.onConnected() }
            }

            override fun connectionLost(cause: Throwable?) {
                handler.post { callback.onDisconnected(cause) }
                if (config.autoReconnect) scheduleReconnect()
            }

            override fun messageArrived(topic: String?, message: MqttMessage?) {
                if (topic != null && message != null) {
                    handler.post {
                        callback.onMessageArrived(topic, String(message.payload))
                    }
                }
            }

            override fun deliveryComplete(token: IMqttDeliveryToken?) {}
        })

        val options = MqttConnectOptions().apply {
            userName = config.username
            password = config.password?.toCharArray()
            isCleanSession = config.cleanSession
            keepAliveInterval = config.keepAlive
            connectionTimeout = config.connectionTimeout
            isAutomaticReconnect = false // 手动控制重连

            // 遗嘱消息
            if (config.willTopic != null) {
                setWill(
                    config.willTopic,
                    config.willPayload?.toByteArray(),
                    config.willQos,
                    config.willRetained
                )
            }
        }

        mqttClient.connect(options, null, object : IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {}
            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                handler.post { callback.onError(exception ?: Exception("连接失败")) }
            }
        })
    }

    /**
     * 订阅主题
     */
    fun subscribe(topic: String, qos: Int = 1) {
        client?.subscribe(topic, qos, null, object : IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {}
            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                handler.post { callback?.onError(exception ?: Exception("订阅失败")) }
            }
        })
    }

    /**
     * 取消订阅
     */
    fun unsubscribe(topic: String) {
        client?.unsubscribe(topic, null, object : IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {}
            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {}
        })
    }

    /**
     * 发布消息
     */
    fun publish(topic: String, payload: String, qos: Int = 1, retained: Boolean = false) {
        client?.publish(topic, MqttMessage().apply {
            this.payload = payload.toByteArray()
            this.qos = qos
            this.isRetained = retained
        }, null, object : IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {}
            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                handler.post { callback?.onError(exception ?: Exception("发布失败")) }
            }
        })
    }

    /**
     * 断开连接（不触发自动重连）
     */
    fun disconnect() {
        cancelReconnect()
        try {
            client?.disconnect(null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    callback?.onDisconnected(null)
                }
                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {}
            })
        } catch (e: Exception) {
            // 已断开则不处理
        }
    }

    private fun scheduleReconnect() {
        cancelReconnect()
        val cfg = config ?: return
        reconnectRunnable = object : Runnable {
            override fun run() {
                if (client?.isConnected == true) return
                cfg.let { connect(it, callback ?: return) }
            }
        }
        handler.postDelayed(reconnectRunnable!!, config?.reconnectInterval ?: 5000L)
    }

    private fun cancelReconnect() {
        reconnectRunnable?.let { handler.removeCallbacks(it) }
        reconnectRunnable = null
    }
}
```

### 步骤 5 — 使用示例

```kotlin
// 初始化
val mqttManager = MqttManager(context)

val config = MqttConfig(
    brokerUrl = "tcp://broker.emqx.io:1883",
    clientId = "android-${System.currentTimeMillis()}",
    username = null,
    password = null,
    keepAlive = 60,
    cleanSession = true,
    autoReconnect = true,
    willTopic = "device/offline",
    willPayload = "{\"status\":\"offline\"}"
)

// 连接
mqttManager.connect(config, object : MqttCallback {
    override fun onConnected() {
        // 连接成功后订阅
        mqttManager.subscribe("home/+/control", qos = 1)
        mqttManager.subscribe("home/broadcast", qos = 0)
    }

    override fun onDisconnected(cause: Throwable?) {
        // 连接断开处理
    }

    override fun onMessageArrived(topic: String, payload: String) {
        // 处理收到的消息
        when (topic) {
            "home/light/control" -> handleLightControl(payload)
        }
    }

    override fun onError(error: Throwable) {
        // 异常处理
        Log.e("MQTT", "Error: ${error.message}")
    }
})

// 发布消息
mqttManager.publish("home/light/status", """{"status":"on"}""")
mqttManager.publish("sensor/temperature", "25.6", qos = 0)

// 断开
mqttManager.disconnect()
```

---

## 4. 目录结构（建议）

```
app/src/main/java/com/yuwjoo/myhome/modules/mqtt/
├── DESIGN.md           ← 本文档
├── MqttConfig.kt       ← 连接配置数据类（broker、认证、遗嘱消息等）
├── MqttCallback.kt     ← 回调接口（onConnected / onDisconnected / onMessageArrived / onError）
└── MqttManager.kt      ← 核心管理类（connect / subscribe / publish / disconnect + 自动重连）
```

---

## 5. 总结

| 要点 | 说明 |
|------|------|
| 核心库 | `MqttAndroidClient`（Eclipse Paho Android Service） |
| 配置 | `MqttConfig` 数据类统一管理 broker、认证、遗嘱消息、重连策略 |
| 回调 | `MqttCallback` 接口：连接成功/断开、消息到达、异常 |
| 自动重连 | `scheduleReconnect()` 通过 `Handler.postDelayed` 定时重试 |
| 遗嘱消息 | `MqttConnectOptions.setWill()` 在意外断线时自动发布 |
| QoS | 连接默认 `qos=1`（至少一次），支持发布/订阅时按 topic 指定 |
| 线程安全 | 回调通过 `Handler(Looper.getMainLooper())` 切换到主线程 |
| 清理 | `disconnect()` 前调用 `cancelReconnect()` 取消重连定时器 |
| 新增功能 | 扩展 `MqttCallback` 接口 + 在调用方注册新回调即可 |
