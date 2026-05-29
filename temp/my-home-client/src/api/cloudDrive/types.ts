import type { ListData, ResponseBody } from "../types";
import type { UploadUrlInfo, OssFileIdInfo, FileInfo } from "./interfaces";

/**
 * 尝试秒传-请求参数
 */
export type TryInstantUploadParams = {
  hash: string; // 文件哈希值
  size: number; // 文件大小
  name: string; // 文件名称
  mimeType: string; // 文件类型
};

/**
 * 尝试秒传-响应数据
 */
export type TryInstantUploadResponse = UploadUrlInfo | OssFileIdInfo;

/**
 * 签名上传文件信息-请求参数
 */
export type SignUploadFileInfoParams = {
  hash: string; // 文件hash
  name: string; // 文件名称
  mimeType: string; // 文件mimeType
};

/**
 * 签名上传文件信息-响应数据
 */
export type SignUploadFileInfoResponse = {
  uploadUrl: string; // 上传文件url
  extraHeaders: Record<string, string | number | boolean>; // 额外请求头
};

/**
 * 上传文件-请求参数
 */
export type UploadFileParams = {
  url: string; // 上传文件url
  headers: Record<string, string | number | boolean>; // 请求头
  file: File; // 文件
};
/**
 * 上传文件-响应数据
 */
export type UploadFileResponse = string;

/**
 * 创建文件-请求参数
 */
export type CreateFileParams = {
  name: string; // 文件名称
  type: "file" | "directory"; // 文件类型
  ossFileId: string; // oss文件id
  parentId: string; // 父级id
};

/**
 * 创建文件-响应数据
 */
export type CreateFileResponse = FileInfo;

/**
 * 移动文件-请求参数
 */
export type MoveFileParams = {
  id: string; // 文件id
  parentId: string; // 父级id
};

/**
 * 移动文件-响应数据
 */
export type MoveFileResponse = FileInfo;

/**
 * 重命名文件-请求参数
 */
export type RenameFileParams = {
  id: string; // 文件id
  name: string; // 文件名称
};

/**
 * 重命名文件-响应数据
 */
export type RenameFileResponse = FileInfo;

/**
 * 删除文件-请求参数
 */
export type DeleteFileParams = {
  id: string; // 文件id
};

/**
 * 删除文件-响应数据
 */
export type DeleteFileResponse = void;

/**
 * 下载文件-请求参数
 */
export type DownloadFileParams = {
  id: string; // 文件id
};

/**
 * 下载文件-响应数据
 */
export type DownloadFileResponse = Blob;

/**
 * 获取文件详情-请求参数
 */
export type GetFileInfoParams = {
  id: string; // 文件id
};

/**
 * 获取文件详情-响应数据
 */
export type GetFileInfoResponse = FileInfo;

/**
 * 获取文件列表-请求参数
 */
export type GetFileListParams = {
  current: number; // 当前页
  size: number; // 每页条数
  search?: string; // 模糊搜索值
  parentPath?: string; // 父文件夹路径，为空则获取根目录文件
};

/**
 * 获取文件列表-响应数据
 */
export type GetFileListResponse = ResponseBody<
  ListData<FileInfo> & {
    dirId: string; // 当前目录ID
  }
>;
