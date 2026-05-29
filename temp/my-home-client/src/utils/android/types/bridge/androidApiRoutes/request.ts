export interface RequestData {
  url: string; // 请求url
  method: string; // 请求方法
  headers: Record<string, string>; // 请求头
  timeout: number; // 超时时间
  bodyText?: string; // body文本
  bodyBlobText?: string; // body二进制文本
  bodyMultipartList?: (BodyMultipartField | BodyMultipartBlob)[]; // body分块数据列表
}

export interface BodyMultipartField {
  type: "field"; // 类型
  name: string; // 名称
  value: string; // 值
}

export interface BodyMultipartBlob {
  type: "blob"; // 类型
  name: string; // 名称
  filePath?: string; // 文件路径
  fileName?: string; // 文件名称
  mimeType?: string; // mime类型
  blobText?: string; // 二进制文本
}

export interface RequestResult {
  status: number; // 状态码
  statusText: string; // 状态文本
  headers: Record<string, string>; // 响应头集合
  body: string; // body数据
  url: string; // 响应url
}

export interface RequestOnEvent {
  uploadProgress: ProgressEventData; // 上传进度
  downloadProgress: ProgressEventData; // 下传进度
  response: RequestResult; // 响应
  error: ErrorEventData; // 异常
}

export interface ProgressEventData {
  loaded: number; // 当前数据量
  total: number; // 总数据量
  lengthComputable: boolean; // 进度是否可以被测量
}

export type ErrorEventData = "timeout" | "other"; // 异常信息

export interface RequestSendEvent {
  cancel: undefined; // 取消请求
}
