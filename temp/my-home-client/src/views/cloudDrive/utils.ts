import type { FileItem } from "./cloudDriveView.types";
import { FileType } from "./cloudDriveView.types";

/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns 文件扩展名（不含点）
 */
export const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return "";
  return fileName.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 * @returns 格式化后的文件大小（如：1.23 MB）
 */
export const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};

/**
 * 格式化日期时间
 * @param dateStr ISO日期字符串
 * @returns 格式化后的日期时间（如：2023-12-14 11:42）
 */
export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 格式化日期（不含时间）
 * @param dateStr ISO日期字符串
 * @returns 格式化后的日期（如：2023-12-14）
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * 解析文件路径为面包屑
 * @param path 文件路径
 * @returns 面包屑数组
 */
export const parsePathToBreadcrumb = (path: string): string[] => {
  // 去除首尾斜杠
  const cleanedPath = path.replace(/^\/|\/$/g, "");
  if (!cleanedPath) return ["根目录"];

  const breadcrumb = cleanedPath.split("/");
  return ["根目录", ...breadcrumb];
};

/**
 * 构建完整路径
 * @param breadcrumb 面包屑数组
 * @returns 完整路径
 */
export const buildFullPath = (breadcrumb: string[]): string => {
  if (breadcrumb.length <= 1) return "/";
  return `/${breadcrumb.slice(1).join("/")}/`;
};

/**
 * 根据文件名获取文件类型
 * @param fileName 文件名
 * @returns 文件类型
 */
export const getFileTypeByFileName = (fileName: string): FileType => {
  if (fileName.includes(".")) {
    return FileType.FILE;
  }
  return FileType.FOLDER;
};

/**
 * 生成唯一ID
 * @returns 唯一ID
 */
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 过滤文件列表
 * @param files 文件列表
 * @param keyword 搜索关键词
 * @returns 过滤后的文件列表
 */
export const filterFiles = (files: FileItem[], keyword: string): FileItem[] => {
  if (!keyword) return files;

  const lowerKeyword = keyword.toLowerCase();
  return files.filter((file) => file.name.toLowerCase().includes(lowerKeyword));
};

/**
 * 排序文件列表
 * @param files 文件列表
 * @param sortBy 排序字段
 * @param sortOrder 排序顺序
 * @returns 排序后的文件列表
 */
// export const sortFiles = (files: FileItem[], sortBy = "updateTime", sortOrder: "asc" | "desc" = "desc"): FileItem[] => {
//   return [...files].sort((a, b) => {
//     // 文件夹始终排在前面
//     if (a.type === FileType.FOLDER && b.type !== FileType.FOLDER) return -1;
//     if (a.type !== FileType.FOLDER && b.type === FileType.FOLDER) return 1;

//     // 按指定字段排序
//     let aValue: any = a[sortBy as keyof FileItem];
//     let bValue: any = b[sortBy as keyof FileItem];

//     // 处理日期类型
//     if (sortBy === "updateTime" || sortBy === "createTime") {
//       aValue = new Date(aValue).getTime();
//       bValue = new Date(bValue).getTime();
//     }

//     if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
//     if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
//     return 0;
//   });
// };
