// 临时自测脚本：通过 CDP 在连接的 WebView 中执行表达式。
// 用法: node temp/webview-cdp.mjs "<js expression>"
// 前提: adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>
const CDP_HTTP = 'http://127.0.0.1:9333'

const tabs = await fetch(`${CDP_HTTP}/json/list`).then((r) => r.json())
const page = tabs.find((t) => t.type === 'page')
if (!page) {
  console.error('NO_PAGE_TAB')
  process.exit(2)
}
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
let seq = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })

const expr = process.argv[2] ?? 'location.href'
const res = await send('Runtime.evaluate', {
  expression: expr,
  returnByValue: true,
  awaitPromise: true,
})
if (res.result?.exceptionDetails) {
  console.error('EXCEPTION:', JSON.stringify(res.result.exceptionDetails, null, 2))
  process.exit(3)
}
const value = res.result?.result?.value
console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2))
ws.close()
process.exit(0)
