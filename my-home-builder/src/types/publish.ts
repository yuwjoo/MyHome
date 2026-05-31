/**
 * 发布功能相关类型定义
 */

/** 项目平台类型 */
export type PlatformType = 'harmony' | 'android' | 'web';

/** 构建任务状态 */
export type BuildStatus = 'idle' | 'publishing' | 'success' | 'failed';

/** 构建日志条目 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: number;
  /** 日志级别 */
  level: 'info' | 'warn' | 'error';
  /** 日志内容 */
  message: string;
}

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

/** 发布任务 */
export interface PublishTask {
  /** 任务 ID */
  id: string;
  /** 关联项目 */
  projectId: string;
  /** 发布版本号 */
  version: string;
  /** 当前状态 */
  status: BuildStatus;
  /** 进度百分比 (0-100) */
  progress: number;
  /** 发布日志 */
  logs: LogEntry[];
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
}
