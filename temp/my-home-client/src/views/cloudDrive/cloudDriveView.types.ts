import type { FileInfo } from "@/api/cloudDrive/interfaces";

/**
 * 文件项
 */
export type FileItem = FileInfo;

// 文件类型枚举
export enum FileType {
  FOLDER = "folder",
  FILE = "file"
}

// 视图模式类型
export type ViewMode = "list" | "grid";

// 面包屑路径接口
export interface BreadcrumbPath {
  name: string;
  path: string;
}

// 搜索参数接口
export interface SearchParams {
  keyword: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 文件列表响应接口
export interface FileListResponse {
  files: FileItem[];
  total: number;
  page: number;
  pageSize: number;
}
