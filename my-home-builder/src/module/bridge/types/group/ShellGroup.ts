/**
 * Shell 命令执行分组消息
 */

export type ShellGroup = {
  /**
   * 执行 Shell 命令（捕获全部输出后回传）
   */
  execCommand: {
    type: 'action'
    params: { command: string; cwd?: string }
    callbacks: {
      onSuccess: (data: { stdout: string }) => void
      onError: (data: { message: string }) => void
    }
  }

  /**
   * 执行 Shell 命令（实时流式输出）
   */
  spawnCommand: {
    type: 'action'
    params: { command: string; cwd?: string }
    callbacks: {
      onOutput: (data: { type: 'stdout' | 'stderr'; data: string }) => void
      onClose: (data: { code: number | null }) => void
      onError: (data: { message: string }) => void
    }
  }
}
