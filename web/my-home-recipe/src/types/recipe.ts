// ============================================================
// 领域模型（Recipe / Media）
// ------------------------------------------------------------
// 设计说明（已对接云端 my-home-service）：
//  - 菜谱数据保存在服务端；图片/视频直传 OSS，菜谱媒体只保存
//    元信息 + OSS 引用 id（refId）。
//  - 后端返回的媒体（id === refId）由缩略图接口按 refId 实时
//    加载；本地 thumbnail 仅用于「编辑器中尚未保存的新增文件」
//    的即时预览。
// ============================================================

/** 媒体类型 */
export type MediaKind = 'image' | 'video'

/** 单个媒体文件的元信息 */
export interface RecipeMedia {
  /** 媒体唯一 id（本地 UI key；已同步到服务端的媒体其 id 即 refId） */
  id: string
  /** 已上传到 OSS 后的引用 id（保存过/服务端返回则有） */
  refId?: string
  kind: MediaKind
  /** 原始文件名（保留展示用） */
  name: string
  /** MIME 类型 */
  mimeType: string
  /** 文件大小（字节） */
  size: number
  /** 原始像素宽度（图片/视频） */
  width?: number
  /** 原始像素高度 */
  height?: number
  /** 视频时长（秒，仅视频） */
  duration?: number
  /**
   * 本地预览缩略图（dataURL）：仅编辑器「新增未保存」的文件有；
   * 已上传媒体请用 refId 走服务端缩略图接口加载。
   */
  thumbnail?: string
}

/** 一份菜谱 */
export interface Recipe {
  /** 菜谱 id（服务端 recipeId） */
  id: string
  /** 菜谱名称 */
  name: string
  /** 备注说明 */
  note: string
  /** 媒体清单（仅元信息） */
  medias: RecipeMedia[]
  /** 创建时间戳（ms） */
  createdAt: number
  /** 最近更新时间戳（ms） */
  updatedAt: number
}

/**
 * 保存/更新菜谱时的媒体输入项
 *  - blob 有值：新选择的文件，保存前需先上传 OSS 换取 refId
 *  - blob 为 null：服务端已存在的媒体（保留即可，meta.refId 必填）
 */
export interface MediaInput {
  meta: RecipeMedia
  blob: Blob | null
}
