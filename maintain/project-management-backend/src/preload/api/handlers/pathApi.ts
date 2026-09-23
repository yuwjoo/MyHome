/**
 * @file 路径 api
 * @description 渲染进程侧对路径主进程通道的方法封装，方法签名由 IPC 契约自动推导
 */
import { invoke } from '@preload/api/utils/handler'
import type { TIpcApiShape } from '@preload/api/types/ipc'

// 路径 api
export const pathApi: TIpcApiShape['path'] = {
  /** 拼接路径片段 */
  join: (...segments) => {
    return invoke('path:join', ...segments)
  },
  /** 由右往左解析出绝对路径 */
  resolve: (...segments) => {
    return invoke('path:resolve', ...segments)
  },
  /** 规范化路径：解析 . 与 ..，合并多余分隔符 */
  normalize: (path) => {
    return invoke('path:normalize', path)
  },
  /** 判断是否为绝对路径 */
  isAbsolute: (path) => {
    return invoke('path:isAbsolute', path)
  },
  /** 取所在目录 */
  dirname: (path) => {
    return invoke('path:dirname', path)
  },
  /** 取最后一段名称，可去掉指定扩展名 */
  basename: (path, ext) => {
    return invoke('path:basename', path, ext)
  },
  /** 取扩展名，含前导点 */
  extname: (path) => {
    return invoke('path:extname', path)
  },
  /** 取从起始路径到目标路径的相对路径 */
  relative: (from, to) => {
    return invoke('path:relative', from, to)
  },
  /** 取当前平台的路径分隔符 */
  sep: () => {
    return invoke('path:sep')
  }
}
