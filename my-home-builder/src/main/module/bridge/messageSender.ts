/**
 * 消息发送器（主进程 → 渲染进程）
 * 对应 Android 端通过 evaluateJavascript 调用 web 端 MessageReceiver.onMessage()
 */
import type { BrowserWindow } from "electron";
import { bridgeConfig } from "./bridgeConfig";
import type { RendererMessage } from "./types";

export class MessageSender {
  constructor(
    private readonly browserWindow: BrowserWindow,
    private readonly groupName: string,
    private readonly messageId: string,
  ) {}

  /**
   * 发送消息到渲染进程
   *
   * @param callbackName 回调名称
   * @param data         回传数据（可选）
   * @param isEnd        是否标记消息结束，清除该消息所有回调（可选）
   * @param isRetained   是否保留数据，供后续新注册的回调直接获取（可选）
   */
  send(
    callbackName: string,
    data?: Record<string, unknown>,
    isEnd?: boolean,
    isRetained?: boolean,
  ): void {
    const msg: RendererMessage = {
      groupName: this.groupName,
      messageId: this.messageId,
      callbackName,
      data,
      isEnd,
      isRetained,
    };

    this.browserWindow.webContents.send(
      bridgeConfig.sendMessageIPCEvent,
      msg,
    );
  }

  /**
   * 发送事件消息
   *
   * @param data       回传数据（可选）
   * @param isRetained 是否保留数据，供后续新注册的回调直接获取（可选）
   */
  sendEventMessage(data?: Record<string, unknown>, isRetained?: boolean): void {
    this.send("onMessage", data, false, isRetained);
  }

  /**
   * 发送结束消息
   *
   * @param callbackName 回调名称
   * @param data         回传数据（可选）
   */
  sendEndMessage(callbackName: string, data?: Record<string, unknown>): void {
    this.send(callbackName, data, true);
  }
}
