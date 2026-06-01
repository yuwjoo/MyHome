/**
 * ZIP 解压缩模块
 *
 * 职责：
 *   - 将沙箱内的 ZIP 压缩包解压到指定目录
 *   - 封装 @kit.BasicServicesKit 的 zlib.decompressFile API
 *
 * 使用方式：
 *   await ZipExtractor.extract('/path/to/file.zip', '/path/to/output/');
 *
 * 依赖：
 *   @kit.BasicServicesKit  → zlib
 *   @kit.CoreFileKit       → fileIo（目录创建）
 */

import { zlib } from '@kit.BasicServicesKit';
import { fileIo } from '@kit.CoreFileKit';

export class ZipExtractor {
  /**
   * 将 ZIP 文件解压到指定目录
   *
   * @param zipPath   - ZIP 文件的沙箱绝对路径，如 '{context.filesDir}/update.zip'
   * @param outputDir - 解压后的输出目录路径（会自动创建所需目录）
   * @throws {Error}  - 解压失败时抛出异常（如文件损坏、路径无权限等）
   */
  static async extract(zipPath: string, outputDir: string): Promise<void> {
    // 确保输出目录存在
    try {
      fileIo.mkdirSync(outputDir, true);
    } catch (_e) {
      // 目录已存在时忽略错误
    }

    // 调用系统 zlib API 解压
    await zlib.decompressFile(zipPath, outputDir);
  }
}
