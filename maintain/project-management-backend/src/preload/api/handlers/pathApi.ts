/**
 * @file 路径 api
 * @description 渲染进程侧对路径主进程通道的方法封装，方法签名由 IPC 契约自动推导
 */
import { invoke } from '@preload/api/utils/handler'
import type { TIpcApiShape } from '@preload/api/types/ipc'

// 路径 api
export const pathApi: TIpcApiShape['path'] = {
  /**
   * 拼接路径片段
   * @param platform 平台标识
   * @param segments 待拼接的路径片段
   * @returns 拼接后的路径
   */
  join: (platform, ...segments) => {
    return invoke('path:join', platform, ...segments)
  },
  /**
   * 由右往左解析出绝对路径，遇到绝对路径片段时停止
   * @param platform 平台标识
   * @param segments 待解析的路径片段
   * @returns 解析出的绝对路径
   */
  resolve: (platform, ...segments) => {
    return invoke('path:resolve', platform, ...segments)
  },
  /**
   * 规范化路径：解析 . 与 ..，合并多余分隔符
   * @param platform 平台标识
   * @param path 待规范化的路径
   * @returns 规范化后的路径
   */
  normalize: (platform, path) => {
    return invoke('path:normalize', platform, path)
  },
  /**
   * 判断是否为绝对路径
   * @param platform 平台标识
   * @param path 待判断的路径
   * @returns 是绝对路径时为 true
   */
  isAbsolute: (platform, path) => {
    return invoke('path:isAbsolute', platform, path)
  },
  /**
   * 取所在目录
   * @param platform 平台标识
   * @param path 目标路径
   * @returns 所在目录
   */
  dirname: (platform, path) => {
    return invoke('path:dirname', platform, path)
  },
  /**
   * 取最后一段名称，可去掉指定扩展名
   * @param platform 平台标识
   * @param path 目标路径
   * @param ext 要去掉的扩展名，含前导点
   * @returns 最后一段名称
   */
  basename: (platform, path, ext) => {
    return invoke('path:basename', platform, path, ext)
  },
  /**
   * 取扩展名，含前导点
   * @param platform 平台标识
   * @param path 目标路径
   * @returns 扩展名，无扩展名时为空字符串
   */
  extname: (platform, path) => {
    return invoke('path:extname', platform, path)
  },
  /**
   * 取从起始路径到目标路径的相对路径
   * @param platform 平台标识
   * @param from 起始路径
   * @param to 目标路径
   * @returns 目标路径相对起始路径的路径
   */
  relative: (platform, from, to) => {
    return invoke('path:relative', platform, from, to)
  },
  /**
   * 取当前系统的路径分隔符
   * @returns 当前系统的路径分隔符
   */
  sep: () => {
    return invoke('path:sep')
  }
}
