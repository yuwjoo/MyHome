/**
 * @file 对话框 api
 * @description 渲染进程侧对对话框主进程通道的方法封装，方法签名由 IPC 契约自动推导
 */
import { invoke } from '@preload/api/utils/handler'
import type { TIpcApiShape } from '@preload/api/types/ipc'

// 对话框 api
export const dialogApi: TIpcApiShape['dialog'] = {
  /**
   * 打开文件 / 文件夹选择器
   * @param options 选择框选项；不传时按单选文件处理
   * @returns 选中的文件 / 文件夹绝对路径集合，取消选择时为空数组
   */
  openFilePicker: (options) => {
    return invoke('dialog:openFilePicker', options)
  }
}
