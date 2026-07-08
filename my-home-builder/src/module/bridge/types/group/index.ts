/**
 * 分组消息类型聚合
 */
import type { LocalFileGroup } from './LocalFileGroup'
import type { ShellGroup } from './ShellGroup'
import type { WebGroup } from './WebGroup'
import type { AndroidGroup } from './AndroidGroup'
import type { VersionManifestGroup } from './VersionManifestGroup'

export interface Groups {
  /**
   * 本地文件操作
   */
  localFile: LocalFileGroup

  /**
   * Shell 命令执行
   */
  shell: ShellGroup

  /**
   * Web 项目发布
   */
  web: WebGroup

  /**
   * Android 项目发布
   */
  android: AndroidGroup

  /**
   * 版本清单管理
   */
  versionManifest: VersionManifestGroup
}
