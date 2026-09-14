# Shell 模块

以子进程方式后台执行命令：实时拿到输出，可随时终止，结束后可复用继续跑下一条。

## 怎么用

```ts
import { Shell } from '@main/modules/publish'

const shell = new Shell({
  cwd: 'D:/workspace/demo', // 可选，命令执行目录
  onLog: (log) => console.log(`[${log.type}] ${log.data}`), // 可选，实时输出
  onExit: (exit) => console.log(exit.code, exit.killed) // 可选，结束回调
})

shell.run('npm run build') // 启动
shell.kill() // 终止
shell.run('npm run start') // 结束后可复用，继续跑下一条
```

## API

| 成员               | 说明                                                          |
| ------------------ | ------------------------------------------------------------- |
| `new Shell(options)` | 只保存配置，不执行任何命令                                    |
| `run(command)`     | 启动命令，后台运行；命令为空或已有命令在跑时抛错              |
| `kill(signal?)`    | 终止当前命令，返回是否发起成功；没有命令在跑时返回 `false`     |
| `running`          | 是否有命令正在运行                                            |
| `exit`             | 最近一次命令的结束信息，未结束时为 `null`                     |

`options`：

| 字段       | 说明                                                          |
| ---------- | ------------------------------------------------------------- |
| `cwd?`     | 命令工作目录，默认继承当前进程                                |
| `env?`     | 追加 / 覆盖的环境变量                                          |
| `onLog?`   | 实时输出回调，`log.type` 为 `command` / `stdout` / `stderr` / `system` |
| `onExit?`  | 结束回调，每条命令结束时回调一次                              |

`onExit` 收到的 `exit`：

| 字段     | 说明                                          |
| -------- | --------------------------------------------- |
| `code`   | 退出码；启动失败时为 `null`                   |
| `signal` | 终止信号，被信号终止时才有值                  |
| `killed` | 是否由 `kill()` 主动终止                      |

## 注意

- 一个实例同一时间只跑一条命令。`kill()` 是异步的，进程真正退出（`onExit` 触发）之前 `running` 仍为 `true`，此时再调 `run()` 会抛错——要复用请等 `onExit`。
- 区分「正常结束」和「被终止」看 `exit.killed`，不要看 `code` / `signal`：Windows 下 `kill()` 走 `taskkill`，`signal` 恒为 `null`、`code` 为 `1`。
- 子进程不接 stdin，需要交互输入的命令会直接失败而不是挂住。
