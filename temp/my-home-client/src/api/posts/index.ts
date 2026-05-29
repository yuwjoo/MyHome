import { request } from "@/utils/axios";
import { uploadFile } from "@/utils/oss";
import type {
  CreateCommentParams,
  CreateCommentResponse,
  CreatePostParams,
  GetAllPostsParams,
  GetAllPostsResponse,
  LikePostParams,
  Post,
  ToggleLikePostResponse
} from "./types";
import type { ResponseBody, ResponseListBody } from "../types";

/**
 * 上传说说文件
 */
export const uploadPostsFile = async (file: File) => {
  return await uploadFile({ file, uploadDir: "postsFiles" });
};

/**
 * 创建新说说
 * @param params 创建说说的参数
 * @returns 创建的说说信息
 */
export const createPost = async (params: CreatePostParams) => {
  return request<ResponseBody<Post>>({
    url: "/posts",
    method: "post",
    data: params
  });
};

/**
 * 获取所有说说列表
 * @returns 说说列表
 */
export const getAllPosts = async (params: GetAllPostsParams) => {
  return request<ResponseListBody<GetAllPostsResponse>>({
    url: "/posts",
    method: "get",
    params
  });
};

/**
 * 点赞/取消点赞说说
 * @param params 点赞参数，包含说说ID和用户ID
 * @returns 更新后的说说信息
 */
export const toggleLikePost = async (params: LikePostParams) => {
  return request<ResponseBody<ToggleLikePostResponse>>({
    url: `/posts/${params.id}/like`,
    method: "post",
    data: params
  });
};

/**
 * 根据ID获取单条说说详情
 * @param id 说说ID
 * @returns 说说详情
 */
export const getPostById = async (id: number) => {
  return request<ResponseBody<Post>>({
    url: `/posts/${id}`,
    method: "get"
  });
};

/**
 * 删除说说
 * @param id 说说ID
 */
export const deletePost = async (id: number) => {
  return request<ResponseBody<void>>({
    url: `/posts/${id}`,
    method: "delete"
  });
};

/**
 * 创建评论
 * @param id 说说ID
 * @param params 创建评论的参数
 * @returns 创建的评论信息
 */
export const createComment = async (id: number, params: CreateCommentParams) => {
  return request<ResponseBody<CreateCommentResponse>>({
    url: `/posts/${id}/comments`,
    method: "post",
    data: params
  });
};
