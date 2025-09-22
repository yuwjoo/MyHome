import { BridgeChannel } from "./bridgeChannel";
import { bridgeConfig } from "./bridgeConfig";
import { mountWebInterface } from "./webInterface";
import { available, callMethod, resetBridge } from "./webViewInterface";

const globalChannel = new BridgeChannel(bridgeConfig.globalEventChannelId); // 全局事件通道

mountWebInterface();

window.addEventListener("beforeunload", resetBridge);

/**
 * @description: 发送方式触发api
 * @param {string} apiPath api路径
 * @param {any} data 数据
 */
function send(apiPath: string, data?: any) {
  callMethod({ apiPath, payload: data });
}

/**
 * @description: 调用方式触发api
 * @param {string} apiPath api路径
 * @param {any} data 数据
 * @return {Promise<any>} Promise对象
 */
function invoke(apiPath: string, data?: any): Promise<any> {
  const channel = new BridgeChannel();
  callMethod({ channelId: channel.id, apiPath, payload: data });
  return new Promise((resolve, reject) => {
    channel.only(bridgeConfig.resolveCallbackKey, resolve);
    channel.only(bridgeConfig.rejectCallbackKey, reject);
  });
}

/**
 * @description: socket方式触发api
 * @param {string} apiPath api路径
 * @return {Record<string, any>} 操作对象
 */
function createSocket(apiPath: string) {
  const channel = new BridgeChannel();
  const connect = (data?: any) => {
    callMethod({ channelId: channel.id, apiPath, payload: data });
  };

  return {
    on: channel.on,
    only: channel.only,
    off: channel.off,
    send: channel.send,
    done: channel.done,
    connect
  };
}

export default {
  available,
  globalChannel,
  send,
  invoke,
  createSocket
};
