# UDP 局域网消息模块设计文档

## 1. 简介

UDP 模块基于 `java.net.MulticastSocket` 封装，通过组播地址实现局域网设备发现与 Topic 消息通信。

核心特性：

- **Kotlin object 单例**：`UdpManager` 是 Kotlin `object`，直接通过 `UdpManager.xxx()` 调用
- **显式生命周期**：`connect()` 加入组播组开始监听，`disconnect()` 离开组播组释放资源（不再 auto-init）
- **组播接收**：接收基于 `MulticastSocket`，监听组播地址而非广播
- **线程安全**：回调列表使用 `CopyOnWriteArraySet`，支持多线程注册/移除
- **统一线程池**：发送操作在 IO 单线程执行器上运行，接收有独立 daemon 线程
- **超时恢复**：接收 Socket 设置 `soTimeout`，线程退出时由 `running` 标志安全终止

---

## 2. API 说明

### 2.1 连接管理

```kotlin
// 加入组播组并启动消息接收
UdpManager.connect()

// 离开组播组并释放所有资源
UdpManager.disconnect()
```

### 2.2 设备监听

```kotlin
// 注册设备变更监听
val listener = DeviceChangeListener { devices -> updateDeviceList(devices) }
UdpManager.registerDeviceListener(listener)

// 取消监听
UdpManager.unregisterDeviceListener(listener)
```

### 2.3 设备发现

```kotlin
// 广播扫描局域网设备（通过广播发送，设备通过组播应答）
UdpManager.scanDevices()

// 读取当前设备列表
val devices: List<UdpLocalDevice> = UdpManager.deviceList
```

### 2.4 主题操作

```kotlin
// 订阅主题
UdpManager.subscribe(
    topic = "YHHome/device/bedroomAC",
    callback = UdpTopicCallback { topic, payload -> updateUI(payload) }
)

// 取消订阅（移除特定回调）
UdpManager.unsubscribe(topic, callback)

// 取消订阅（移除该主题全部回调）
UdpManager.unsubscribe(topic)

// 发布消息（组播到组内所有节点）
UdpManager.publish("YHHome/RC/bedroomAC", JSONObject().apply { put("action", "powerOn") })

// 发布消息（单播到指定 IP）
UdpManager.publish("YHHome/RC/bedroomAC", payload, targetIp = "192.168.1.100")
```

---

## 3. 目录结构

```
udp/
├── DESIGN.md               ← 本文档
├── UdpManager.kt           ← [object] 应用层唯一入口，连接管理 + 设备发现 + 消息收发
├── UdpUtil.kt              ← [internal object] 底层网络工具（单播/组播/广播/接收/加入组）
├── TopicUtil.kt            ← [internal object] 主题消息工具（JSON 构造与解析）
├── UdpConfig.kt            ← [internal object] 端口/组播地址等配置常量
├── DeviceChangeListener.kt ← [fun interface] 设备变更监听器
├── UdpTopicCallback.kt     ← [fun interface] 主题级回调，供 subscribe() 注册
└── UdpLocalDevice.kt       ← [data class] 在线设备信息
```

---

## 4. 关系说明

| 关系 | 描述 |
|------|------|
| 调用方 → `UdpManager` | 直接调用 object 方法，`connect()` 后可用 |
| `UdpManager` → `UdpUtil` | 委托底层 socket 操作（joinGroup/leaveGroup/发送/接收） |
| `UdpManager` → `TopicUtil` | 委托消息 JSON 构造与解析 |
| `UdpManager` → `UdpConfig` | 读取端口、组播地址、扫描参数等配置常量 |
| `UdpManager` → `DeviceChangeListener` | 持有 `CopyOnWriteArraySet`，设备变化时回调 |
| `UdpManager` → `UdpTopicCallback` | 按 topic 管理，消息到达时精确分发 |
| `UdpManager` → `UdpLocalDevice` | `onlineDevices` 映射表的值类型 |

---

## 5. 数据流

```
   connect()             publish / scanDevices          subscribe
调用方 ──────► UdpManager ────────────────────────► UdpManager ─────────► 订阅回调
                │  joinMulticastGroup()                  │
                │  startReceive()               TopicUtil.build()
                ▼                                       │
        [组播组 224.0.0.100:8001]              UdpUtil.sendBroadcast()   ← scan
                                               UdpUtil.sendMulticast()   ← publish(默认)
                │                               UdpUtil.sendUnicast()    ← publish(targetIp)
                │                                       │
         [udp-recv 线程] ← UdpUtil.receive()            ▼
                │                              ┌─ 局域网广播 ──► 所有设备
        TopicUtil.parse()                      │
                │                              ├─ 组播组 ──► 组内节点
        handleMessage()                        │
                │                              └─ 单播 ──► 指定 IP
    ┌───────────┼───────────┐
    │                       │
TOPIC_DEVICE_ONLINE       else
    │                       │
handleDeviceOnline()   dispatchMessage()
    │                       │
DeviceChangeListener    UdpTopicCallback
.onDeviceChanged()     .onMessageArrived()
```

---

## 6. 消息格式

消息体为 JSON，结构固定为 `topic` + `data`：

```json
{"topic": "YHHome/device/bedroomAC", "data": {"status": "on"}}
```

内置 Topic：

| 内置 Topic | 方向 | 方式 | 用途 |
|---|---|---|---|
| `YHHome/scanDevices` | 客户端 → 广播 → 设备 | 广播 | 扫描局域网设备 |
| `YHHome/deviceOnline` | 设备 → 组播 → 客户端 | 组播 | 设备在线应答，携带设备信息 |
