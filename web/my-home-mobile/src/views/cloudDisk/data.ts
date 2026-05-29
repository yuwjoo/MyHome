import { toast } from 'vue-sonner'
import {
  cloudDiskGetList,
  cloudDiskCreate,
  cloudDiskDelete,
  cloudDiskMove,
  cloudDiskRename,
  cloudDiskGetInfo,
} from '@/api'
import type { FileItem, CloudDiskFileItemDto, FileType } from '@/types'
import { mapDtoToFileItem } from '@/types'

// ─── API 服务层（替换原 Mock 数据）─────────────────────────────────────────────

/** 获取指定目录下的文件列表（文件夹优先，各自内部按名称排序） */
export async function fetchFileList(parentPath: string = '/'): Promise<FileItem[]> {
  const res = await cloudDiskGetList({ parentPath })
  const list = (res.data.data as CloudDiskFileItemDto[]).map(mapDtoToFileItem)
  return sortFoldersFirst(list)
}

/** 排序：文件夹在前，文件在后；同类按名称升序 */
export function sortFoldersFirst(list: FileItem[]): FileItem[] {
  return [...list].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name, 'zh-Hans-CN')
  })
}

/** 创建文件夹 */
export async function createFolder(name: string, parentPath: string): Promise<FileItem> {
  const folderPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`
  const res = await cloudDiskCreate({ path: folderPath, type: 'directory' })
  return mapDtoToFileItem(res.data.data as CloudDiskFileItemDto)
}

/** 删除文件/目录 */
export async function deleteFile(path: string): Promise<void> {
  await cloudDiskDelete({ path })
}

/** 重命名文件/目录 */
export async function renameFile(path: string, newFileName: string): Promise<FileItem> {
  const res = await cloudDiskRename({ path, newFileName })
  return mapDtoToFileItem(res.data.data as CloudDiskFileItemDto)
}

/** 移动文件/目录 */
export async function moveFile(path: string, targetParentPath: string): Promise<FileItem> {
  const res = await cloudDiskMove({ path, parentPath: targetParentPath })
  return mapDtoToFileItem(res.data.data as CloudDiskFileItemDto)
}

/** 获取文件详情 */
export async function fetchFileInfo(path: string): Promise<FileItem> {
  const res = await cloudDiskGetInfo({ path })
  return mapDtoToFileItem(res.data.data as CloudDiskFileItemDto)
}

// ─── 类型筛选 ──────────────────────────────────────────────────────────────────

export type FileTypeFilter = 'all' | FileType

// ─── 文件夹树节点（用于 MoveFileView）──────────────────────────────────────────

export interface FolderNode {
  id: string
  name: string
  path: string
  children?: FolderNode[]
}

/** 从 DTO 列表构建文件夹树节点 */
export function buildFolderTree(items: CloudDiskFileItemDto[]): FolderNode[] {
  return items
    .filter((d) => d.fileType === 'directory')
    .map((d) => ({
      id: d.fileId,
      name: d.fileName,
      path: d.filePath,
      children: undefined, // 懒加载
    }))
}

/** 加载指定路径的子文件夹 */
export async function loadFolderChildren(parentPath: string): Promise<FolderNode[]> {
  const res = await cloudDiskGetList({ parentPath })
  return buildFolderTree(res.data.data as CloudDiskFileItemDto[])
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

export function formatDate(str: string) {
  const d = new Date(str)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
}

export function formatDateTime(str: string) {
  const d = new Date(str)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}  ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** 刷新文件列表（Toast 提示用） */
export function notifyRefreshSuccess() {
  toast.success('云盘文件已刷新')
}
