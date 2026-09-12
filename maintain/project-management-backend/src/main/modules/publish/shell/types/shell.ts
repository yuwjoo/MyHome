/**
 * @file Shell 类型
 * @description 定义 Shell 模块的日志、结束信息与配置结构
 */

/**
 * Shell 日志来源类型
 */
export type TShellLogType = 'stdout' | 'stderr' | 'command' | 'system'

/**
 * 一条 Shell 日志
 */
export interface IShellLog {
  /**
   * 日志来源
   */
  type: TShellLogType
  /**
   * 日志内容
   */
  data: string
}

/**
 * Shell 命令运行结束信息
 */
export interface IShellExit {
  /**
   * 退出码，未正常退出（如信号终止、启动失败）时为 null
   */
  code: number | null
  /**
   * 终止信号，被信号终止时存在
   */
  signal: NodeJS.Signals | null
  /**
   * 是否由用户主动终止
   */
  killed: boolean
}

/**
 * Shell 日志回调函数
 */
export type TShellLogListener = (log: IShellLog) => void

/**
 * Shell 命令结束回调函数
 */
export type TShellExitListener = (exit: IShellExit) => void

/**
 * Shell 模块配置
 */
export interface IShellOptions {
  /**
   * 命令工作目录，默认继承当前进程
   */
  cwd?: string
  /**
   * 注入子进程的环境变量（同名会覆盖默认环境变量）
   */
  env?: NodeJS.ProcessEnv
  /**
   * 日志输出回调，命令执行过程中实时回调 stdout / stderr / 系统提示
   */
  onLog?: TShellLogListener
  /**
   * 命令结束回调，命令运行结束时回调一次
   */
  onExit?: TShellExitListener
}
