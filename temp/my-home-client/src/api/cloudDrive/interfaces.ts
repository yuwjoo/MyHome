/**
 * 上传url信息
 */
export interface UploadUrlInfo {
  uploadUrl: string; // 上传url
  extraHeaders: Record<string, string | number | boolean>; // 额外请求头
}

/**
 * oss文件id信息
 */
export interface OssFileIdInfo {
  ossFileId: string; // oss文件id
}

/**
 * 文件信息
 */
export interface FileInfo {
  id: string; // 文件id
  name: string; // 文件名称
  size: number; // 文件大小
  mimeType: string; // 文件mimeType
  imageInfo?: ImageInfo; // 图片信息
  type: "file" | "directory"; // 文件类型
  parentId: string; // 父级id
  parentPath: string; // 父级路径
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

/**
 * 图片信息
 */
export interface ImageInfo {
  width: number; // 宽度
  height: number; // 高度
  format: string; // 格式
}
