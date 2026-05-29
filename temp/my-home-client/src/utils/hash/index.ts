import type { CalcFileHashOptions } from "./types";
import type { DoneMessage, ErrorMessage, ProgressMessage } from "./hash.types";
import SparkMD5 from "spark-md5";

/**
 * 计算文件hash
 * @param file 文件
 * @param options 配置项
 * @return 文件hash
 */
export async function calcFileHash(file: File, options: CalcFileHashOptions = {}): Promise<string> {
  try {
    const chunkSize = options.chunkSize || 2 * 1024 * 1024;
    const totalSize = file.size;
    let offset = 0;

    const spark = new SparkMD5.ArrayBuffer();

    while (offset < totalSize) {
      const end = Math.min(offset + chunkSize, totalSize);
      const chunk = file.slice(offset, end);
      const buffer = await chunk.arrayBuffer();
      spark.append(buffer);
      offset = end;

      const progressMsg: ProgressMessage = { type: "progress", progress: offset / totalSize };
      options.onProgress?.(progressMsg.progress);
    }

    const md5 = spark.end();
    const doneMsg: DoneMessage = { type: "done", md5 };
    return doneMsg.md5;
  } catch (err: any) {
    const errorMsg: ErrorMessage = { type: "error", message: err?.message || String(err) };
    throw new Error(errorMsg.message);
  }
}
