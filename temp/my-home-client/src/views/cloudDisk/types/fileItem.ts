import type { ServerApi } from "@/api/base/types";

/**
 * 文件项
 */
export type FileItem = ServerApi["/cloudDisk/getList"]["response"][number];
