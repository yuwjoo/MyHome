/**
 * @file 对话框 IPC 通道
 * @description 对接系统对话框：由主进程唤起原生选择框，回传选中的文件 / 文件夹绝对路径
 */
import { dialog } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { getMainWindow } from '@main/modules/window'
import { handle } from '../utils/handler'

/**
 * 打开文件选择器
 *
 * 以主窗口为父窗口唤起系统原生选择框，按选项单选 / 多选文件（或文件夹）；
 * 相比渲染进程侧 file input 方案，空目录同样能取到路径
 * @param options 选择框选项；不传时按单选文件处理
 * @returns 选中的文件 / 文件夹绝对路径集合，取消选择时为空数组
 */
handle('dialog:openFilePicker', async (_event, options) => {
  const properties: OpenDialogOptions['properties'] = []
  if (options?.selectDirectory) {
    properties.push('openDirectory')
  } else {
    properties.push('openFile')
  }
  if (options?.multiSelections) {
    properties.push('multiSelections')
  }

  const dialogOptions: OpenDialogOptions = {
    properties,
    title: options?.title,
    defaultPath: options?.defaultPath,
    buttonLabel: options?.buttonLabel,
    // 文件类型过滤仅选文件时生效，选文件夹时多数平台不做过滤
    filters: options?.filters
  }

  const parentWindow = getMainWindow()
  let result: Electron.OpenDialogReturnValue
  if (parentWindow) {
    result = await dialog.showOpenDialog(parentWindow, dialogOptions)
  } else {
    result = await dialog.showOpenDialog(dialogOptions)
  }

  return result.canceled ? [] : result.filePaths
})
