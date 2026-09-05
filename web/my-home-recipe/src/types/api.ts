// ============================================================
// 后端 API 契约类型（与 my-home-service 返回结构对齐）
// ------------------------------------------------------------
// 服务端字段命名（recipeId/recipeName/createdTime…）与前端 UI
// 模型（id/name/createdAt…）不一致，由 store 层负责双向映射，
// 本文件只描述“线上格式”。
// ============================================================

import type { MediaKind } from './recipe'

/** 服务端媒体项 */
export interface ApiMedia {
  /** oss object 引用 id */
  refId: string
  kind: MediaKind
  name: string
  mimeType: string
  size: number
  width?: number
  height?: number
  duration?: number
}

/** 服务端菜谱 */
export interface ApiRecipe {
  recipeId: string
  recipeName: string
  note?: string
  medias?: ApiMedia[] | null
  createdTime: number
  updatedTime: number
  createUser: { userId: number; userAccount: string; userName: string }
}

/** 分页数据 */
export interface ApiPage<T> {
  pageNum: number
  pageSize: number
  total: number
  records: T[]
}

/** 保存菜谱请求体（新建不带 recipeId，编辑带） */
export interface SaveRecipeParam {
  recipeId?: string
  recipeName: string
  note?: string
  medias: ApiMedia[]
}

/* ---------------- 鉴权 ---------------- */

export interface LoginParam {
  userAccount: string
  password: string
}

export interface LoginResult {
  token: string
  user: { userAccount: string; userName?: string; avatarUrl?: string }
}

export interface RegisterParam {
  userAccount: string
  password: string
  userName: string
}

/* ---------------- OSS ---------------- */

export interface UploadFileParam {
  fileName: string
  fileHash: string
  fileSize: number
  fileMime: string
}

export interface UploadFileResult {
  /** 是否已上传（秒传，无需直传） */
  isUploaded: boolean
  /** 已上传时的 oss 引用 id */
  ossObjectRefId?: string
  signData?: {
    signUrl?: string
    signHeaders?: Record<string, string | number | boolean>
  }
}
