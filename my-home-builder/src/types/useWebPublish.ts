/**
 * 发布功能相关类型定义
 */

// 任务相关类型从 usePublishTask 集中管理，此处重导出保持向后兼容
export type { BuildStatus, LogEntry, PublishTask } from './usePublishTask';

/** 项目平台类型 */
export type PlatformType = 'android' | 'web';

/** 项目配置 */
export interface ProjectConfig {
  /** 项目唯一标识 */
  id: string;
  /** 项目名称 */
  name: string;
  /** 所属平台 */
  platform: PlatformType;
  /** 平台标签 */
  platformLabel: string;
  /** 版本清单中的 key，格式: platform.projectName */
  manifestKey: string;
  /** 项目本地路径 */
  path: string;
  /** 构建脚本命令 */
  buildCommand: string;
  /** 输出目录（相对于项目路径） */
  outputDir: string;
  /** 发布目标地址/配置 */
  publishTarget?: string;
}

/** 语义化版本号 */
export interface SemanticVersion {
  /** 大版本号 */
  major: number;
  /** 需求迭代版本号 */
  minor: number;
  /** bug 版本号 */
  patch: number;
}

/** 版本清单数据结构 */
export type VersionManifest = Record<string, Record<string, string>>;

/** 发布配置表单 */
export interface PublishForm {
  /** 选中的项目 ID */
  projectId: string;
  /** 发布版本号 */
  version: string;
}
