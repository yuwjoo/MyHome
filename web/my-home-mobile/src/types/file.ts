// ── 文件/云盘相关类型 ──────────────────────────────────────────────────────────

/** 前端文件类型 */
export type FileType = 'folder' | 'image' | 'video' | 'audio' | 'doc' | 'zip' | 'default'

/** 前端文件列表项 */
export interface FileItem {
  id: string
  name: string
  type: FileType
  size?: string
  modifiedAt: string
  path: string
  thumbnailUrl?: string
  childCount?: number
}

/** 面包屑导航项 */
export interface BreadcrumbItem {
  label: string
  path: string
}

// ── Cloud Disk API DTO ─────────────────────────────────────────────────────────

/** 后端云盘文件列表项 */
export interface CloudDiskFileItemDto {
  fileId: string
  fileName: string
  fileSize?: number
  mimeType?: string
  fileType: 'directory' | 'file'
  filePath: string
  fileDepth: number
  parentPath: string
  createdTime: number
  updatedTime: number
}

/** MIME 类型 → 前端 FileType */
export function mimeToFileType(mime?: string): FileType {
  if (!mime) return 'default'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (/pdf|document|sheet|presentation|msword|officedocument/.test(mime)) return 'doc'
  if (/zip|rar|tar|7z|compress|gzip/.test(mime)) return 'zip'
  return 'default'
}

/** 将后端 DTO 映射为前端 FileItem */
export function mapDtoToFileItem(dto: CloudDiskFileItemDto): FileItem {
  return {
    id: dto.fileId,
    name: dto.fileName,
    type: dto.fileType === 'directory' ? 'folder' : mimeToFileType(dto.mimeType),
    size: dto.fileSize !== undefined ? formatFileSize(dto.fileSize) : undefined,
    modifiedAt: new Date(dto.updatedTime).toISOString(),
    path: dto.filePath,
  }
}

/** 字节数 → 可读大小字符串 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
