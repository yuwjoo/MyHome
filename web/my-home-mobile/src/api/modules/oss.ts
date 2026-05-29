/**
 * src/api/modules/oss.ts —— OSS 对象存储相关接口
 */
import type { ServerApi } from '../types/serverApi'
import type { ResponseBody } from '@/api/types/common'
import { request } from '@/utils/request'

/** OSS 上传回调 */
export function ossUploadCallback(data: ServerApi['/oss/uploadCallback']['config']['data']) {
  return request<ResponseBody<ServerApi['/oss/uploadCallback']['response']>>({
    url: '/oss/uploadCallback',
    method: 'POST',
    data,
  })
}

/** 上传文件 */
export function ossUploadFile(data: ServerApi['/oss/uploadFile']['config']['data']) {
  return request<ResponseBody<ServerApi['/oss/uploadFile']['response']>>({
    url: '/oss/uploadFile',
    method: 'POST',
    data,
  })
}

/** 获取公共文件缩略图 */
export function ossGetPublicFileThumbnail(params: ServerApi['/oss/getPublicFileThumbnail']['config']['params']) {
  return request<ResponseBody<ServerApi['/oss/getPublicFileThumbnail']['response']>>({
    url: '/oss/getPublicFileThumbnail',
    method: 'GET',
    params,
  })
}

/** 获取公共文件下载 URL */
export function ossGetPublicFileDownloadUrl(params: ServerApi['/oss/getPublicFileDownloadUrl']['config']['params']) {
  return request<ResponseBody<ServerApi['/oss/getPublicFileDownloadUrl']['response']>>({
    url: '/oss/getPublicFileDownloadUrl',
    method: 'GET',
    params,
  })
}
