/**
 * 发布功能相关类型定义
 */

/** 项目平台类型 */
export type PlatformType = 'harmony' | 'android' | 'ios' | 'web';

/** 构建环境 */
export type BuildEnv = 'dev' | 'test' | 'prod';

/** 项目配置 */
export interface ProjectConfig {
  /** 项目唯一标识 */
  id: string;
  /** 项目名称 */
  name: string;
  /** 所属平台 */
  platform: PlatformType;
  /** 项目本地路径 */
  path: string;
  /** 构建脚本命令 */
  buildCommand: string;
  /** 输出目录（相对于项目路径） */
  outputDir: string;
  /** 发布目标地址/配置 */
  publishTarget?: string;
}

/** 构建任务状态 */
export type BuildStatus = 'idle' | 'building' | 'success' | 'failed';

/** 构建日志条目 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: number;
  /** 日志级别 */
  level: 'info' | 'warn' | 'error';
  /** 日志内容 */
  message: string;
}

/** 构建任务 */
export interface BuildTask {
  /** 任务 ID */
  id: string;
  /** 关联项目 */
  projectId: string;
  /** 构建环境 */
  env: BuildEnv;
  /** 当前状态 */
  status: BuildStatus;
  /** 构建日志 */
  logs: LogEntry[];
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
  /** 产物路径 */
  artifactPath?: string;
}

/** 发布配置表单 */
export interface PublishForm {
  /** 选中的项目 ID */
  projectId: string;
  /** 构建环境 */
  env: BuildEnv;
  /** 版本号 */
  version: string;
  /** 发布描述 */
  description: string;
  /** 是否自动发布 */
  autoPublish: boolean;
}
