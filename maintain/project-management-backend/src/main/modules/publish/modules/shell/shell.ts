/**
 * @file Shell 模块
 * @description 接收命令并以子进程方式后台执行，执行过程中通过回调实时输出结果
 *
 * 特性：
 * - 构造只注入配置，不产生任何副作用
 * - run(command) 执行命令，后台运行，stdout/stderr 通过 onLog 回调实时流出
 * - 命令结束时回调 onExit
 * - kill 可终止运行中的进程（Windows 下按进程树整体终止）
 */
import { spawn, type ChildProcess } from 'node:child_process'
import type { IShellExit, IShellLog, IShellOptions } from './types/shell'

/**
 * Shell 实例
 *
 * 一个实例同一时间只运行一个命令；命令结束后实例可继续复用执行下一条命令，
 * 日志与结束回调会跨命令持续生效。
 */
export class Shell {
  /**
   * 配置项
   */
  private readonly options: IShellOptions
  /**
   * 当前运行中的子进程，空闲时为 null
   */
  private child: ChildProcess | null = null
  /**
   * 本次命令是否由用户主动终止
   */
  private killedByUser = false
  /**
   * 最近一次命令的结束信息，尚未结束时为 null
   */
  private exitInfo: IShellExit | null = null

  /**
   * 创建 Shell 实例
   * @param options 配置项
   */
  constructor(options: IShellOptions = {}) {
    this.options = options
  }

  /**
   * 是否有命令正在运行
   */
  get running(): boolean {
    return this.child !== null
  }

  /**
   * 最近一次命令的结束信息，尚未结束时为 null
   */
  get exit(): IShellExit | null {
    return this.exitInfo
  }

  /**
   * 开始执行命令
   *
   * 后台运行：stdout/stderr 实时通过 onLog 输出，结束后回调 onExit；
   * 上一条命令结束后可再次调用本方法执行下一条命令
   * @param command 要执行的命令
   * @throws 命令为空，或当前已有命令在运行时抛错
   */
  run(command: string): void {
    if (!command.trim()) throw new Error('命令不能为空')
    if (this.child) throw new Error('当前 Shell 已有命令在运行，请先终止')
    this.killedByUser = false
    this.exitInfo = null
    this.pushLog({ type: 'command', data: command })

    const child = spawn(command, {
      cwd: this.options.cwd,
      shell: true,
      env: { ...process.env, ...this.options.env },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    this.child = child

    // 由 Node 的字符串解码器按字节边界拼接，避免多字节字符被 chunk 切断出现乱码
    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => {
      this.pushLog({ type: 'stdout', data: chunk })
    })
    child.stderr?.on('data', (chunk: string) => {
      this.pushLog({ type: 'stderr', data: chunk })
    })
    child.once('error', (error: Error) => {
      this.pushLog({ type: 'system', data: `命令启动失败：${error.message}` })
      this.finish(null, null)
    })
    child.once('close', (code: number | null, signal: NodeJS.Signals | null) => {
      this.finish(code, signal)
    })
  }

  /**
   * 终止运行中的命令
   *
   * Windows 下按进程树整体终止（含命令派生的孙进程），其他平台发送 signal 信号
   * @param signal 终止信号，默认 SIGTERM（Windows 下恒走 taskkill /T /F）
   * @returns 已发起终止返回 true；无运行中进程时返回 false
   */
  kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    const child = this.child
    if (!child) return false
    this.killedByUser = true

    // Windows 下 child.kill 只能终止 shell 包装进程，需要按进程树整体终止
    if (process.platform === 'win32' && child.pid) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true
      })
        .once('error', () => child.kill(signal))
        .unref()
      return true
    }

    return child.kill(signal)
  }

  /**
   * 输出一条日志，通过回调实时输出
   * @param log 日志条目
   */
  private pushLog(log: IShellLog): void {
    const onLog = this.options.onLog
    if (!log.data || !onLog) return
    try {
      onLog(log)
    } catch (error) {
      // 回调抛错不影响 Shell 本体
      void error
    }
  }

  /**
   * 收尾当前命令：清理运行状态并回调 onExit
   * @param code 退出码，启动失败时为 null
   * @param signal 终止信号
   */
  private finish(code: number | null, signal: NodeJS.Signals | null): void {
    // 启动失败时 error 与 close 会先后触发，仅第一次生效
    if (!this.child) return
    this.child = null
    this.exitInfo = { code, signal, killed: this.killedByUser }

    const onExit = this.options.onExit
    if (!onExit) return
    try {
      onExit(this.exitInfo)
    } catch (error) {
      // 回调抛错不影响 Shell 本体
      void error
    }
  }
}
