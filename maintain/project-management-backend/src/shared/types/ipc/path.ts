/**
 * @file 路径 IPC 契约（跨进程共享）
 * @description 定义路径域的 API 通道契约，供主进程与预加载脚本共用
 */

/**
 * 路径 API
 *
 * 渲染进程拿不到 node:path，常用路径处理统一由主进程代劳
 */
export interface IPathApi {
  /** 拼接路径片段 */
  'path:join': {
    args: [...segments: string[]]
    result: string
  }
  /** 由右往左解析出绝对路径，遇到绝对路径片段时停止 */
  'path:resolve': {
    args: [...segments: string[]]
    result: string
  }
  /** 规范化路径：解析 . 与 ..，合并多余分隔符 */
  'path:normalize': {
    args: [path: string]
    result: string
  }
  /** 判断是否为绝对路径 */
  'path:isAbsolute': {
    args: [path: string]
    result: boolean
  }
  /** 取所在目录 */
  'path:dirname': {
    args: [path: string]
    result: string
  }
  /** 取最后一段名称 */
  'path:basename': {
    args: [path: string, ext?: string]
    result: string
  }
  /** 取扩展名，含前导点，无扩展名时为空字符串 */
  'path:extname': {
    args: [path: string]
    result: string
  }
  /** 取从起始路径到目标路径的相对路径 */
  'path:relative': {
    args: [from: string, to: string]
    result: string
  }
  /** 取当前平台的路径分隔符 */
  'path:sep': {
    args: []
    result: string
  }
}
