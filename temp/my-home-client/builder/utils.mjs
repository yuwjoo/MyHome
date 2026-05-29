import { join } from "path";
import { fileURLToPath, URL } from "url";

/**
 * @description: 解析成文件路径
 * @param {string} filePath 路径
 * @return {string} 文件路径
 */
export function toFilePath(filePath) {
  return fileURLToPath(new URL(join("../", filePath), import.meta.url));
}
