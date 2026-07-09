/**
 * 发布任务相关类型定义
 */

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

/** 发布任务 */
export interface PublishTask {
  /** 任务 ID */
  id: string;
  /** 关联项目标识 */
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
