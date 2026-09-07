/**
 * @file IPC 统一出口
 */
import { send } from './utils/handler'
import './appConfigIpc'
import './releaseIpc'

export const ipcSend = send
