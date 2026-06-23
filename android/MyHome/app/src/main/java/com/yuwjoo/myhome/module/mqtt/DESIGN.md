# MQTT 模块设计文档

## 1. 简介

MQTT 模块基于 **Eclipse Paho**（`org.eclipse.paho.client.mqttv3`）封装，为 Android 应用提供与 MQTT Broker 的双向通信能力。

核心特性：

- **单例入口**：`MqttManager` 是 Kotlin `object`，全局唯一，上层直接通过 `MqttManager.xxx()` 调用
- **自动重连**：利用 Paho 内置 `isAutomaticReconnect = true`，断线后自动恢复连接
- **缓存会话**：`cleanSession = false`，Broker 记住订阅关系，重连后无需重新订阅
- **线程调度**：所有网络操作在 IO 单线程执行，消息回调切换到主线程分发
- **遗嘱消息**：客户端异常断线时，Broker 自动发布遗嘱消息通知设备离线
- **职责分离**：`MqttCore` 封装 Paho 原生操作，`MqttManager` 管理回调注册与线程调度

---

## 2. API 说明

模块对外暴露的唯一入口是 `MqttManager`（Kotlin object）。

### 2.1 连接管理

```kotlin
// 连接 Broker（通常在 Application.onCreate() 中调用）
MqttManager.connect()

// 断开连接
MqttManager.disconnect()

// 查询连接状态
if (MqttManager.isConnected) { ... }
```

### 2.2 订阅主题

```kotlin
// 订阅主题并注册回调
MqttManager.subscribe(
    topic = MqttTopics.TOPIC_TEMP_HUMID,
    qos = 0,
    callback = object : TopicCallback {
        override fun onMessageArrived(topic: String, payload: String) {
            // 收到消息，已在主线程
            updateUI(payload)
        }
    }
)
```

> 同一主题可注册多个回调。缓存会话下，重连后 Broker 自动推送消息，无需重新订阅。

### 2.3 取消订阅

```kotlin
// 移除特定回调（同主题有其他回调时不会真正取消订阅）
MqttManager.unsubscribe(topic, callback)

// 移除该主题的全部回调并取消订阅
MqttManager.unsubscribe(topic)
```

### 2.4 发布消息

```kotlin
// 发布消息（默认 QoS 1）
MqttManager.publish(
    topic = MqttTopics.TOPIC_AC_RC,
    payload = """{"action":"togglePower"}"""
)

// 带全部参数
MqttManager.publish(
    topic = "...",
    payload = "...",
    qos = 2,
    retained = true
)
```

---

## 3. 目录结构

```
mqtt/
├── DESIGN.md               ← 本文档
├── MqttManager.kt          ← [单例] 应用层唯一入口，管理连接与回调分发
├── MqttCore.kt             ← [类] Paho MqttClient 封装，提供同步网络操作
├── MqttCoreCallback.kt     ← [接口] MqttCore 内部回调，通知连接状态与消息到达
├── TopicCallback.kt        ← [接口] 主题级回调，供 subscribe() 注册
└── MqttConfig.kt           ← [内部对象] 连接参数常量，仅 MqttCore 使用
```

---

## 4. 模块结构

```
┌─────────────────────────────────────────────────────────────────┐
│                         外部调用方                                │
│   MyApplication   MainActivity   TempHumidSensor   BedroomAC    │
│        │               │               │               │        │
│        └───────────────┴───────┬───────┴───────────────┘        │
│                                │                                 │
│                  直接调用 MqttManager (object)                     │
│                                │                                 │
├────────────────────────────────┼─────────────────────────────────┤
│                          mqtt 模块                               │
│                                │                                 │
│                        ┌───────▼──────────┐                      │
│                        │   MqttManager    │  object (单例)        │
│                        │                  │                      │
│                        │ - mqttCore       │── owns ─────────┐    │
│                        │ - topicCallbacks │  Map<topic,[...]│    │
│                        │ - handler        │  main looper    │    │
│                        │ - ioExecutor     │  single thread  │    │
│                        │                  │                 │    │
│                        │ + connect()      │                 │    │
│                        │ + disconnect()   │                 │    │
│                        │ + subscribe()    │                 │    │
│                        │ + unsubscribe()  │                 │    │
│                        │ + publish()      │                 │    │
│                        │ + isConnected    │                 │    │
│                        └──┬───────────────┘                 │    │
│                           │                                 │    │
│              ┌────────────┼────────────┐                    │    │
│              │            │            │                    │    │
│              ▼            ▼            ▼                    │    │
│     ┌────────────┐ ┌───────────┐ ┌───────────┐             │    │
│     │TopicCallback│ │MqttCoreC- │ │  Handler  │             │    │
│     │ (interface) │ │allback    │ │  (main)   │             │    │
│     │             │ │(interface)│ │           │             │    │
│     │+onMessage-  │ │           │ │           │             │    │
│     │ Arrived()   │ │+onConnect-│ │           │             │    │
│     │             │ │ ionChanged│ │           │             │    │
│     └────────────┘ │+onMessage-│ └───────────┘             │    │
│                    │ Arrived() │                            │    │
│                    └─────┬─────┘                            │    │
│                          │                                  │    │
│                ┌─────────▼──────────┐                       │    │
│                │     MqttCore       │  class                │    │
│                │                    │                       │    │
│                │ - client: Mqtt-    │── wraps ── Paho       │    │
│                │   Client (Paho)    │           MqttClient  │    │
│                │ - callback: Mqtt-  │                       │    │
│                │   CoreCallback     │                       │    │
│                │                    │                       │    │
│                │ + connect()        │                       │    │
│                │ + disconnect()     │                       │    │
│                │ + subscribe()      │                       │    │
│                │ + unsubscribe()    │                       │    │
│                │ + publish()        │                       │    │
│                │ + isConnected      │                       │    │
│                └────────┬───────────┘                       │    │
│                         │                                   │    │
│                         │ 读取配置                            │    │
│                         ▼                                   │    │
│                ┌─────────────────┐                          │    │
│                │  MqttConfig     │  internal object         │    │
│                │                 │                          │    │
│                │ BROKER_URL      │                          │    │
│                │ USERNAME, PASS- │                          │    │
│                │ WORD            │                          │    │
│                │ KEEP_ALIVE      │                          │    │
│                │ CLEAN_SESSION   │                          │    │
│                │ AUTOMATIC_REC-  │                          │    │
│                │ ONNECT          │                          │    │
│                │ MAX_RECONNECT-  │                          │    │
│                │ DELAY           │                          │    │
│                │ WILL_*          │                          │    │
│                │ clientId()      │                          │    │
│                └─────────────────┘                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 关系说明

| 关系 | 描述 |
|------|------|
| 调用方 → `MqttManager` | 直接调用静态方法，无中间层 |
| `MqttManager` → `MqttCore` | 持有引用（`private var mqttCore: MqttCore?`），负责创建和销毁 |
| `MqttManager` → `MqttCoreCallback` | 匿名内部类实现，接收 `MqttCore` 的事件回调 |
| `MqttManager` → `TopicCallback` | 管理 `topicCallbacks` 注册表，消息到达时分发 |
| `MqttManager` → `Handler` | 主线程 Handler，将消息回调切到主线程 |
| `MqttCore` → Paho `MqttClient` | 封装 Paho 原生客户端，薄封装层 |
| `MqttCore` → `MqttConfig` | 读取连接配置常量 |
| `MqttCore` → `MqttCoreCallback` | 构造函数注入，事件发生时回调 |

### 数据流

```
                    publish                subscribe            message arrived
调用方 ──────────────────► MqttManager ────────────────► MqttCore ──► Broker
                               ▲                              │
                               │   ioExecutor.execute { }     │
                               │                              │
                           [IO 线程]                      [IO 线程]
                                                             │
                                                     MqttCoreCallback
                                                     .onMessageArrived()
                                                             │
                                                      handler.post {
                                                         topicCallbacks[topic]
                                                         ?.forEach {
                                                             it.onMessageArrived()
                                                         }
                                                      }
                                                             │
                                                         [主线程]
                                                             │
                                                             ▼
                                                          调用方
```
