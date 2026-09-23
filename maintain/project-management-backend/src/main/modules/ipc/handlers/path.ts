/**
 * @file 路径 IPC 通道
 * @description 把 node:path 的常用处理暴露给渲染进程：渲染进程无 node 环境，路径运算统一在此代劳
 */
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep
} from 'node:path'
import { handle } from '../utils/handler'

// 拼接路径片段
handle('path:join', (_event, ...segments) => {
  return join(...segments)
})

// 由右往左解析出绝对路径
handle('path:resolve', (_event, ...segments) => {
  return resolve(...segments)
})

// 规范化路径：解析 . 与 ..，合并多余分隔符
handle('path:normalize', (_event, path) => {
  return normalize(path)
})

// 判断是否为绝对路径
handle('path:isAbsolute', (_event, path) => {
  return isAbsolute(path)
})

// 取所在目录
handle('path:dirname', (_event, path) => {
  return dirname(path)
})

// 取最后一段名称，可去掉指定扩展名
handle('path:basename', (_event, path, ext) => {
  return basename(path, ext)
})

// 取扩展名，含前导点
handle('path:extname', (_event, path) => {
  return extname(path)
})

// 取从起始路径到目标路径的相对路径
handle('path:relative', (_event, from, to) => {
  return relative(from, to)
})

// 取当前平台的路径分隔符
handle('path:sep', () => {
  return sep
})
