/**
 * @file 终端模块：以子进程方式执行命令，支持后台运行与系统终端窗口两种模式
 *
 * 特性：
 * - run(command) 执行命令，默认后台运行，stdout/stderr 通过日志回调实时流出
 * - openTerminal: true 时弹出独立系统终端窗口运行（Windows 下为独立 cmd 窗口），
 *   此时输出显示在系统窗口内、不走日志回调
 * - write/appendCommand 可向运行中的进程追加内容（追加命令、应答交互提示）
 * - kill 可终止运行中的进程（Windows 下按进程树整体终止）
 * - onExit 监听命令运行结束；onLog 监听日志打印
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { EOL } from 'node:os'
import type {
  TerminalExit,
  TerminalExitListener,
  TerminalLog,
  TerminalLogListener,
  TerminalOptions,
} from './types/terminal'

/** 默认日志历史缓冲上限（字节） */
const DEFAULT_MAX_BUFFER = 10 * 1024 * 1024

/** 空操作，用于兜底子进程 stdin 的 EPIPE 等异常，避免未处理事件导致主进程崩溃 */
const noop = (): void => undefined

/**
 * 终端实例
 *
 * 一个实例同一时间只运行一个命令；命令结束后实例可继续复用执行下一条命令，
 * 日志与结束监听会跨命令持续生效。
 */
export class Terminal {
  /** 工作目录 */
  private readonly cwd: string | undefined
  /** 注入的环境变量 */
  private readonly env: NodeJS.ProcessEnv | undefined
  /** shell：true 表示系统默认 shell，字符串表示自定义 shell */
  private readonly shell: boolean | string
  /** 是否弹出系统终端窗口运行 */
  private readonly openTerminal: boolean
  /** 日志历史缓冲上限 */
  private readonly maxBuffer: number

  /** 当前运行中的子进程，空闲时为 null */
  private child: ChildProcess | null = null
  /** 本次命令是否由用户主动终止 */
  private killedByUser = false
  /** 最近一次命令的结束信息，尚未结束时为 null */
  private exitInfo: TerminalExit | null = null

  /** 日志历史缓冲 */
  private outputBuffer = ''
  /** 日志历史已写入字节数 */
  private outputBytes = 0
  /** 日志历史是否已超出缓冲上限（超出后不再累积，仅实时回调） */
  private outputTruncated = false

  /** 日志监听器集合 */
  private readonly logListeners = new Set<TerminalLogListener>()
  /** 结束监听器集合 */
  private readonly exitListeners = new Set<TerminalExitListener>()

  constructor(options: TerminalOptions = {}) {
    this.cwd = options.cwd
    this.env = options.env
    this.shell = options.shell ?? true
    this.openTerminal = options.openTerminal === true
    this.maxBuffer = options.maxBuffer ?? DEFAULT_MAX_BUFFER

    const initialCommand = options.command
    if (initialCommand) {
      // 延迟到同步调用栈结束后执行，保证外部先完成监听器的注册
      queueMicrotask(() => {
        if (this.child || this.exitInfo) return
        this.run(initialCommand)
      })
    }
  }

  /** 是否有命令正在运行 */
  get running(): boolean {
    return this.child !== null
  }

  /** 当前运行中子进程的 pid，空闲时为 null */
  get pid(): number | null {
    return this.child?.pid ?? null
  }

  /** 最近一次命令的结束信息，尚未结束时为 null */
  get exit(): TerminalExit | null {
    return this.exitInfo
  }

  /** 累计的日志历史（超出缓冲上限后仅保留前 maxBuffer 字节） */
  get output(): string {
    return this.outputBuffer
  }

  /**
   * 合并注入的环境变量与进程默认环境
   */
  private mergedEnv(): NodeJS.ProcessEnv {
    return { ...process.env, ...this.env }
  }

  /**
   * 输出一条日志：先按缓冲上限累积历史，再实时分发给日志监听器
   * @param log 日志条目
   */
  private pushLog(log: TerminalLog): void {
    if (!log.data) return
    if (!this.outputTruncated) {
      const remain = this.maxBuffer - this.outputBytes
      if (remain > 0) {
        const append = log.data.slice(0, remain)
        this.outputBuffer += append
        this.outputBytes += append.length
      }
      if (this.outputBytes >= this.maxBuffer) {
        this.outputTruncated = true
      }
    }
    for (const listener of [...this.logListeners]) {
      try {
        listener(log)
      } catch (error) {
        // 单个监听器抛错不影响其他监听器与终端本体
        void error
      }
    }
  }

  /**
   * 通知所有结束监听器
   */
  private notifyExit(): void {
    if (!this.exitInfo) return
    for (const listener of [...this.exitListeners]) {
      try {
        listener(this.exitInfo)
      } catch (error) {
        void error
      }
    }
  }

  /**
   * 子进程启动失败处理
   * @param error 启动错误
   */
  private handleProcessError(error: Error): void {
    this.child = null
    this.exitInfo = { code: null, signal: null, killed: false }
    this.pushLog({ type: 'system', data: `命令启动失败：${error.message}` })
    this.notifyExit()
  }

  /**
   * 子进程结束处理（正常退出 / 被终止都会走到这里）
   * @param code 退出码
   * @param signal 终止信号
   */
  private handleClose(code: number | null, signal: NodeJS.Signals | null): void {
    this.child = null
    this.exitInfo = { code, signal, killed: this.killedByUser }
    this.notifyExit()
  }

  /**
   * 以管道方式启动后台子进程，并挂接 stdout/stderr 日志与 stdin
   * @param command 要执行的命令
   */
  private spawnBackground(command: string): void {
    const child = spawn(command, {
      cwd: this.cwd,
      shell: this.shell,
      env: this.mergedEnv(),
      windowsHide: true,
    })
    this.child = child

    child.stdout?.on('data', (chunk: Buffer) => {
      this.pushLog({ type: 'stdout', data: chunk.toString('utf8') })
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      this.pushLog({ type: 'stderr', data: chunk.toString('utf8') })
    })
    child.stdin?.on('error', noop)
    child.once('error', (error) => this.handleProcessError(error))
    child.once('close', (code, signal) => this.handleClose(code, signal))
  }

  /**
   * 弹出系统终端窗口运行命令（Windows 下为独立 cmd 窗口）
   *
   * 窗口模式下输出直接显示在系统窗口内，不走日志回调；
   * 仅 Windows 支持弹出独立控制台窗口，其余平台回退为后台运行
   * @param command 要执行的命令
   */
  private spawnWindow(command: string): void {
    const child = spawn(command, {
      cwd: this.cwd,
      shell: this.shell,
      env: this.mergedEnv(),
      detached: true,
      windowsHide: false,
      stdio: 'ignore',
    })
    this.child = child
    child.once('error', (error) => this.handleProcessError(error))
    child.once('exit', (code, signal) => this.handleClose(code, signal))
    child.unref()
  }

  /**
   * 开始执行命令
   *
   * 默认后台运行：stdout/stderr 实时通过 onLog 输出，结束后触发 onExit；
   * openTerminal 为 true 时弹出系统终端窗口运行
   * @param command 要执行的命令
   * @throws 当前已有命令在运行，或命令为空时抛错
   */
  run(command: string): void {
    if (!command.trim()) throw new Error('命令不能为空')
    if (this.child) throw new Error('当前终端已有命令在运行，请先终止')
    this.killedByUser = false
    this.exitInfo = null
    this.outputBuffer = ''
    this.outputBytes = 0
    this.outputTruncated = false

    if (this.openTerminal) {
      if (process.platform === 'win32') {
        this.spawnWindow(command)
        return
      }
      this.pushLog({ type: 'system', data: '当前平台不支持弹出独立终端窗口，已改为后台运行' })
    }
    this.pushLog({ type: 'command', data: command })
    this.spawnBackground(command)
  }

  /**
   * 向运行中进程的标准输入写入原始内容（可用于应答交互提示等）
   * @param data 要写入的内容
   * @returns 写入成功返回 true；无运行中进程或写入失败返回 false
   */
  write(data: string): boolean {
    const child = this.child
    if (!child?.stdin) return false
    try {
      return child.stdin.write(data)
    } catch (error) {
      void error
      return false
    }
  }

  /**
   * 追加执行一条命令（写入运行中进程的标准输入并换行）
   *
   * 适用场景：命令运行中需要继续交互（如向 REPL、交互式脚本追加指令）。
   * 命令会先作为 command 类型日志输出（管道模式无终端回显，本地补一条便于 UI 展示）
   * @param command 追加的命令内容
   * @returns 追加成功返回 true；无运行中进程（窗口模式 / 已结束）时返回 false
   */
  appendCommand(command: string): boolean {
    const child = this.child
    if (!command || !child?.stdin) return false
    this.pushLog({ type: 'command', data: command })
    return this.write(command + EOL)
  }

  /**
   * 终止运行中的命令
   *
   * Windows 下按进程树整体终止（含子进程派生的孙进程），
   * 其他平台发送 signal 信号
   * @param signal 终止信号，默认 SIGTERM（Windows 下恒走 taskkill /T /F）
   * @returns 已发起终止返回 true；无运行中进程时返回 false
   */
  kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    const child = this.child
    if (!child) return false
    this.killedByUser = true

    if (process.platform === 'win32' && child.pid) {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
      killer.once('error', () => child.kill(signal))
      killer.unref()
    } else {
      try {
        return child.kill(signal)
      } catch (error) {
        void error
        return false
      }
    }
    return true
  }

  /**
   * 注册日志监听器，实时收到 stdout / stderr / 追加命令 / 系统提示
   * @param listener 日志监听函数
   * @returns 取消监听的函数
   */
  onLog(listener: TerminalLogListener): () => void {
    this.logListeners.add(listener)
    return () => {
      this.logListeners.delete(listener)
    }
  }

  /**
   * 取消日志监听
   * @param listener 之前注册的日志监听函数
   */
  offLog(listener: TerminalLogListener): void {
    this.logListeners.delete(listener)
  }

  /**
   * 注册命令结束监听器
   *
   * 若注册时命令已结束，会在当前同步调用栈结束后立即触发一次，避免漏掉结束事件
   * @param listener 结束监听函数
   * @returns 取消监听的函数
   */
  onExit(listener: TerminalExitListener): () => void {
    this.exitListeners.add(listener)
    if (this.exitInfo) {
      const info = this.exitInfo
      queueMicrotask(() => {
        if (this.exitListeners.has(listener)) listener(info)
      })
    }
    return () => {
      this.exitListeners.delete(listener)
    }
  }

  /**
   * 取消命令结束监听
   * @param listener 之前注册的结束监听函数
   */
  offExit(listener: TerminalExitListener): void {
    this.exitListeners.delete(listener)
  }

  /**
   * 释放实例：终止运行中的命令并清空所有监听器
   */
  dispose(): void {
    if (this.child) this.kill()
    this.child = null
    this.logListeners.clear()
    this.exitListeners.clear()
  }
}
