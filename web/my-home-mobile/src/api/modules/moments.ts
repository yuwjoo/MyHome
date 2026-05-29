/**
 * src/api/modules/moments.ts —— 说说/动态相关接口
 */
import type { ServerApi } from '../types/serverApi'
import type { ResponseBody } from '@/api/types/common'
import { request } from '@/utils/request'

/** 保存说说 */
export function momentsSavePost(data: ServerApi['/moments/savePost']['config']['data']) {
  return request<ResponseBody<ServerApi['/moments/savePost']['response']>>({ url: '/moments/savePost', method: 'POST', data })
}

/** 删除说说 */
export function momentsDeletePost(data: ServerApi['/moments/deletePost']['config']['data']) {
  return request<ResponseBody<ServerApi['/moments/deletePost']['response']>>({ url: '/moments/deletePost', method: 'POST', data })
}

/** 获取说说列表 */
export function momentsGetPostList(params: ServerApi['/moments/getPostList']['config']['params']) {
  return request<ResponseBody<ServerApi['/moments/getPostList']['response']>>({ url: '/moments/getPostList', method: 'GET', params })
}

/** 点赞/取消点赞说说 */
export function momentsLikePost(data: ServerApi['/moments/likePost']['config']['data']) {
  return request<ResponseBody<ServerApi['/moments/likePost']['response']>>({ url: '/moments/likePost', method: 'POST', data })
}

/** 评论说说 */
export function momentsCommentPost(data: ServerApi['/moments/commentPost']['config']['data']) {
  return request<ResponseBody<ServerApi['/moments/commentPost']['response']>>({ url: '/moments/commentPost', method: 'POST', data })
}

/** 删除评论 */
export function momentsDeletePostComment(data: ServerApi['/moments/deletePostComment']['config']['data']) {
  return request<ResponseBody<ServerApi['/moments/deletePostComment']['response']>>({ url: '/moments/deletePostComment', method: 'POST', data })
}
