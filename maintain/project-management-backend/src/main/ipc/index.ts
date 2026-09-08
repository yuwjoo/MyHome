/**
 * @file IPC 统一出口
 */
import { send } from './utils/handler'
import './releaseIpc'

export const ipcSend = send
