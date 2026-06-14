# NativeBridge 使用文档

## 初始化（main.ts）

```ts
// main.ts
import { initNativeBridge } from '@/modules/nativeBridge'

initNativeBridge() // 创建实例并挂到 window.__webBridge
```

## 获取实例

```ts
import { getNativeBridge } from '@/modules/nativeBridge'

const bridge = getNativeBridge()
```

全局唯一实例，任意位置调用返回同一对象。

## 环境判断

```ts
import { isNativeEnv, getNativePlatform } from '@/modules/nativeBridge'

if (isNativeEnv()) {
  const platform = getNativePlatform() // 'android' | 'harmony'
  // 原生环境特有逻辑
}
```

---

## API

### `send(messageName, params, callbacks?, options?)`

向原生端发送消息。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:--:|--------|------|
| `messageName` | `string` | ✅ | — | 消息名称，原生端据此路由 |
| `params` | `Record<string, unknown>` | ✅ | — | 消息参数 |
| `callbacks` | `SendCallbacks` | ❌ | — | 具名回调对象，属性名自定义 |
| `options` | `SendOptions` | ❌ | `{ timeout: 60 }` | `timeout` 设为 0 永不超时 |

**不带回调（单向通知）**：

```ts
getNativeBridge().send('pageChanged', { route: '/home' })
```

**带回调 + 默认 60 秒超时**：

```ts
getNativeBridge().send('getData', { id: 123 }, {
  onSuccess: (data) => console.log(data),
  onError: (err) => {
    if (err.timeout) {
      // 超时处理
    } else {
      // 业务错误
    }
  },
})
```

**自定义超时**：

```ts
getNativeBridge().send('upload', { path: '/a.jpg' }, {
  onProgress: (pct) => updateBar(pct),
  onSuccess:  () => showToast('完成'),
  onError:    (err) => showError(err),
}, { timeout: 120 })
```

---

### `on(eventName, handler)` → `() => void`

监听原生端主动推送的事件，返回取消函数。

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `eventName` | `string` | ✅ | 事件名称 |
| `handler` | `EventHandler` | ✅ | 回调函数 |

```ts
const unlisten = getNativeBridge().on('networkChange', (data) => {
  console.log('网络变化:', data)
})

onUnmounted(() => unlisten())
```

---

### `off(eventName, handler?)`

取消事件监听。

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `eventName` | `string` | ✅ | 事件名称 |
| `handler` | `EventHandler` | ❌ | 不传则清空该事件名下所有监听 |

---

## Vue 组件完整示例

```vue
<script setup lang="ts">
import { getNativeBridge } from '@/modules/nativeBridge'
import type { NativeError } from '@/modules/nativeBridge'
import { onMounted, onUnmounted, ref } from 'vue'

const bridge = getNativeBridge()
const networkStatus = ref<unknown>(null)

let unlistenNetwork: (() => void) | null = null

onMounted(() => {
  unlistenNetwork = bridge.on('networkChange', (data) => {
    networkStatus.value = data
  })
})

onUnmounted(() => {
  unlistenNetwork?.()
})

function handleGetData() {
  bridge.send('getData', { id: 123 }, {
    onSuccess: (data) => console.log('数据:', data),
    onError: (err: NativeError) => {
      if (err.timeout) { console.error('请求超时') }
      else { console.error('错误:', err.message) }
    },
  })
}

function handleNotify() {
  bridge.send('pageChanged', { route: '/settings' })
}
</script>

<template>
  <div>
    <p>网络状态: {{ networkStatus }}</p>
    <button @click="handleGetData">获取数据</button>
    <button @click="handleNotify">通知页面切换</button>
  </div>
</template>
```

---

## 超时机制

| 项目 | 说明 |
|------|------|
| 默认超时 | 60 秒 |
| 计时起点 | `send()` 调用 → 内部 `register()` 执行时 |
| 超时行为 | 调用 `onError({ code: -1, message: 'timeout', timeout: true })` → 删除回调组 |
| 无 `onError` | 静默删除回调组 |
| 不设超时 | `options.timeout = 0` |

---

## 原生端对接指南

### 注入 `__nativeHost`

Android 端通过 `addJavascriptInterface` 直接注入：

```kotlin
webView.addJavascriptInterface(
    NativeHost(messageHandler),
    "__nativeHost"
)
```

```kotlin
class NativeHost(private val handler: NativeMessageHandler) {
    @JavascriptInterface
    fun platform(): String = "android"

    @JavascriptInterface
    fun call(json: String) {
        val msg = JSONObject(json)
        val messageName = msg.getString("messageName")
        val params = msg.getJSONObject("params")
        val callbackId = msg.optString("callbackId", null)
        handler.handle(messageName, params, callbackId)
    }
}
```

Web 端通过 `window.__nativeHost.call(json)` 发送消息，通过 `window.__nativeHost.platform()` 获取平台。

### 消息体格式

```ts
{
  messageName: string              // 消息名称
  params: Record<string, unknown>  // 消息参数
  callbackId?: string              // 仅 Web 端传了 callbacks 时存在
}
```

### 回调 Web 端

```js
window.__webBridge.invoke(callbackId, 'onProgress', 50)
window.__webBridge.invoke(callbackId, 'onSuccess', result)
window.__webBridge.invoke(callbackId, 'onError', { code: 1001, message: '文件不存在' })
```

### 主动推送事件

```js
window.__webBridge.invoke('__listeners', 'networkChange', { isConnected: false })
window.__webBridge.invoke('__listeners', 'appResume', null)
```

---

## 注意事项

1. 在 `main.ts` 中尽早调用 `initNativeBridge()`
2. 使用 `send()` 前确保原生端注入 `window.__nativeHost.call`
3. 回调存储在 Web 端内存中，不随 JSON 发给原生端
4. 每个 `send()` 独立计时，超时自动执行 `onError` 并清理
5. `on()` 返回取消函数，组件卸载时务必调用，防止内存泄漏
6. 使用 `isNativeEnv()` 在调用 Native 能力前做环境判断
