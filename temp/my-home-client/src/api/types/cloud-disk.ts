// 云盘相关类型定义

/**
 * 文件夹类型
 */
export interface Folder {
  /** 文件夹唯一标识符 */
  id: string;
  /** 文件夹名称 */
  name: string;
  /** 更新时间 */
  updatedAt: string;
  /** 父文件夹ID，根目录为'root' */
  parentId?: string;
}

/**
 * 文件类型
 */
export interface File {
  /** 文件唯一标识符 */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件MIME类型 */
  type: string;
  /** 文件大小（字节） */
  size: number;
  /** 更新时间 */
  updatedAt: string;
  /** 文件访问URL */
  url: string;
  /** 父文件夹ID，根目录为'root' */
  parentId?: string;
}

/**
 * 存储信息类型
 */
export interface StorageInfo {
  /** 已用空间（字节） */
  used: number;
  /** 总空间（字节） */
  total: number;
}

/**
 * 文件列表响应类型
 */
export interface FileListResponse {
  /** 文件夹列表 */
  folders: Folder[];
  /** 文件列表 */
  files: File[];
}

/**
 * 创建文件夹请求参数类型
 */
export interface CreateFolderParams {
  /** 文件夹名称 */
  name: string;
  /** 父文件夹ID，根目录为'root' */
  parentId?: string;
}

/**
 * 重命名请求参数类型
 */
export interface RenameParams {
  /** 新名称 */
  newName: string;
}

/**
 * 移动请求参数类型
 */
export interface MoveParams {
  /** 新的父文件夹ID */
  newParentId: string;
}
