import { cloudDiskCreate, ossUploadFile } from "@/api/base";
import { calcFileHash } from "./hash";
import axios, { type AxiosResponse } from "axios";
import type { ServerApi } from "@/api/base/types";
import type { ResponseBody } from "@/api/types";

/**
 * 上传文件
 * @param file 文件
 * @param uploadFilePath 上传文件路径
 */
export const uploadFile = async (file: File, uploadFilePath: string) => {
  const res = await ossUploadFile({
    fileName: file.name,
    fileHash: await calcFileHash(file),
    fileSize: file.size,
    fileMime: file.type
  });

  let ossObjectRefId = res.data.data.ossObjectRefId;

  if (!res.data.data.isUploaded) {
    const putRes = await axios<any, AxiosResponse<ResponseBody<ServerApi["/oss/uploadCallback"]["response"]>>>({
      url: res.data.data.signData?.signUrl,
      method: "put",
      headers: {
        ...res.data.data.signData?.signHeaders,
        "Content-Type": file.type || "application/octet-stream"
      },
      data: file
    });
    ossObjectRefId = putRes.data.data;
  }

  await cloudDiskCreate({
    path: uploadFilePath,
    type: "file",
    ossObjectRefId
  });
};
