/**
 * @file IPC 统一出口
 * @description 注册各域 IPC 通道，并对外提供主进程向渲染进程推送消息的能力
 */
import { send } from './utils/handler'
import './modules/release'

// 主进程向渲染进程推送消息
export const ipcSend = send
