/**
 * 分组消息汇总导出
 * key 为分组名称，value 为该分组的消息处理器映射
 */
import { localFileGroup } from './localFileGroup';
import { shellGroup } from './shellGroup';
import { versionManifestGroup } from './versionManifestGroup';
import { webGroup } from './webGroup';
import { androidGroup } from './androidGroup';

export const bridgeGroup = {
  /** 本地文件读写 */
  localFile: localFileGroup,
  /** Shell 命令执行 */
  shell: shellGroup,
  /** 版本清单管理（获取 / 发布） */
  versionManifest: versionManifestGroup,
  /** Web 项目发布（更新版本 / 构建 / 压缩 / 上传） */
  web: webGroup,
  /** Android 项目发布（更新版本 / 构建 / 上传） */
  android: androidGroup,
};
