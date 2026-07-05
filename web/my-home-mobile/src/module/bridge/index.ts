import './messageReceiver'
import { messageUtils } from './messageUtils'
import { nativeProvider } from './nativeProvider'

/**
 * Bridge 模块入口
 */
export const bridge = {
  send: messageUtils.send.bind(messageUtils),
  on: messageUtils.on.bind(messageUtils),
  off: messageUtils.off.bind(messageUtils),
  isNativeEnv: nativeProvider.isNativeEnv.bind(nativeProvider),
  getPlatform: nativeProvider.getPlatform.bind(nativeProvider),
}
