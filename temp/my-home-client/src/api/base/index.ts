import type { ServerApi } from "@/api/base/types";
import type { ResponseBody } from "@/api/types";
import { request } from "@/utils/axios";

/**
 * 注册新用户
 */
export function systemAuthRegister(data: ServerApi["/system/auth/register"]["config"]["data"]) {
  const config: ServerApi["/system/auth/register"]["config"] = {
    url: "/system/auth/register",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/system/auth/register"]["response"]>>(config);
}

/**
 * 用户登录
 */
export function systemAuthLogin(data: ServerApi["/system/auth/login"]["config"]["data"]) {
  const config: ServerApi["/system/auth/login"]["config"] = {
    url: "/system/auth/login",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/system/auth/login"]["response"]>>(config);
}

/**
 * oss上传回调
 */
export function ossUploadCallback(data: ServerApi["/oss/uploadCallback"]["config"]["data"]) {
  const config: ServerApi["/oss/uploadCallback"]["config"] = {
    url: "/oss/uploadCallback",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/oss/uploadCallback"]["response"]>>(config);
}

/**
 * 上传文件
 */
export function ossUploadFile(data: ServerApi["/oss/uploadFile"]["config"]["data"]) {
  const config: ServerApi["/oss/uploadFile"]["config"] = {
    url: "/oss/uploadFile",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/oss/uploadFile"]["response"]>>(config);
}

/**
 * 获取公共文件缩略图
 */
export function ossGetPublicFileThumbnail(params: ServerApi["/oss/getPublicFileThumbnail"]["config"]["params"]) {
  const config: ServerApi["/oss/getPublicFileThumbnail"]["config"] = {
    url: "/oss/getPublicFileThumbnail",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/oss/getPublicFileThumbnail"]["response"]>>(config);
}

/**
 * 获取公共文件下载url
 */
export function ossGetPublicFileDownloadUrl(params: ServerApi["/oss/getPublicFileDownloadUrl"]["config"]["params"]) {
  const config: ServerApi["/oss/getPublicFileDownloadUrl"]["config"] = {
    url: "/oss/getPublicFileDownloadUrl",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/oss/getPublicFileDownloadUrl"]["response"]>>(config);
}

/**
 * 获取城市天气列表
 */
export function weatherGetCityWeatherList(params: ServerApi["/weather/getCityWeatherList"]["config"]["params"]) {
  const config: ServerApi["/weather/getCityWeatherList"]["config"] = {
    url: "/weather/getCityWeatherList",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/weather/getCityWeatherList"]["response"]>>(config);
}

/**
 * 获取天气
 */
export function weatherGetWeather(params: ServerApi["/weather/getWeather"]["config"]["params"]) {
  const config: ServerApi["/weather/getWeather"]["config"] = {
    url: "/weather/getWeather",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/weather/getWeather"]["response"]>>(config);
}

/**
 * 获取快递信息
 */
export function expressGetExpressInfo(params: ServerApi["/express/getExpressInfo"]["config"]["params"]) {
  const config: ServerApi["/express/getExpressInfo"]["config"] = {
    url: "/express/getExpressInfo",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/express/getExpressInfo"]["response"]>>(config);
}

/**
 * 根据快递单号查询快递公司
 */
export function expressQueryCompanyByOrderNumber(
  params: ServerApi["/express/queryCompanyByOrderNumber"]["config"]["params"]
) {
  const config: ServerApi["/express/queryCompanyByOrderNumber"]["config"] = {
    url: "/express/queryCompanyByOrderNumber",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/express/queryCompanyByOrderNumber"]["response"]>>(config);
}

/**
 * 创建文件/目录
 */
export function cloudDiskCreate(data: ServerApi["/cloudDisk/create"]["config"]["data"]) {
  const config: ServerApi["/cloudDisk/create"]["config"] = {
    url: "/cloudDisk/create",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/cloudDisk/create"]["response"]>>(config);
}

/**
 * 删除文件/目录
 */
export function cloudDiskDelete(data: ServerApi["/cloudDisk/delete"]["config"]["data"]) {
  const config: ServerApi["/cloudDisk/delete"]["config"] = {
    url: "/cloudDisk/delete",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/cloudDisk/delete"]["response"]>>(config);
}

/**
 * 移动文件/目录
 */
export function cloudDiskMove(data: ServerApi["/cloudDisk/move"]["config"]["data"]) {
  const config: ServerApi["/cloudDisk/move"]["config"] = {
    url: "/cloudDisk/move",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/cloudDisk/move"]["response"]>>(config);
}

/**
 * 重命名文件/目录
 */
export function cloudDiskRename(data: ServerApi["/cloudDisk/rename"]["config"]["data"]) {
  const config: ServerApi["/cloudDisk/rename"]["config"] = {
    url: "/cloudDisk/rename",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/cloudDisk/rename"]["response"]>>(config);
}

/**
 * 获取单个文件/目录信息
 */
export function cloudDiskGetInfo(params: ServerApi["/cloudDisk/getInfo"]["config"]["params"]) {
  const config: ServerApi["/cloudDisk/getInfo"]["config"] = {
    url: "/cloudDisk/getInfo",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/cloudDisk/getInfo"]["response"]>>(config);
}

/**
 * 获取文件列表
 */
export function cloudDiskGetList(params: ServerApi["/cloudDisk/getList"]["config"]["params"]) {
  const config: ServerApi["/cloudDisk/getList"]["config"] = {
    url: "/cloudDisk/getList",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/cloudDisk/getList"]["response"]>>(config);
}

/**
 * 获取文件缩略图
 */
export function cloudDiskGetFileThumbnail(params: ServerApi["/cloudDisk/getFileThumbnail"]["config"]["params"]) {
  const config: ServerApi["/cloudDisk/getFileThumbnail"]["config"] = {
    url: "/cloudDisk/getFileThumbnail",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/cloudDisk/getFileThumbnail"]["response"]>>(config);
}

/**
 * 获取文件下载url
 */
export function cloudDiskGetFileDownloadUrl(params: ServerApi["/cloudDisk/getFileDownloadUrl"]["config"]["params"]) {
  const config: ServerApi["/cloudDisk/getFileDownloadUrl"]["config"] = {
    url: "/cloudDisk/getFileDownloadUrl",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/cloudDisk/getFileDownloadUrl"]["response"]>>(config);
}

/**
 * 获取回收站文件列表
 */
export function cloudDiskGetRecycleBinList() {
  const config: ServerApi["/cloudDisk/getRecycleBinList"]["config"] = {
    url: "/cloudDisk/getRecycleBinList",
    method: "GET"
  };
  return request<ResponseBody<ServerApi["/cloudDisk/getRecycleBinList"]["response"]>>(config);
}

/**
 * 清空回收站
 */
export function cloudDiskClearRecycleBin() {
  const config: ServerApi["/cloudDisk/clearRecycleBin"]["config"] = {
    url: "/cloudDisk/clearRecycleBin",
    method: "POST"
  };
  return request<ResponseBody<ServerApi["/cloudDisk/clearRecycleBin"]["response"]>>(config);
}

/**
 * 保存说说
 */
export function momentsSavePost(data: ServerApi["/moments/savePost"]["config"]["data"]) {
  const config: ServerApi["/moments/savePost"]["config"] = {
    url: "/moments/savePost",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/moments/savePost"]["response"]>>(config);
}

/**
 * 删除说说
 */
export function momentsDeletePost(data: ServerApi["/moments/deletePost"]["config"]["data"]) {
  const config: ServerApi["/moments/deletePost"]["config"] = {
    url: "/moments/deletePost",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/moments/deletePost"]["response"]>>(config);
}

/**
 * 获取说说列表
 */
export function momentsGetPostList(params: ServerApi["/moments/getPostList"]["config"]["params"]) {
  const config: ServerApi["/moments/getPostList"]["config"] = {
    url: "/moments/getPostList",
    method: "GET",
    params
  };
  return request<ResponseBody<ServerApi["/moments/getPostList"]["response"]>>(config);
}

/**
 * 点赞/取消点赞说说
 */
export function momentsLikePost(data: ServerApi["/moments/likePost"]["config"]["data"]) {
  const config: ServerApi["/moments/likePost"]["config"] = {
    url: "/moments/likePost",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/moments/likePost"]["response"]>>(config);
}

/**
 * 评论说说
 */
export function momentsCommentPost(data: ServerApi["/moments/commentPost"]["config"]["data"]) {
  const config: ServerApi["/moments/commentPost"]["config"] = {
    url: "/moments/commentPost",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/moments/commentPost"]["response"]>>(config);
}

/**
 * 删除评论
 */
export function momentsDeletePostComment(data: ServerApi["/moments/deletePostComment"]["config"]["data"]) {
  const config: ServerApi["/moments/deletePostComment"]["config"] = {
    url: "/moments/deletePostComment",
    method: "POST",
    data
  };
  return request<ResponseBody<ServerApi["/moments/deletePostComment"]["response"]>>(config);
}
