/**
 * src/api/modules/cloud-disk.ts —— 云盘相关接口
 */
import type { ServerApi } from '../types/serverApi'
import type { ResponseBody } from '@/api/types/common'
import { request } from '@/utils/request'

/** 创建文件/目录 */
export function cloudDiskCreate(data: ServerApi['/cloudDisk/create']['config']['data']) {
  return request<ResponseBody<ServerApi['/cloudDisk/create']['response']>>({ url: '/cloudDisk/create', method: 'POST', data })
}

/** 删除文件/目录 */
export function cloudDiskDelete(data: ServerApi['/cloudDisk/delete']['config']['data']) {
  return request<ResponseBody<ServerApi['/cloudDisk/delete']['response']>>({ url: '/cloudDisk/delete', method: 'POST', data })
}

/** 移动文件/目录 */
export function cloudDiskMove(data: ServerApi['/cloudDisk/move']['config']['data']) {
  return request<ResponseBody<ServerApi['/cloudDisk/move']['response']>>({ url: '/cloudDisk/move', method: 'POST', data })
}

/** 重命名文件/目录 */
export function cloudDiskRename(data: ServerApi['/cloudDisk/rename']['config']['data']) {
  return request<ResponseBody<ServerApi['/cloudDisk/rename']['response']>>({ url: '/cloudDisk/rename', method: 'POST', data })
}

/** 获取单个文件/目录信息 */
export function cloudDiskGetInfo(params: ServerApi['/cloudDisk/getInfo']['config']['params']) {
  return request<ResponseBody<ServerApi['/cloudDisk/getInfo']['response']>>({ url: '/cloudDisk/getInfo', method: 'GET', params })
}

/** 获取文件列表 */
export function cloudDiskGetList(params: ServerApi['/cloudDisk/getList']['config']['params']) {
  return request<ResponseBody<ServerApi['/cloudDisk/getList']['response']>>({ url: '/cloudDisk/getList', method: 'GET', params })
}

/** 获取文件缩略图 */
export function cloudDiskGetFileThumbnail(params: ServerApi['/cloudDisk/getFileThumbnail']['config']['params']) {
  return request<ResponseBody<ServerApi['/cloudDisk/getFileThumbnail']['response']>>({ url: '/cloudDisk/getFileThumbnail', method: 'GET', params })
}

/** 获取文件缩略图（Blob 响应，用于 <img> 展示） */
export function cloudDiskGetFileThumbnailBlob(params: { filePath: string; imageWidth?: number }) {
  return request.get('/cloudDisk/getFileThumbnail', { params, responseType: 'blob' })
}

/** 获取文件下载 URL */
export function cloudDiskGetFileDownloadUrl(params: ServerApi['/cloudDisk/getFileDownloadUrl']['config']['params']) {
  return request<ResponseBody<ServerApi['/cloudDisk/getFileDownloadUrl']['response']>>({ url: '/cloudDisk/getFileDownloadUrl', method: 'GET', params })
}

/** 获取回收站文件列表 */
export function cloudDiskGetRecycleBinList() {
  return request<ResponseBody<ServerApi['/cloudDisk/getRecycleBinList']['response']>>({ url: '/cloudDisk/getRecycleBinList', method: 'GET' })
}

/** 清空回收站 */
export function cloudDiskClearRecycleBin() {
  return request<ResponseBody<ServerApi['/cloudDisk/clearRecycleBin']['response']>>({ url: '/cloudDisk/clearRecycleBin', method: 'POST' })
}

/** 生成分享链接 */
export function cloudDiskCreateShareLink(data: { filePath: string; expiresIn: number }) {
  return request<ResponseBody<string>>({ url: '/cloudDisk/createShareLink', method: 'POST', data })
}
