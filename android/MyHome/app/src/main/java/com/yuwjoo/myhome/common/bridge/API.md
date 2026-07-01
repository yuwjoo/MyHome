# 通信桥 API 说明

- [通信机制](#通信机制)
  - [Web → Native](#web--native)
  - [Native → Web](#native--web)
- [总览](#总览)
- [卧室空调 → `bedroomAC`](#卧室空调--bedroomac)
  - [状态数据结构](#状态数据结构)
  - [API 列表](#api-列表)
  - [调用示例](#调用示例)
- [温湿度传感器 → `tempHumid`](#温湿度传感器--temphumid)
  - [状态数据结构](#状态数据结构-1)
  - [API 列表](#api-列表-1)
  - [调用示例](#调用示例-1)
- [设备在线状态 → `deviceStatus`](#设备在线状态--devicestatus)
  - [状态数据结构](#状态数据结构-2)
  - [API 列表](#api-列表-2)
  - [调用示例](#调用示例-2)
- [附录：Web 端推荐封装](#附录web-端推荐封装)
  - [`__webBridge.invoke` 分发实现](#__webbridgeinvoke-分发实现)
  - [Promise 封装](#promise-封装)
  - [使用示例](#使用示例)

---

## 通信机制

### Web → Native

```js
window.__nativeHost.call(JSON.stringify({ messageName, params, groupId? }));
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `messageName` | string | ✓ | 消息名称，决定路由到哪个 handler |
| `params` | object | ✓ | 操作参数，至少需包含 `action` 字段 |
| `groupId` | string | | 可选回调分组 ID，携带后原生端通过 `invokeCallback` 定向回复 |

### Native → Web

| 方式 | JS 调用 | 说明 |
|------|------|------|
| 定向回调 | `window.__webBridge.invoke(groupId, eventName, data)` | 仅回复携带了 `groupId` 的调用方 |
| 广播事件 | `window.__webBridge.invoke("__listeners", eventName, data)` | 推送给所有已订阅的页面 |

---

## 总览

| 模块 | `messageName` | 类型 | 说明 |
|------|--------------|------|------|
| 卧室空调 | `bedroomAC` | 读写 | 红外遥控空调，控制指令 + 状态查询/订阅 |
| 温湿度传感器 | `tempHumid` | 只读 | 室内温湿度数据，仅查询/订阅 |
| 设备在线状态 | `deviceStatus` | 只读 | ESP8266 设备在线/离线监控 |

---

## 卧室空调 → `bedroomAC`

### 状态数据结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `power` | boolean | 电源开关 |
| `temperature` | number | 设定温度 16~30 |
| `mode` | string | `"cool"` \| `"heat"` \| `"dry"` \| `"fan"` |
| `swing` | boolean | 摆风开关 |
| `windSpeed` | string | `"auto"` \| `"low"` \| `"medium"` \| `"high"` |
| `gentle` | boolean | 舒风开关 |
| `light` | boolean | 屏显开关 |
| `onTimer` | number | 定时开机剩余分钟数，0=未设置 |
| `offTimer` | number | 定时关机剩余分钟数，0=未设置 |

### API 列表

| action | 参数 | 响应 | 说明 |
|------|------|------|------|
| `togglePower` | — | — | 开关电源 |
| `increaseTemperature` | — | — | 温度 +1 |
| `decreaseTemperature` | — | — | 温度 -1 |
| `toggleSwing` | — | — | 切换摆风开关 |
| `setCoolingMode` | — | — | 制冷模式 |
| `setHeatingMode` | — | — | 制热模式 |
| `setDryMode` | — | — | 除湿模式 |
| `setFanMode` | — | — | 送风模式 |
| `toggleWindSpeed` | — | — | 切换风速（auto → low → medium → high） |
| `enableGentleMode` | — | — | 开启舒风 |
| `toggleLight` | — | — | 切换屏显开关 |
| `setOnTimer` | `minutes` (0~720) | — | 定时开机 |
| `setOffTimer` | `minutes` (0~720) | — | 定时关机 |
| `cancelOnTimer` | — | — | 取消定时开机 |
| `cancelOffTimer` | — | — | 取消定时关机 |
| `getState` | — | `invokeCallback("onState", ACState)` | 获取当前状态 |
| `subscribeState` | — | `pushEvent("onACStateChanged", ACState)` | 订阅状态变化 |
| `unsubscribeState` | — | — | 取消订阅 |

### 调用示例

```js
// 控制指令
window.__nativeHost.call(JSON.stringify({
    messageName: "bedroomAC",
    params: { action: "togglePower" }
}));
window.__nativeHost.call(JSON.stringify({
    messageName: "bedroomAC",
    params: { action: "setOffTimer", minutes: 30 }
}));

// 获取状态（定向回调）
window.__nativeHost.call(JSON.stringify({
    messageName: "bedroomAC",
    params: { action: "getState" },
    groupId: "ac_state"
}));
// → window.__webBridge.invoke("ac_state", "onState", acState)

// 订阅状态变化（广播推送）
window.__nativeHost.call(JSON.stringify({
    messageName: "bedroomAC",
    params: { action: "subscribeState" }
}));
// → window.__webBridge.invoke("__listeners", "onACStateChanged", acState)

// 取消订阅
window.__nativeHost.call(JSON.stringify({
    messageName: "bedroomAC",
    params: { action: "unsubscribeState" }
}));
```

---

## 温湿度传感器 → `tempHumid`

### 状态数据结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `temperature` | number | 温度 °C |
| `humidity` | number | 湿度 % |

### API 列表

| action | 参数 | 响应 | 说明 |
|------|------|------|------|
| `getState` | — | `invokeCallback("onState", TempHumidState)` | 获取当前温湿度 |
| `subscribeState` | — | `pushEvent("onTempHumidChanged", TempHumidState)` | 订阅实时数据（~60s 推送一次） |
| `unsubscribeState` | — | — | 取消订阅 |

### 调用示例

```js
// 获取
window.__nativeHost.call(JSON.stringify({
    messageName: "tempHumid",
    params: { action: "getState" },
    groupId: "th"
}));
// → window.__webBridge.invoke("th", "onState", { temperature: 26.5, humidity: 58 })

// 订阅
window.__nativeHost.call(JSON.stringify({
    messageName: "tempHumid",
    params: { action: "subscribeState" }
}));
// → window.__webBridge.invoke("__listeners", "onTempHumidChanged", state)
```

---

## 设备在线状态 → `deviceStatus`

### 状态数据结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | `"online"` \| `"offline"` \| `"unknown"` |

### API 列表

| action | 参数 | 响应 | 说明 |
|------|------|------|------|
| `getStatus` | — | `invokeCallback("onStatus", { status })` | 获取当前设备状态 |
| `subscribeStatus` | — | `pushEvent("onDeviceStatusChanged", { status })` | 订阅状态变化（MQTT 遗嘱机制） |
| `unsubscribeStatus` | — | — | 取消订阅 |

### 调用示例

```js
// 获取
window.__nativeHost.call(JSON.stringify({
    messageName: "deviceStatus",
    params: { action: "getStatus" },
    groupId: "ds"
}));
// → window.__webBridge.invoke("ds", "onStatus", { status: "online" })

// 订阅
window.__nativeHost.call(JSON.stringify({
    messageName: "deviceStatus",
    params: { action: "subscribeStatus" }
}));
// → window.__webBridge.invoke("__listeners", "onDeviceStatusChanged", { status: "offline" })
```

---

## 附录：Web 端推荐封装

### `__webBridge.invoke` 分发实现

```ts
window.__webBridge = {
    invoke(groupId: string, eventName: string, data: any) {
        if (groupId === "__listeners") {
            // 广播：通知所有监听者
            window._bridgeListeners?.[eventName]?.forEach(fn => fn(data));
        } else {
            // 定向：回复指定 groupId 的 Promise
            const cb = window._bridgeCallbacks?.[groupId];
            if (cb) {
                delete window._bridgeCallbacks[groupId];
                cb(data);
            }
        }
    },
};
```

### Promise 封装

```ts
// 调用原生 → 等待定向回调
function callNative(
    messageName: string,
    action: string,
    params?: Record<string, any>
): Promise<any> {
    return new Promise((resolve) => {
        const groupId = `${messageName}_${Date.now()}`;
        window._bridgeCallbacks = window._bridgeCallbacks || {};
        window._bridgeCallbacks[groupId] = resolve;

        window.__nativeHost.call(JSON.stringify({
            messageName,
            params: { action, ...params },
            groupId,
        }));
    });
}

// 订阅广播事件 → 返回取消函数
function subscribeNative(
    eventName: string,
    handler: (data: any) => void
): () => void {
    window._bridgeListeners = window._bridgeListeners || {};
    (window._bridgeListeners[eventName] ??= []).push(handler);
    return () => {
        const list = window._bridgeListeners[eventName];
        if (list) {
            const i = list.indexOf(handler);
            if (i >= 0) list.splice(i, 1);
        }
    };
}
```

### 使用示例

```ts
// 获取空调状态
const acState = await callNative("bedroomAC", "getState");
console.log(acState.temperature); // 26

// 订阅温湿度
const unsub = subscribeNative("onTempHumidChanged", (data) => {
    console.log(`温度: ${data.temperature}°C, 湿度: ${data.humidity}%`);
});
// 取消订阅
unsub();
```
