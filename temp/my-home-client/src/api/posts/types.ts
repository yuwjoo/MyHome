import type { UserInfo } from "../auth/types";
import type { Pagination } from "../types";

/**
 * 评论数据接口
 */
export interface Comment {
  id: number; // 评论ID
  content: string; // 评论内容
  createdAt: string; // 创建时间
  user: UserInfo; // 评论用户信息
}

/**
 * 说说数据接口
 */
export interface Post {
  id: number; // 说说ID
  content: string; // 说说内容
  mediaUrls: string[]; // 媒体文件URL列表
  likeCount: number; // 点赞数量
  commentCount?: number; // 评论数量
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

/**
 * 创建说说请求参数
 */
export interface CreatePostParams {
  content: string; // 说说内容
  mediaUrls: string[]; // 媒体文件URL列表
}

/**
 * 获取说说列表参数
 */
export type GetAllPostsParams = Pick<Pagination, "current" | "size"> & {
  /** 搜索关键词（模糊匹配说说内容） */
  search?: string;
};

/**
 * 点赞/取消点赞的请求参数
 */
export interface LikePostParams {
  id: number; // 说说ID
}

/**
 * 获取所有说说响应数据
 */
export interface GetAllPostsResponse extends Post {
  user: UserInfo; // 说说发布用户
  liked: boolean; // 是否本人点赞
  comments: Comment[]; // 评论数据
}

/**
 * 点赞/取消点赞响应数据
 */
export interface ToggleLikePostResponse {
  likeCount: number; // 点赞数
  liked: boolean; // 自己是否点赞
}

/**
 * 创建评论请求参数
 */
export interface CreateCommentParams {
  content: string; // 评论内容
}

/**
 * 创建评论响应数据
 */
export type CreateCommentResponse = Comment;
