// ============================================================
// 后端接口函数（鉴权 / 菜谱 / OSS）
// ============================================================

import { request } from './http'
import { API_BASE_URL } from './config'
import type {
  ApiPage,
  ApiRecipe,
  LoginParam,
  LoginResult,
  RegisterParam,
  SaveRecipeParam,
  UploadFileParam,
  UploadFileResult,
} from '@/types/api'

/** 鉴权接口（注册为公开接口，登录需同步等待服务端落库） */
export const authApi = {
  register(data: RegisterParam): Promise<void> {
    return request({
      url: '/system/auth/register',
      method: 'POST',
      data,
      public: true,
    })
  },
  login(data: LoginParam): Promise<LoginResult> {
    return request({ url: '/system/auth/login', method: 'POST', data, public: true })
  },
}

/** 菜谱接口 */
export const recipeApi = {
  /** 菜谱列表（分页 + 关键词模糊搜索） */
  list(params: { pageNum?: number; pageSize?: number; keywords?: string }): Promise<ApiPage<ApiRecipe>> {
    return request({ url: '/recipe/getRecipeList', method: 'GET', params })
  },
  /** 菜谱详情 */
  detail(recipeId: string): Promise<ApiRecipe> {
    return request({ url: '/recipe/getRecipe', method: 'GET', params: { recipeId } })
  },
  /** 新建 / 编辑菜谱 */
  save(data: SaveRecipeParam): Promise<ApiRecipe> {
    return request({ url: '/recipe/saveRecipe', method: 'POST', data })
  },
  /** 删除菜谱 */
  remove(recipeId: string): Promise<void> {
    return request({ url: '/recipe/deleteRecipe', method: 'POST', data: { recipeId } })
  },
}

/** OSS 接口 */
export const ossApi = {
  /** 上传前登记：返回秒传结果或直传签名 */
  uploadFile(param: UploadFileParam): Promise<UploadFileResult> {
    return request({ url: '/oss/uploadFile', method: 'POST', data: param })
  },
  /** 获取媒体下载直链（需登录；attachment，触发下载，用于原图/文件下载） */
  getPublicFileDownloadUrl(ossObjectRefId: string): Promise<string> {
    return request({
      url: '/oss/getPublicFileDownloadUrl',
      method: 'GET',
      params: { ossObjectRefId },
    })
  },
  /** 获取媒体播放直链（需登录；inline，供 <video> 内联播放，不触发下载） */
  getPublicFilePlayUrl(ossObjectRefId: string): Promise<string> {
    return request({
      url: '/oss/getPublicFilePlayUrl',
      method: 'GET',
      params: { ossObjectRefId },
    })
  },
}

/** 媒体缩略图公开直链（图片缩放 / 视频截帧），可直接作为 <img src> */
export function mediaThumbnailUrl(ossObjectRefId: string, width = 520): string {
  return `${API_BASE_URL}/oss/getPublicFileThumbnail?ossObjectRefId=${encodeURIComponent(
    ossObjectRefId,
  )}&imageWidth=${width}`
}
