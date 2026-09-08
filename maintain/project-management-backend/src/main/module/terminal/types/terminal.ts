/**
 * @file 终端模块类型定义
 */

/** 终端日志来源类型 */
export type TerminalLogType = 'stdout' | 'stderr' | 'command' | 'system'

/** 一条终端日志 */
export interface TerminalLog {
  /** 日志来源 */
  type: TerminalLogType
  /** 日志内容 */
  data: string
}

/** 终端运行结束信息 */
export interface TerminalExit {
  /** 退出码，未正常退出（如信号终止、启动失败）时为 null */
  code: number | null
  /** 终止信号，被信号终止时存在 */
  signal: NodeJS.Signals | null
  /** 是否由用户主动终止 */
  killed: boolean
}

/** 终端日志监听函数 */
export type TerminalLogListener = (log: TerminalLog) => void

/** 终端运行结束监听函数 */
export type TerminalExitListener = (exit: TerminalExit) => void

/** 终端模块配置 */
export interface TerminalOptions {
  /** 首个要执行的命令；不传时后续可调用 run() 执行 */
  command?: string
  /** 命令工作目录，默认继承当前进程 */
  cwd?: string
  /** 注入子进程的环境变量（同名会覆盖默认环境变量） */
  env?: NodeJS.ProcessEnv
  /** 是否打开系统终端窗口运行（Windows 下弹出独立 cmd 窗口），默认 false 即后台运行 */
  openTerminal?: boolean
  /** 执行命令使用的 shell，默认取系统默认 shell（相当于 spawn 的 shell: true） */
  shell?: string
  /** 后台运行模式下日志历史缓冲上限（字节），超出后仅实时回调、不再累积历史，默认 10MB */
  maxBuffer?: number
}
