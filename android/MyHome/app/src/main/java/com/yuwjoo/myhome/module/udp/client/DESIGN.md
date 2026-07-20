# UdpClient 重构设计

## 目标

基于最新 [UDP 协议规范](../doc/UDP协议规范.md) 重构 `client/` 模块，对齐帧格式、序号机制、Ack 语义和 Call/Answer 交互逻辑。

---

## 模块划分

```
client/
├── UdpClient.kt            # 统一入口，组合子模块，暴露 connect/disconnect/send/监听 API
├── SocketManager.kt        # Socket 生命周期：MulticastSocket 创建/销毁、三种发送模式、本机 IP 收集
├── Receiver.kt             # 接收协程：循环 receive → 自收过滤 → 解码 → 路由
├── FrameCodec.kt           # 帧编解码：encode（10 字节帧头+Payload+CRC）、decode（校验+解析）
├── MessageRouter.kt        # 消息路由：按 Type 分发 → 有序序号校验/Ack 回复
├── HeartbeatEngine.kt      # 心跳引擎：定时广播 Heartbeat + 离线超时检测
├── AckEngine.kt            # Ack 引擎：有序消息注册 → 指数退避重传 → 超时回调
├── RetryPolicy.kt          # 重试策略：首超时间、最大次数、退避倍数
├── DeviceRegistry.kt       # 设备注册表：CRUD、在线状态、latestSeq/heartbeatInterval/heartbeatTimeout
├── SeqManager.kt           # 序号管理：按主机号维护对端有序序号，严格递增校验
├── NetworkMonitor.kt       # 网络监听：WiFi 状态变化 → 断线重连
└── ClientConfig.kt         # 配置聚合：协议常量、帧头参数、心跳/Ack/重试配置
```

---

## 协议对齐要点

### 帧头布局（10 字节，无 Version）

```
[0-1]   Magic    uint16  = 0x5948
[2]     Type     uint8
[3-4]   SeqNum   uint16  (大端序)
[5]     Flags    uint8   bit0 = Ordered
[6-7]   PayLen   uint16  (大端序)
[8-9]   CRC16    uint16  (大端序)
[10..]  Payload  N bytes
```

CRC 校验范围 = Magic[2] + Type[1] + SeqNum[2] + Flags[1] + PayLen[2] + Payload[N]（共 8 + N 字节）。

### 标志位

| Bit | 名称 | 说明 |
|:---:|------|------|
| 0 | **Ordered** | `0` 无序（立即发送，并行，不保证送达）；`1` 有序（逐条等 Ack，不丢不重） |
| 1-7 | 保留 | 必须为 0 |

> **不再有 NEED_ACK 标志**。Ordered=1 隐含需要 Ack，无需显式指定。

### 序号机制（按主机号分组）

- 主机号 = IP 最后一字节（0-255），用于 SeqManager 的 key
- 每个客户端按对方主机号维护"已处理的最新有序序号"（初始=0）
- 序号通过 Call/Answer 的 `latestSeq` 字段交换初始化
- 发送方以对方给的 `latestSeq + 1` 为起始序号
- 有序：逐条发送等 Ack，接收方只接受 `seq == 本地记录+1`；`seq < 记录+1` 丢弃并回 Ack；`seq > 记录+1` 不做任何处理
- 无序：`seq = 0`，立即发送可并行，不做序号校验不回复 Ack

### Ack 格式（4 字节）

```
[0-1] AckSeq     uint16  被确认的消息序号
[2-3] CurrentSeq uint16  接收方处理后的最新有序序号
```

---

## 模块详细设计

### ClientConfig

**变更**：
- 移除 `VERSION`（协议无 Version 字段）
- `HEADER_SIZE` = 10（无 Version，CRC 内嵌帧头）
- `CRC_SIZE` 移除（CRC 已含在 HEADER_SIZE 内，不再另算）
- `ACK_PAYLOAD_SIZE` = 4
- `Flags` 仅保留 `NONE = 0x00`、`ORDERED = 0x01`，移除 `NEED_ACK`
- `DEVICE_NAME`（设备名）和 `DEVICE_ABILITIES`（能力列表）保留
- 新增 `DEFAULT_HEARTBEAT_INTERVAL = 1500L`、`DEFAULT_HEARTBEAT_TIMEOUT = 4500L` 作为设备信息默认值

### FrameData

**变更**：
- 移除 `version` 字段
- 移除 `isAckRequired` 属性（Ordered 即需 Ack）
- `isOrdered`：检查 `flags & 0x01`

### FrameCodec

**encode()**：
- 输出格式：`[Magic 2][Type 1][SeqNum 2][Flags 1][PayLen 2][Payload N][CRC 2]`
- 帧头 10 字节，CRC 写入帧尾（算在 HEADER_SIZE 内）

**decode()**：
- 魔数不匹配 → 返回 null
- 帧长度不足 → 返回 null
- CRC 不匹配 → 返回 null
- 返回 `FrameData(type, seqNum, flags, payload)`

### SeqManager

**核心变更**——从 Set 去重改为严格递增校验：

```
数据结构：
- recvSeqs: ConcurrentHashMap<Int, Int>  // hostId -> 本机已从该主机接收的最大序号
- sendSeqs: ConcurrentHashMap<Int, Int>  // hostId -> 本机已发给该主机的最大序号

方法:
  getRecvSeq(hostId): Int          // 获取本机接收记录
  initSendSeq(hostId, latestSeq)   // Call/Answer 交换时，用对端的起始序号初始化 sendSeqs（不写 recvSeqs）
  tryConsume(hostId, seq): Result  // 消费校验（uint16 回绕安全）:
    gap = (expected - seq) & 0xFFFF
    gap == 0                       → ACCEPTED (recv++）
    gap in 1..0x7FFF               → DISCARD_BUT_ACK（重复）
    gap > 0x7FFF                   → DISCARD_NO_ACK（跳号）
  nextSendSeq(hostId): Int         // sendSeqs 递增后返回（uint16 回绕：0xFFFF + 1 → 0）
  clear(hostId)                    // 清理
  reset()                          // 重置全部
```

**关键点**：
- Key 是主机号（IP 最后一字节，`Int`），不是完整 IP 字符串
- 不再维护无序消息序号（无序消息始终 seq=0，不经过此模块）

### MessageRouter

**handleHeartbeat**：
1. 检查 DeviceRegistry 是否有该 IP 记录
2. 无记录 → 发送 Call（单播，载荷含本机设备信息 + `latestSeq`=本机记录的该主机有序序号），携带 `heartbeatInterval` 和 `heartbeatTimeout`
3. 有记录 → 仅更新心跳时间
4. **不回复 Ack**（心跳是无序消息）

**handleCall**：
1. 解析 `deviceName`、`abilities`、`latestSeq`、`heartbeatInterval`、`heartbeatTimeout`
2. 注册/更新设备信息到 DeviceRegistry（含心跳参数）
3. 用 `latestSeq` 初始化 SeqManager 中该主机号的记录
4. 回复 Answer（带本机设备信息 + 本机记录的该主机的 `latestSeq` + 心跳参数）
5. **不回复 Ack**（Call 是无序消息）

**handleAnswer**：
1. 解析设备信息（同 Call）
2. 注册/更新 DeviceRegistry
3. 用 `latestSeq` 初始化 SeqManager 中该主机号的记录
4. **不回复 Ack**（Answer 是无序消息）

**handleAck**：
1. 解析 4 字节 Payload → `ackSeq`（uint16）+ `currentSeq`（uint16）
2. 通知 AckEngine 确认 `ackSeq`
3. 用 `currentSeq` 同步 SeqManager 中该主机号的最新增序号

**handleJson / handleRaw**：
1. 判断 `isOrdered`
2. **无序**：直接回调上层，不回复 Ack
3. **有序**：调用 `SeqManager.tryConsume(hostId, seq)`
   - `ACCEPTED` → 回调上层 → 回复 Ack(seq, 新 record)
   - `DISCARD_BUT_ACK` → 丢弃 → 回复 Ack(seq, 当前 record)
   - `DISCARD_NO_ACK` → 不做任何处理
4. 有序消息回调上层前不校验去重——协议保证只要 seq==record+1 就是期望的下一条

**replyAck**：
- 仅 Ordered 消息消费后调用
- Ack payload 格式：`[AckSeq uint16 BE][CurrentSeq uint16 BE]`
- CurrentSeq = SeqManager 中该主机的当前最新 record

### DeviceRegistry & LanDevice

**LanDevice 新增字段**：
```
heartbeatInterval: Long   // 心跳间隔（ms），0 表示不发送心跳
heartbeatTimeout: Long    // 心跳过期间隔（ms）
```

**register() 变更**：
- 接收并存储 `heartbeatInterval: Long`、`heartbeatTimeout: Long`
- `detectOffline()` 使用设备自身的 `heartbeatTimeout`（而非全局固定值），若设备未设置则回退到全局默认

**buildLocalDevicePayload() 变更**：
```json
{
  "deviceName": "...",
  "abilities": [...],
  "latestSeq": 42,
  "heartbeatInterval": 1500,
  "heartbeatTimeout": 4500
}
```
- 新增 `heartbeatInterval`、`heartbeatTimeout`
- 移除 `online` 字段（心跳即代表在线，不需要在 JSON 中传递）

### UdpClient

**send() 接口变更**：
```
// 旧
fun send(type, payload, targetIp?, ordered, needAck): Boolean

// 新
fun send(type, payload, targetIp?, ordered): Boolean
```
- 移除 `needAck` 参数（Ordered 即需 Ack）

**sendUnicast 内部逻辑变更**：
- 有序：`seqNum = nextSendSeq(hostId)`，`flags = ORDERED`，注册 Ack
- 无序：`seqNum = 0`，`flags = NONE`，不注册 Ack

**sendHeartbeat / discoverDevices / sendBroadcast**：
- 全部使用 `seqNum = 0`、`flags = NONE`

**sendHeartbeat**：
- 心跳包由各设备自身决定间隔（本机用全局默认），接收方根据设备返回的 `heartbeatInterval`/`heartbeatTimeout` 判断

### HeartbeatEngine

**无结构性变更**。心跳始终使用 `seq=0, flags=NONE` 广播，不参与 Ack/序号机制。

离线检测仍由 `DeviceRegistry.detectOffline()` 处理，使用设备各自的 `heartbeatTimeout`。

### AckEngine

**注册逻辑变更**：
- Key 使用主机号 `hostId: Int`（而非 IP 字符串），与 SeqManager 一致
- 内部维护 `Pair<hostId, seqNum>` → 重传信息的映射

**Ack 处理变更**：
- `onAck(hostId, seqNum)` 确认消息后，通知外层更新 SeqManager 的发送侧记录

### RetryPolicy

无结构性变更。配置值对应对齐协议常量表。

### SocketManager

无结构性变更。三种发送模式（单播/组播/广播）保持不变。

### Receiver

无结构性变更。接收循环 → 自收过滤 → 校验 → 解码 → 路由的管道不变。

### NetworkMonitor

无结构性变更。WiFi 状态监听逻辑不变。

---

## 依赖关系

```
UdpClient（顶层，对外 API）
  ├── SocketManager         ← 创建/销毁 Socket
  ├── Receiver              ← 读协程，输出原始字节
  │     └── FrameCodec      ← 字节→帧
  ├── MessageRouter         ← 帧→业务分发
  │     ├── DeviceRegistry  ← 管理设备（含 Seq、心跳参数）
  │     ├── SeqManager      ← 有序序号消费校验（按主机号）
  │     └── AckEngine       ← 有序消息重传
  │           └── RetryPolicy  ← 重试策略
  ├── HeartbeatEngine       ← 依赖 SocketManager（发送）+ DeviceRegistry（检测）
  └── NetworkMonitor        ← 网络变化→重连
```

---

## 与旧代码的主要差异

| 维度 | 旧 | 新 |
|------|-----|-----|
| **帧头** | 含 Version，HEADER_SIZE=9，CRC 帧尾 | 无 Version，HEADER_SIZE=10（含 CRC） |
| **Flags** | NEED_ACK + ORDERED 两个独立位 | 仅 bit0=Ordered，隐含 Ack |
| **Ack 负载** | 2 字节（只有 AckSeq） | 4 字节（AckSeq + CurrentSeq） |
| **序号去重** | `Set<Int>` 集合去重 | 严格递增校验 `seq == record+1` |
| **序号 Key** | 完整 IP 字符串 | 主机号（IP 末字节 Int） |
| **设备信息** | 缺少 heartbeatInterval/heartbeatTimeout | 包含心跳参数 |
| **Call/Answer** | 未交换 latestSeq | 交换 latestSeq 初始化序号 |
| **send()** | `ordered` + `needAck` 分离 | 仅 `ordered` |
