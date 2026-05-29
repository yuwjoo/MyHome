/**
 * worker接收消息
 */
export interface WorkerReceiveMessage {
  file: File; // 文件
  chunkSize?: number; // 读取分块大小，默认2MB
}

/**
 * worker发送消息
 */
export type WorkerSendMessage = ProgressMessage | DoneMessage | ErrorMessage;

/**
 * 进度消息
 */
export interface ProgressMessage {
  type: "progress";
  progress: number; // 取值范围：0~1
}

/**
 * 结束消息
 */
export interface DoneMessage {
  type: "done";
  md5: string; // md5值
}

/**
 * 异常消息
 */
export interface ErrorMessage {
  type: "error";
  message: string; // 异常消息
}
