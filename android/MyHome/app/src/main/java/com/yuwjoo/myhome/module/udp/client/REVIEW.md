# 代码 Review 顺序

## 第一层：协议基础（无内部依赖）

| 顺序 | 文件 | 关注点 |
|------|------|--------|
| 1 | `ClientConfig.kt` | 协议常量、帧头布局、hostId 计算 |
| 2 | `FrameCodec.kt` | 10 字节帧头编解码、CRC 内嵌、FrameData 结构 |

## 第二层：独立策略与工具（无内部依赖）

| 顺序 | 文件 | 关注点 |
|------|------|--------|
| 4 | `SeqManager.kt` | 严格递增校验 `tryConsume()`，按 hostId 分桶 |
| 5 | `RetryPolicy.kt` | 退避重试策略 |

## 第三层：基础设施（依赖 ClientConfig）

| 顺序 | 文件 | 关注点 |
|------|------|--------|
| 6 | `SocketManager.kt` | Socket 生命周期、组播/单播/广播发送、本机 IP 自收过滤 |
| 7 | `NetworkMonitor.kt` | WiFi 状态监听、断网恢复触发 |
| 8 | `Receiver.kt` | 阻塞接收循环、自收过滤、路由到 MessageRouter |

## 第四层：业务引擎（依赖上述模块）

| 顺序 | 文件 | 关注点 |
|------|------|--------|
| 9 | `AckEngine.kt` | hostId-keyed 超时重传 |
| 10 | `HeartbeatEngine.kt` | 定时心跳广播 |
| 11 | `DeviceRegistry.kt` | 设备注册、hostId 路由、离线检测（设备自有超时） |

## 第五层：核心路由

| 顺序 | 文件 | 关注点 |
|------|------|--------|
| 12 | `MessageRouter.kt` | 有序三路分支、Call/Answer 交换 latestSeq、Ack 4 字节负载 |

## 第六层：门面入口

| 顺序 | 文件 | 关注点 |
|------|------|--------|
| 13 | `UdpClient.kt` | 统一对外接口、send()/connect()/disconnect()、设备回调 |

---

> 按此顺序自上而下阅读，每层读完即掌握其依赖的下层，无需跳转未读文件。
