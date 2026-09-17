/**
 * @file 路径选择工具
 * @description 用隐藏的 file input 唤起系统选择框，借 preload 暴露的 webUtils 取真实绝对路径
 */
import { electronApi } from './electronApi'

/**
 * 等待一次选择结束
 *
 * 选择完成触发 change，取消选择触发 cancel；无论哪种都会清理临时 input 并结束等待
 * @param input 已配置好的隐藏 input
 * @returns 选中的文件列表，取消选择时为 null
 */
const waitSelection = (input: HTMLInputElement): Promise<FileList | null> =>
  new Promise((resolve) => {
    const settle = (files: FileList | null): void => {
      input.remove()
      resolve(files)
    }
    input.addEventListener('change', () => settle(input.files))
    input.addEventListener('cancel', () => settle(null))
    input.style.display = 'none'
    document.body.appendChild(input)
    input.click()
  })

/**
 * 选择本地文件
 * @returns 选中文件的绝对路径，取消选择时为空字符串
 */
export async function pickFilePath(): Promise<string> {
  const input = document.createElement('input')
  input.type = 'file'
  const file = (await waitSelection(input))?.[0]
  return file ? electronApi.webUtils.getPathForFile(file) : ''
}

/**
 * 选择本地目录
 *
 * 所选目录自身不出现在 webkitRelativePath 里（它形如「目录名/子路径/文件名」），
 * 因此从文件绝对路径的末尾回退「相对层级数 - 1」段即得所选目录
 * @returns 选中目录的绝对路径，取消选择时为空字符串
 */
export async function pickDirectoryPath(): Promise<string> {
  const input = document.createElement('input')
  input.type = 'file'
  input.webkitdirectory = true
  const file = (await waitSelection(input))?.[0]
  if (!file) return ''
  const absolutePath = electronApi.webUtils.getPathForFile(file)
  const relativeDepth = file.webkitRelativePath.split('/').length - 1
  const separator = absolutePath.includes('\\') ? '\\' : '/'
  const segments = absolutePath.split(/[\\/]+/)
  return segments.slice(0, segments.length - relativeDepth).join(separator)
}
