import { request } from "@/utils/axios";
import type {
  TryInstantUploadParams,
  TryInstantUploadResponse,
  SignUploadFileInfoParams,
  SignUploadFileInfoResponse,
  CreateFileParams,
  CreateFileResponse,
  DeleteFileParams,
  DeleteFileResponse,
  DownloadFileParams,
  DownloadFileResponse,
  GetFileInfoParams,
  GetFileInfoResponse,
  GetFileListParams,
  GetFileListResponse,
  MoveFileParams,
  MoveFileResponse,
  RenameFileParams,
  RenameFileResponse,
  UploadFileParams,
  UploadFileResponse
} from "./types";
import type { ResponseBody } from "../types";

/**
 * 尝试秒传
 */
export const tryInstantUpload = (data: TryInstantUploadParams) => {
  return request<ResponseBody<TryInstantUploadResponse>>({
    url: "oss/tryInstantUpload",
    method: "post",
    data
  });
};

/**
 * 签名上传文件信息
 */
export const signUploadFileInfo = (data: SignUploadFileInfoParams) => {
  return request<ResponseBody<SignUploadFileInfoResponse>>({
    url: "oss/signUploadFileInfo",
    method: "post",
    data
  });
};

/**
 * 上传文件
 */
export const uploadFile = (data: UploadFileParams) => {
  return request<ResponseBody<UploadFileResponse>>({
    url: data.url,
    method: "put",
    headers: {
      ...data.headers,
      "Content-Type": data.file.type || "application/octet-stream"
    },
    data: data.file
  });
};

/**
 * 创建文件
 */
export const createFile = (data: CreateFileParams) => {
  return request<ResponseBody<CreateFileResponse>>({
    url: "/cloudDrive/createFile",
    method: "post",
    data
  });
};

/**
 * 移动文件
 */
export const moveFile = (data: MoveFileParams) => {
  return request<ResponseBody<MoveFileResponse>>({
    url: "/cloudDrive/moveFile",
    method: "post",
    data
  });
};

/**
 * 重命名文件
 */
export const renameFile = (data: RenameFileParams) => {
  return request<ResponseBody<RenameFileResponse>>({
    url: "/cloudDrive/renameFile",
    method: "post",
    data
  });
};

/**
 * 删除文件
 */
export const deleteFile = (data: DeleteFileParams) => {
  return request<ResponseBody<DeleteFileResponse>>({
    url: "/cloudDrive/deleteFile",
    method: "post",
    data
  });
};

/**
 * 下载文件
 */
export const downloadFile = (params: DownloadFileParams) => {
  return request<DownloadFileResponse>({
    url: `/cloudDrive/downloadFile/${params.id}`,
    method: "get",
    responseType: "blob"
  });
};

/**
 * 获取文件列表
 */
export const getFileList = (params: GetFileListParams) => {
  return request<GetFileListResponse>({
    url: "/cloudDrive/getFileList",
    method: "get",
    params
  });
};

/**
 * 获取文件详情
 */
export const getFileInfo = (params: GetFileInfoParams) => {
  return request<ResponseBody<GetFileInfoResponse>>({
    url: "/cloudDrive/getFileInfo",
    method: "get",
    params
  });
};
