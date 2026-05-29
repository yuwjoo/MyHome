import OSS from "ali-oss";
import type { UploadFileOptions, CacheSignUrlInfo, GetOssLinkSignUrlOptions, ParseOssLinkResult } from "./types";
import { useAuthStore } from "@/store/auth";
import { getSTSInfo } from "@/api/auth";
import { join } from "../path";
import type { STSInfo } from "@/api/auth/types";
import type { ResponseBody } from "@/api/types";
import type { AxiosResponse } from "axios";

const cacheSignUrlMap = new Map<string, CacheSignUrlInfo>(); // 缓存签名地址map
let ossClient: OSS; // oss客户端实例
let globalGetSTSInfoPromise: Promise<AxiosResponse<ResponseBody<STSInfo>, any>> | null = null; // 全局获取sts信息接口Promise

/**
 * 获取oss客户端
 * @returns oss客户端实例
 */
export const getOssClient = async () => {
  if (ossClient) return ossClient;

  const authStore = useAuthStore();
  if (!authStore.stsInfo || Date.now() >= new Date(authStore.stsInfo.expiration).getTime()) {
    if (globalGetSTSInfoPromise === null) {
      globalGetSTSInfoPromise = getSTSInfo().finally(() => (globalGetSTSInfoPromise = null));
    }
    const res = await globalGetSTSInfoPromise;
    authStore.stsInfo = res.data.data;
  }

  ossClient = new OSS({
    accessKeyId: authStore.stsInfo.accessKeyId,
    accessKeySecret: authStore.stsInfo.accessKeySecret,
    stsToken: authStore.stsInfo.stsToken,
    refreshSTSToken: async () => {
      const res = await getSTSInfo();
      return {
        accessKeyId: res.data.data.accessKeyId,
        accessKeySecret: res.data.data.accessKeySecret,
        stsToken: res.data.data.stsToken
      };
    },
    refreshSTSTokenInterval: authStore.stsInfo.expireSecond * 1000,
    region: authStore.stsInfo.region,
    bucket: authStore.stsInfo.bucket,
    endpoint: authStore.stsInfo.endpoint,
    authorizationV4: true
  } as any);

  return ossClient;
};

/**
 * 上传文件
 * @param {UploadFileOptions} options 选项
 * @return {Promise<string>} oss链接
 */
export const uploadFile = async (options: UploadFileOptions): Promise<string> => {
  const ossClient = await getOssClient();
  const authStore = useAuthStore();
  const ossFilePath = join(authStore.stsInfo!.rootDir, options.uploadDir, `${Date.now()}-${options.file.name}`);

  await ossClient.put(ossFilePath, options.file, {
    headers: {
      // 指定Object的存储类型。
      "x-oss-storage-class": "Standard",
      // 指定Object的访问权限。
      "x-oss-object-acl": "private",
      // 通过文件URL访问文件时，指定以附件形式下载文件，自定义下载后的文件名称
      "Content-Disposition": `attachment; filename="${encodeURIComponent(options.file.name)}"`,
      // 指定PutObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
      "x-oss-forbid-overwrite": "true",
      // 设置缓存
      "Cache-Control": "public, max-age=86400"
    }
  });

  return join(`oss://${authStore.stsInfo!.bucket}/`, ossFilePath);
};

/**
 * 获取oss链接签名url
 * @param {GetOssLinkSignUrlOptions} options 选项
 * @return {Promise<string>} 文件签名链接
 */
export const getOssLinkSignUrl = async (options: GetOssLinkSignUrlOptions): Promise<string> => {
  const filePath = parseOssLink(options.ossLink)?.path;
  if (!filePath) return "";

  const now = Date.now();
  const cacheSignUrl = cacheSignUrlMap.get(options.ossLink);
  if (cacheSignUrl && now < cacheSignUrl.expirationTime) return cacheSignUrl.url;

  const ossClient = await getOssClient();
  const expire = 60 * 60;
  const headers = options.headers;
  const queries = options.queries;
  const signUrl = await (ossClient as any).signatureUrlV4("GET", expire, { headers, queries }, filePath);
  cacheSignUrlMap.set(options.ossLink, { url: signUrl, expirationTime: now + expire * 1000 });

  return signUrl;
};

/**
 * 解析oss链接字符串
 * @param value 匹配值
 * @return {ParseOssLinkResult | null} 解析结果
 */
export const parseOssLink = (value: string): ParseOssLinkResult | null => {
  const result = value.match(/^(oss:\/\/[a-z|0-9|-]+\/)(.*)$/);

  if (result === null) return null;

  return {
    bucket: result[1],
    path: result[2]
  };
};
