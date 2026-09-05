/**
 * CDP 求值小工具：对模拟器中当前 WebView 页面执行 JS 并打印结果。
 * 用法:
 *   node cdp.mjs "document.title"
 *   node cdp.mjs "(() => ({ w: innerWidth }))()"
 *   node cdp.mjs --await "async () => (await fetch('...')).status"
 *
 * 前置条件：已执行
 *   adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>
 */
const args = process.argv.slice(2)
const awaitPromise = args.includes('--await')
const expr = args.filter((a) => a !== '--await').join(' ')

if (!expr) {
  console.error('用法: node cdp.mjs [--await] "<JS 表达式>"')
  process.exit(1)
}

const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const page = targets.find((t) => t.type === 'page')
if (!page) {
  console.error('未找到 page 类型 target，当前 targets:')
  console.error(JSON.stringify(targets, null, 2))
  process.exit(1)
}

const ws = new WebSocket(page.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
}

await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

const result = await send('Runtime.evaluate', {
  expression: expr,
  awaitPromise,
  returnByValue: true,
})

if (result.exceptionDetails) {
  console.error('执行异常:')
  console.error(JSON.stringify(result.exceptionDetails, null, 2))
} else {
  const v = result.result?.value
  console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2))
}
ws.close()
