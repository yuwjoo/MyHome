# 终端模块设计（src/main/module/terminal）

## 定位

零依赖（node 内置 `child_process.spawn`）的命令执行器，供发版等流程在后台执行命令、
实时获取日志、追加输入、按需终止。不引入 node-pty/xterm.js，不做真实 PTY 交互渲染。

## 目录结构

```
terminal/
├── index.ts          # 出口：Terminal 类与全部类型
├── terminal.ts       # 实现
└── types/terminal.ts # TerminalOptions / TerminalLog / TerminalExit 等类型
```

## 对外 API（改动须同步本文档与 00-index）

构造（`TerminalOptions`，均为可选）：

| 字段 | 含义 |
|---|---|
| `command` | 首个要执行的命令；创建后下一拍自动执行（微任务延迟，保证先注册监听不漏事件） |
| `cwd` / `env` | 工作目录 / 注入环境变量（覆盖默认） |
| `openTerminal` | `true` 时弹出系统独立 cmd 窗口运行（仅 Windows；输出在该窗口、不走日志回调）；默认 `false` 后台运行 |
| `shell` | 自定义 shell，默认系统默认（spawn `shell: true`） |
| `maxBuffer` | 日志历史缓冲上限字节，默认 10MB；超出后仅实时回调不再累积 |
| `onLog` / `onExit` | 构造参数形式的监听器（等价创建后 `onLog()`/`onExit()`） |

实例方法：

| 方法 | 说明 |
|---|---|
| `run(command)` | 开始执行；有进程在跑或命令为空时抛错。结束后可再次 run 复用实例 |
| `appendCommand(command)` / `write(data)` | 向运行中进程 stdin 写入（追加命令/应答交互）；无运行中进程返回 `false`，追加命令会先以 `command` 类型日志本地回显 |
| `kill(signal)` | 终止；Windows 下 taskkill `/T /F` 连进程树一起杀 |
| `onLog` / `offLog` | 日志监听。日志类型 `stdout` `stderr` `command` `system` |
| `onExit` / `offExit` | 结束监听；晚注册（已结束）也会补触发一次 |
| `dispose()` | 终止并清空监听 |

属性：`running`、`pid`、`exit`（最近结束信息 `{ code, signal, killed }`）、`output`（历史日志）。

## 行为不变量

1. 一个实例同一时间只运行一个命令；实例可跨命令复用，监听器持续生效。
2. 后台模式默认 `windowsHide: true`，不闪窗；`FORCE_COLOR` 交由调用方 env 注入。
3. 退出码从 spawn 的 `close`（后台）/`exit`（窗口）获取；`killed=true` 表示用户 kill。
4. 窗口模式仅 Windows 可靠；其他平台 `openTerminal` 自动回退后台并在日志给 system 提示。
5. 所有监听器调用带异常隔离：单个监听器抛错不影响终端与其余监听器。
6. stdin 挂 error 兜底（EPIPE），避免子进程结束后写入导致主进程崩溃。

## 已知边界

- 追加命令面向「运行中进程的交互输入」；不做命令队列自动续跑。若出现「跑完一条自动执行下一条」需求，应先扩展语义（队列）再改 API。
- 纯管道无 TTY：交互式 UI（vim 类）、依赖 PTY 的 CLI 行为不保证。
