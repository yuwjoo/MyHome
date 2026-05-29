import SparkMD5 from "spark-md5";
import type { WorkerReceiveMessage, ProgressMessage, DoneMessage, ErrorMessage } from "./hash.types";

self.onmessage = async (event: MessageEvent<WorkerReceiveMessage>) => {
  try {
    const { file, chunkSize = 2 * 1024 * 1024 } = event.data;
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
      self.postMessage(progressMsg);
    }

    const md5 = spark.end();
    const doneMsg: DoneMessage = { type: "done", md5 };
    self.postMessage(doneMsg);
  } catch (err: any) {
    const errorMsg: ErrorMessage = { type: "error", message: err?.message || String(err) };
    self.postMessage(errorMsg);
  } finally {
    self.close();
  }
};
