/**
 * Bridge 模块入口（渲染进程）
 * 对应 web 端 bridge 入口
 *
 * 使用方式：
 *   import { bridge } from '@/module/bridge/renderer'
 *   bridge.send('sensor', 'tempHumid', {}, { onTempHumid: (data) => console.log(data) })
 *   bridge.on('sensor', 'tempHumid', (data) => console.log(data))
 *   bridge.off('sensor', 'tempHumid')
 */
import './messageReceiver';
import { messageUtils } from './messageUtils';
import { nativeProvider } from './nativeProvider';

export const bridge = {
  /** 发送消息到主进程 */
  send: messageUtils.send.bind(messageUtils),
  /** 监听主进程事件 */
  on: messageUtils.on.bind(messageUtils),
  /** 取消监听主进程事件 */
  off: messageUtils.off.bind(messageUtils),
  /** 是否在 Electron 环境中 */
  isNativeEnv: nativeProvider.isNativeEnv.bind(nativeProvider),
  /** 获取当前平台 */
  getPlatform: nativeProvider.getPlatform.bind(nativeProvider),
};
