/**
 * 本地文件操作分组消息
 */

export type LocalFileGroup = {
  /**
   * 读取文本文件
   */
  readFile: {
    type: 'action'
    params: { filePath: string }
    callbacks: {
      onSuccess: (data: { content: string }) => void
      onError: (data: { message: string }) => void
    }
  }

  /**
   * 写入文本文件
   */
  writeFile: {
    type: 'action'
    params: { filePath: string; content: string }
    callbacks: {
      onSuccess: (data: Record<string, never>) => void
      onError: (data: { message: string }) => void
    }
  }

  /**
   * 以 base64 编码读取文件（支持二进制）
   */
  readFileBase64: {
    type: 'action'
    params: { filePath: string }
    callbacks: {
      onSuccess: (data: { base64: string }) => void
      onError: (data: { message: string }) => void
    }
  }

  /**
   * 检查文件是否存在
   */
  existsFile: {
    type: 'action'
    params: { filePath: string }
    callbacks: {
      onSuccess: (data: { exists: boolean }) => void
      onError: (data: { message: string }) => void
    }
  }
}
