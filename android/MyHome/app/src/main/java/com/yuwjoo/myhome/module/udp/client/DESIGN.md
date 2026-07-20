# UdpClient 重构设计

## 目标

将当前分散在 `UdpClient`、`HeartbeatManager`、`AckManager`、`DeviceManager`、`MessageDispatcher`、`SeqTracker` 中的职责重新整合为职责清晰的内聚模块，全部收敛到 `client/` 目录下，对外由统一的 `UdpClient` 入口暴露。

---

## 模块划分

```
client/
├── UdpClient.kt            # 统一入口，组合所有子模块，暴露连接/断开/发送/监听 API
├── SocketManager.kt        # Socket 生命周期管理：创建 MulticastSocket、加入/离开组播组、发送三模式
├── Receiver.kt            # 接收循环：线程模型、阻塞 read、自收过滤、异常重连
├── PacketValidator.kt     # 数据包校验：魔数匹配、CRC16 校验、帧长度校验、版本检查
├── FrameCodec.kt          # 帧编解码：encode（组帧+CRC）、decode（解帧+校验）
├── MessageRouter.kt       # 消息路由：按 type 分发到各 Handler（心跳/Call/Answer/Ack/JSON/RAW）
├── HeartbeatEngine.kt     # 心跳引擎：定时广播心跳包、超时检测离线设备
├── AckEngine.kt           # ACK 引擎：待确认消息注册、指数退避重传、超时放弃
├── RetryPolicy.kt         # 重试策略：首超时间、最大重试次数、退避倍数计算
├── DeviceRegistry.kt      # 设备注册表：设备 CRUD、在线状态管理、心跳时间更新
├── SeqManager.kt          # 序号管理：按 IP 维护双向序号、去重校验、有序消费
├── NetworkMonitor.kt      # 网络监听：WiFi 状态变化、断线重连触发
└── UdpConfig.kt           # 配置聚合：网络参数、帧头参数、心跳/Ack/重试配置、消息类型
```

---

## 模块职责简述

### UdpClient（统一入口）
- 持有所有子模块实例
- 对外暴露 `connect()` / `disconnect()` / `send()` / 各类 Listener 注册
- 内部编排子模块的启动/停止顺序

### SocketManager（Socket 管理）
- 创建 `MulticastSocket`，配置广播模式、环回、超时
- `joinGroup()` / `leaveGroup()`
- 提供 `sendUnicast()` / `sendMulticast()` / `sendBroadcast()` 三种发送
- 收集本机 IP 用于接收端自收过滤

### Receiver（接收器）
- 独立的接收线程，循环 `DatagramSocket.receive()`
- 过滤来自本机 IP 的广播包（自收）
- 将原始字节移交 PacketValidator
- 负责接收异常时的重连通知

### PacketValidator（包校验）
- 魔数校验（0x59 0x48）
- CRC16 完整性校验
- 帧长度校验（payload 长度是否与实际数据匹配）
- 无效帧静默丢弃

### FrameCodec（帧编解码）
- `encode()`：将 type / seqNum / flags / payload 组装为完整帧字节（含 CRC）
- `decode()`：从原始字节解析出 FrameData（version / type / seqNum / flags / payload）
- 可直接复用现有 `UdpFrame` 逻辑

### MessageRouter（消息路由）
- 根据 `FrameData.type` 分发到对应 Handler
- Handler 映射：HEARTBEAT → 通知 DeviceRegistry | CALL → 回复设备信息 | ANSWER → 记录设备 | ACK → 通知 AckEngine + SeqManager | JSON → 通知原始消息监听器（由上层负责 Topic 解析）| RAW → 通知原始消息监听器

### HeartbeatEngine（心跳引擎）
- 定时（1.5s）通过 SocketManager 广播心跳包
- 定时检测设备最后心跳时间，超时（4.5s）标记离线
- 使用协程定时器替代 `Thread.sleep` 循环

### AckEngine（ACK 引擎）
- 发送需确认消息时注册待确认条目
- 收到 Ack 时移除对应条目
- 未收到 Ack 则按重试策略定时重传
- 超过最大重试次数后回调失败通知

### RetryPolicy（重试策略）
- 首次重传等待时间（150ms）
- 最大重试次数（5）
- 指数退避计算：`waitMs * 2`，上限 5s
- 纯数据类，被 AckEngine 引用

### DeviceRegistry（设备注册表）
- `ConcurrentHashMap<IP, LanDevice>` 存储设备信息
- 增/删/改/查设备
- 更新心跳时间、在线状态
- 标记全部离线
- 变更时通知 DeviceListener 列表

### SeqManager（序号管理）
- `ConcurrentHashMap<IP, Int>` 按对端维护序号
- `nextSeq(ip)`：递增并返回发送序号
- `check(ip, seqNum)`：消费方去重校验（重复/期望/超前）
- `initFromPeer(ip, seqNum)`：从对端 Ack 同步序号

### TopicBroker（主题代理）
- 维护 topic → Listener 映射
- 订阅/取消订阅/清空
- 收到 Topic 消息时分发给对应 Listener

### NetworkMonitor（网络监听）
- 注册系统 `ConnectivityManager.NetworkCallback`
- WiFi 断开 → 通知 UdpClient 断开连接
- WiFi 恢复 → 通知 UdpClient 重新连接
- 可直接复用现有 `NetworkMonitor` 逻辑

### UdpConfig（配置聚合）
- 网络参数：组播地址、端口、缓冲区大小
- 帧头参数：魔数、版本号、帧头长度
- 心跳参数：间隔、离线超时
- Ack 参数：首超、最大重试、退避倍数
- 消息类型 & 标志位常量

---

## 依赖关系

```
UdpClient（顶层，对外 API）
  ├── SocketManager         ← 创建/销毁 Socket
  ├── Receiver              ← 读线程，输出原始字节
  ├── PacketValidator + FrameCodec  ← Receiver 上游，字节→帧
  ├── MessageRouter         ← 帧→业务分发
  │     ├── DeviceRegistry  ← 心跳/Call/Answer 操作设备
  │     ├── AckEngine       ← 发送/接收 Ack
  │     │     └── RetryPolicy  ← 重试策略
  │     └── SeqManager      ← 序号校验
  ├── HeartbeatEngine       ← 依赖 SocketManager（发送）+ DeviceRegistry（检测）
  └── NetworkMonitor        ← 网络变化→重连
```

## 与旧代码的关系

- **不移动/修改现有文件**，在 `client/` 目录下全新编写
- `FrameCodec` 可以直接复用 `UdpFrame` 的逻辑（甚至直接转发调用）
- `NetworkMonitor` 可直接复用现有代码
- 重构完成后，旧文件逐步废弃
