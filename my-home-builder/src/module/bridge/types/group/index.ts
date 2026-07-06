/**
 * 分组消息类型聚合
 */
import type { LocalFileGroup } from './LocalFileGroup'
import type { ShellGroup } from './ShellGroup'

export interface Groups {
  /**
   * 本地文件操作
   */
  localFile: LocalFileGroup

  /**
   * Shell 命令执行
   */
  shell: ShellGroup
}
