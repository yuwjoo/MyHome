---
name: udp-client-coroutine-thread-safety
overview: 分三步改造 UDP Client 模块：1) 去除所有现有并发处理代码（ConcurrentHashMap、@Volatile、@Synchronized、AtomicBoolean）；2) 通过 limitedParallelism(1) 单线程调度器 + withContext 实现协程串行化线程安全；3) 整体代码检查。
todos:
  - id: step1-remove-concurrency
    content: 第一步：去除所有现有并发处理代码。修改 DeviceRegistry（ConcurrentHashMap→HashMap）、SeqManager（ConcurrentHashMap→HashMap，merge/computeIfPresent→普通读写）、AckEngine（ConcurrentHashMap→HashMap，@Volatile全部去掉，seqAllocated→普通Boolean）、HeartbeatEngine（ConcurrentHashMap→HashMap）、UdpSocket（@Volatile去掉，mutableSetOf保留）、SocketReader（AtomicBoolean→Boolean）、NetworkMonitor（@Volatile去掉）、UdpClient（@Volatile去掉，@Synchronized去掉）
    status: completed
  - id: step2-add-dispatcher
    content: 第二步：新增 config/UdpDispatcher.kt 调度器定义，并在各文件入口点加 withContext 串行化。SocketReader 收帧处理加 withContext；HeartbeatEngine scope 切换为 UdpDispatcher；AckEngine scope 切换为 UdpDispatcher；UdpClient send/connect/disconnect 改为 suspend fun 加 withContext；NetworkMonitor 回调加 withContext
    status: completed
    dependencies:
      - step1-remove-concurrency
  - id: step3-review
    content: 第三步：整体代码审查。逐一检查每个改动文件，确认所有共享状态访问路径都经过 UdpDispatcher 串行化、无阻塞调用在受限调度器上、无遗漏的并发入口、delay 挂起不会阻塞调度器、LanDevice 确认无需改动
    status: completed
    dependencies:
      - step2-add-dispatcher
---

## 用户需求

按三步流程对 UDP Client 模块进行协程线程安全改造：

1. **第一步：去除所有现有并发处理代码** — 将 `ConcurrentHashMap` 替换为普通 `HashMap`，移除所有 `@Volatile`、`@Synchronized`、`AtomicBoolean` 等线程安全标记和工具，回归为无并发保护的普通代码。
2. **第二步：引入协程单线程调度器方案** — 新增 `Dispatchers.IO.limitedParallelism(1)` 统一调度器，所有操作共享状态的代码路径通过 `withContext` 切换到该调度器上串行执行。UdpSocket 的阻塞 `receive()` 保持在自由 IO 线程，收帧后在 `withContext` 内处理；`delay()` 是挂起函数不阻塞，可直接放在受限调度器上运行。对外 API 改为 `suspend` 函数。
3. **第三步：整体代码审查** — 逐一检查每个改动文件，确认无遗漏的并发路径、无不合理的 `delay()` 阻塞、无不正确的 `withContext` 包裹位置。

## 改造范围

涉及修改 10 个文件，不删除任何文件，不改变任何类结构和类名：
- `UdpClient.kt` — 主入口
- `device/DeviceRegistry.kt` — 设备注册表
- `device/SeqManager.kt` — 序号管理器
- `engine/AckEngine.kt` — ACK 确认引擎
- `engine/HeartbeatEngine.kt` — 心跳引擎
- `transport/UdpSocket.kt` — UDP Socket
- `transport/SocketReader.kt` — 帧读取器
- `transport/NetworkMonitor.kt` — 网络监听器
- `model/LanDevice.kt` — 设备模型（仅确认无需改）
- 新增 `config/UdpDispatcher.kt` — 调度器定义

## 技术方案

### 核心原理

使用 `Dispatchers.IO.limitedParallelism(1)` 创建一个单线程调度器，保证同一时刻最多只有一个协程在该调度器上执行。由于 `delay()` 是挂起函数（不阻塞线程），挂起时调度器自动调度下一个就绪协程，实现无锁的串行化并发。

```kotlin
// 新增 config/UdpDispatcher.kt
internal val UdpDispatcher = Dispatchers.IO.limitedParallelism(1)
```

### 改造模式

所有操作共享状态的入口点用 `withContext(UdpDispatcher)` 包裹：

- **SocketReader 帧处理**：`receive()` 阻塞在自由 IO，收帧后 `withContext(UdpDispatcher)` 处理
- **HeartbeatEngine 心跳循环**：整个协程 scope 使用 `UdpDispatcher`，`delay()` 挂起时让出
- **AckEngine 发送协程**：scope 使用 `UdpDispatcher`
- **UdpClient.send/connect/disconnect**：方法体用 `withContext(UdpDispatcher)` 包裹
- **NetworkMonitor 回调**：防抖 `delay` 后在 `withContext(UdpDispatcher)` 内回调

```
自由IO线程                  UdpDispatcher（单线程串行）
───────                    ────────────────────────
UdpSocket.receive()        → withContext → router.dispatch()
                            → DeviceRegistry.markOnline()
                            → SeqManager.tryConsume()
                            → HeartbeatEngine.send/detect
                            → AckEngine.run() (含delay)
                            → UdpClient.send()
                            → NetworkMonitor.callback()
```

### 关键改造点

**1. 阻塞 I/O 不被串行化**
`UdpSocket.receive()` 是阻塞调用，必须跑在自由 `Dispatchers.IO` 上。`SocketReader` 的接收循环使用自由 IO，仅在 `handlePacket()` 内切换到 `UdpDispatcher`。

**2. delay() 不阻塞调度器**
`delay()` 是挂起函数，协程挂起时 `UdpDispatcher` 会调度其他就绪协程执行。因此 `HeartbeatEngine` 的 `while(isActive) { send(); detect(); delay(3000) }` 和 `AckEngine` 的 `waitForAck()` 中的 `delay(50)` 都可以安全放在受限调度器上。

**3. 去掉 ConcurrentHashMap 不影响正确性**
由于所有对 HashMap 的读写都串行化在 `UdpDispatcher` 上，普通 `HashMap` 完全安全。`SeqManager.tryConsume()` 中之前的非原子 read-modify-write 也因为串行执行而天然原子。

**4. 对外 API 改为 suspend**
`UdpClient.send()`、`connect()`、`disconnect()` 改为 `suspend fun`，内部用 `withContext(UdpDispatcher)` 包裹。调用方如果是协程，天然适配；非协程调用方用 `runBlocking` 桥接。
