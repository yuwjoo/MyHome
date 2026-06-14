# NativeBridge Web 端开发文档

## 目录

- [1. 简介](#1-简介)
- [2. 流程图](#2-流程图)
  - [2.1 业务流程图](#21-业务流程图)
  - [2.2 模块流程图](#22-模块流程图)
- [3. 运行流程](#3-运行流程)
- [4. 目录结构](#4-目录结构)
- [5. 总结](#5-总结)

---

## 1. 简介

NativeBridge 是 WebView 内 Web 前端与原生端（Android / HarmonyOS）之间的**双向消息通信模块**。

核心机制：

- Android 端通过 `addJavascriptInterface` 注入 `NativeHost` 实例作为 `window.__nativeHost`，暴露 `call(json)` 和 `platform()` 方法
- Web 端创建 `CallbackRegistry` 挂到 `window.__webBridge`，原生端通过 `invoke()` 触发回调

---

## 2. 流程图

### 2.1 业务流程图

展示一次完整 `send()` 调用从 Web 到原生端再回调的**数据流向**：

```
Web 前端                          原生端
  │                                  │
  │ ① bridge.send(name, params, cb)  │
  │    ├─ groupId = uuid (if cb)     │
  │    └─ __nativeHost.call(json) ──→ __nativeHost.call(json)
  │                                  │    ├─ parse messageName
  │                                  │    ├─ parse params
  │                                  │    └─ parse groupId
  │                                  │
  │                                  │ ② 路由到 Handler → 执行业务
  │                                  │    invokeCallback(groupId, event, data)
  │                                  │
  │ ③ __webBridge.invoke(           │  ←── evaluateJavascript
  │      groupId, 'onSuccess', data) │
  │    └─ CallbackRegistry.invoke()  │
  │       ├─ clearTimeout            │
  │       └─ cb(data) ✓              │
```

**Web 端监听**（`on` / `off`，不经过 send）：

```
Web 前端                          原生端
  │                                  │
  │ bridge.on('networkChange', fn)   │
  │   → __webBridge.addListener()   │
  │                                  │ pushEvent('networkChange', data)
  │  __webBridge.invoke(            │  ←── evaluateJavascript
  │    '__listeners',               │
  │    'networkChange', data)       │
  │    └─ fn(data) ✓                │
```

### 2.2 模块流程图

展示 Web 端 `nativeBridge/` 模块内**类与实例的依赖关系**：

```
┌─────────────────────────────────────────────────────────────┐
│                     nativeBridge/ 模块                       │
│                                                             │
│  ┌────────────┐                                             │
│  │ nativeEnv  │  utils/                                     │
│  │ init()     │──┐                                          │
│  │ get()      │  │ 创建                                     │
│  │ isNative() │  │                                          │
│  │ platform() │  ▼                                          │
│  └────────────┘  NativeBridge (core/)                      │
│                       │                                     │
│                       ├─ send(name, params, cb?, opts?)    │
│                       │    ├─ register() → uuid            │
│                       │    └─ __nativeHost.call(json)      │
│                       │                                     │
│                       ├─ on(name, handler) → unlisten      │
│                       │    └─ addListener(name, handler)    │
│                       │                                     │
│                       └─ off(name, handler?)               │
│                            └─ removeListener(...)           │
│                       │                                     │
│              ┌────────┘ 持有                                │
│              ▼                                             │
│     CallbackRegistry (core/)                               │
│       _store: {                                            │
│         '<UUID>': { onSuccess: [fn], onError: [fn] }      │
│         '__listeners': { networkChange: [fn], ... }       │
│       }                                                    │
│       register(callbacks, timeout) → groupId               │
│       invoke(groupId, eventName, data)                     │
│       addListener / removeListener                         │
│                                                             │
│  window                                                      │
│    __nativeHost.call(json)   ← 原生端 addJavascriptInterface │
│    __webBridge → CallbackRegistry ← 原生端 evaluateJavascript│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 运行流程

### 步骤 1 — 初始化（main.ts）

```ts
// main.ts
import { initNativeBridge } from '@/modules/nativeBridge'

initNativeBridge()
// → new NativeBridge()
// → new CallbackRegistry() 挂到 window.__webBridge
```

`initNativeBridge()` 重复调用返回已有实例。

### 步骤 2 — 原生端注入 `__nativeHost`

Android 端在 WebView 初始化时通过 `addJavascriptInterface` 注入：

```kotlin
webView.addJavascriptInterface(
    NativeHost(messageHandler),
    "__nativeHost"
)
```

注入后 `window.__nativeHost` 为一个 Java 对象，Web 端可通过 `call(json)` 发消息，通过 `platform()` 获取平台标识。

### 步骤 3 — Web 端发送消息（send）

```ts
import { getNativeBridge } from '@/modules/nativeBridge'

const bridge = getNativeBridge()

// 不带回调 — 单向通知
bridge.send('pageChanged', { route: '/home' })

// 带回调 — 等待原生端响应
bridge.send('upload', { path: '/a.jpg' }, {
  onProgress: (pct) => updateBar(pct),
  onSuccess:  () => showToast('完成'),
  onError:    (err) => {
    if (err.timeout) { /* 超时 */ }
    else { /* 业务错误 */ }
  },
}, { timeout: 120 })
```

`send()` 内部执行：

1. 检查 `window.__nativeHost?.call` 是否已注入
2. 若传了 `callbacks`，调用 `CallbackRegistry.register()`：`uuid.v4()` 生成 UUID → 存入 `_store[id]` → 启动超时定时器
3. 构造消息体 `{ groupId?, messageName, params }` → 调用 `__nativeHost.call(json)`

### 步骤 4 — 原生端处理并回调

原生端解析消息 → 按 `messageName` 路由 → 执行业务 → 回调：

```js
window.__webBridge.invoke('550e8400-...', 'onProgress', 50)
window.__webBridge.invoke('550e8400-...', 'onSuccess', result)
window.__webBridge.invoke('550e8400-...', 'onError', { code: 1001, message: '文件不存在' })
```

非 `onError` 事件会同时清除超时定时器。

### 步骤 5 — Web 端监听原生端推送

```ts
const unlisten = bridge.on('networkChange', (data) => {
  console.log('网络变化:', data)
})

onUnmounted(() => unlisten())
```

原生端推送：

```js
window.__webBridge.invoke('__listeners', 'networkChange', { isConnected: false })
```

### 步骤 6 — 超时兜底

若原生端超时未回调：

1. 调用 `onError({ code: -1, message: 'timeout', timeout: true })`（如果注册了）
2. 从 `_store` 删除整个消息组

未注册 `onError` 时静默删除。

---

## 4. 目录结构

```
src/modules/nativeBridge/
├── index.ts                  ← 模块统一出口
├── config.ts                 ← 全局配置常量
├── types/
│   └── index.ts              ← 类型定义
├── core/
│   ├── NativeBridge.ts       ← 核心通信类（send / on / off）
│   └── CallbackRegistry.ts   ← 回调注册中心
├── utils/
│   └── nativeEnv.ts          ← 工具函数（init / get / isNativeEnv / getNativePlatform）
├── DESIGN.md                 ← 设计文档
└── USAGE.md                  ← 使用文档
```

外部依赖：

| 依赖 | 用途 |
|------|------|
| `uuid` (npm) | 生成消息组 UUID |

index.ts 导出清单：

| 导出 | 类型 | 说明 |
|------|------|------|
| `initNativeBridge` | `() => NativeBridge` | 初始化（main.ts 调用） |
| `getNativeBridge` | `() => NativeBridge` | 获取单例 |
| `isNativeEnv` | `() => boolean` | 是否原生环境 |
| `getNativePlatform` | `() => NativePlatform \| null` | 获取平台标识 |
| `NATIVE_HOST` | `string` = `'__nativeHost'` | window 挂载名 |
| `WEB_BRIDGE` | `string` = `'__webBridge'` | window 挂载名 |
| `LISTENER_GROUP` | `string` = `'__listeners'` | 监听默认消息组 |
| `DEFAULT_TIMEOUT` | `number` = `60` | 默认超时秒数 |
| `TIMEOUT_MESSAGE` | `string` = `'timeout'` | 超时消息 |
| `NativePlatform` | type | 原生平台标识 |
| `NativeHost` | interface | __nativeHost 对象结构 |
| `SendOptions` | interface | 配置选项 |
| `SendCallbacks` | type | 回调对象类型 |
| `NativeError` | interface | 错误结构 |
| `MessageBody` | interface | 消息体结构 |
| `EventHandler` | type | 监听函数签名 |

---

## 5. 总结

| 要点 | 说明 |
|------|------|
| 依赖 | `window` 上两个对象：`__nativeHost`（原生注入）+ `__webBridge`（Web 创建） |
| 回调存储 | `send()` 回调与 `on()` 监听存于同一 `_store`，原生端通过 `invoke()` 触发 |
| 超时 | 默认 60 秒，超时自动 `onError` + 清理 |
| 单例 | `initNativeBridge()` 在 main.ts 调用一次，`getNativeBridge()` 全局获取 |
| 复用 | 重复 `new NativeBridge()` 复用同一 `CallbackRegistry` |
| 环境判断 | `isNativeEnv()` 判断是否原生环境，`getNativePlatform()` 获取平台标识 |
