/**
 * @file 路径 IPC 通道
 * @description 把 node:path 的常用处理暴露给渲染进程：渲染进程无 node 环境，路径运算统一在此代劳
 */
import nodePath from 'node:path'
import { handle } from '../utils/handler'
import type { TPathPlatform } from '@shared/types/ipc/path'

/**
 * 按平台标识取对应的路径处理实现
 * @param platform 平台标识：posix 用 /，win32 用 \，system 跟随当前系统
 * @returns 该平台下的路径处理实现
 */
function pickPath(platform: TPathPlatform): typeof nodePath {
  if (platform === 'posix') return nodePath.posix
  if (platform === 'win32') return nodePath.win32
  return nodePath
}

/**
 * 拼接路径片段
 * @param platform 平台标识
 * @param segments 待拼接的路径片段
 * @returns 拼接后的路径
 */
handle('path:join', (_event, platform, ...segments) => {
  return pickPath(platform).join(...segments)
})

/**
 * 由右往左解析出绝对路径，遇到绝对路径片段时停止
 * @param platform 平台标识
 * @param segments 待解析的路径片段
 * @returns 解析出的绝对路径
 */
handle('path:resolve', (_event, platform, ...segments) => {
  return pickPath(platform).resolve(...segments)
})

/**
 * 规范化路径：解析 . 与 ..，合并多余分隔符
 * @param platform 平台标识
 * @param path 待规范化的路径
 * @returns 规范化后的路径
 */
handle('path:normalize', (_event, platform, path) => {
  return pickPath(platform).normalize(path)
})

/**
 * 判断是否为绝对路径
 * @param platform 平台标识
 * @param path 待判断的路径
 * @returns 是绝对路径时为 true
 */
handle('path:isAbsolute', (_event, platform, path) => {
  return pickPath(platform).isAbsolute(path)
})

/**
 * 取所在目录
 * @param platform 平台标识
 * @param path 目标路径
 * @returns 所在目录
 */
handle('path:dirname', (_event, platform, path) => {
  return pickPath(platform).dirname(path)
})

/**
 * 取最后一段名称，可去掉指定扩展名
 * @param platform 平台标识
 * @param path 目标路径
 * @param ext 要去掉的扩展名，含前导点
 * @returns 最后一段名称
 */
handle('path:basename', (_event, platform, path, ext) => {
  return pickPath(platform).basename(path, ext)
})

/**
 * 取扩展名，含前导点
 * @param platform 平台标识
 * @param path 目标路径
 * @returns 扩展名，无扩展名时为空字符串
 */
handle('path:extname', (_event, platform, path) => {
  return pickPath(platform).extname(path)
})

/**
 * 取从起始路径到目标路径的相对路径
 * @param platform 平台标识
 * @param from 起始路径
 * @param to 目标路径
 * @returns 目标路径相对起始路径的路径
 */
handle('path:relative', (_event, platform, from, to) => {
  return pickPath(platform).relative(from, to)
})

/**
 * 取当前平台的路径分隔符
 * @returns 当前系统的路径分隔符
 */
handle('path:sep', () => {
  return nodePath.sep
})
