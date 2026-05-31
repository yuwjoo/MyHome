/**
 * 返回键处理工具
 *
 * 职责：封装鸿蒙系统的返回键拦截逻辑
 * - WebView 可回退时，优先内部后退
 * - 不可回退时，两次点击返回键退出应用
 */

import { webview } from '@kit.ArkWeb';
import { promptAction } from '@kit.ArkUI';
import { EXIT_INTERVAL, TOAST_EXIT_MSG, TOAST_EXIT_DURATION } from './AppConfig';

export class BackPressHandler {
  /** WebView 控制器，用于访问历史栈 */
  private readonly controller: webview.WebviewController;

  /** 上次按下返回键的时间戳（毫秒），用于两次退出判定 */
  private lastBackTime: number = 0;

  /**
   * @param controller - WebView 控制器实例
   */
  constructor(controller: webview.WebviewController) {
    this.controller = controller;
  }

  /**
   * 处理返回键事件
   * 由页面的 onBackPress() 生命周期方法调用
   *
   * @returns true = 已消费事件阻止退出，false = 交由系统退出应用
   */
  onBackPress(): boolean {
    // -- 1. WebView 内部回退 --
    // 如果 WebView 有可回退的历史记录，优先执行内部后退
    if (this.controller.accessBackward()) {
      this.controller.backward();
      return true; // 已消费，不再传递
    }

    // -- 2. 两次返回键退出 --
    // WebView 无法回退时，通过双击返回键实现退出
    const now = Date.now();
    if (now - this.lastBackTime < EXIT_INTERVAL) {
      return false; // 间隔内再次按下，不消费事件，由系统退出
    }

    // 首次按下，记录时间并提示用户
    this.lastBackTime = now;
    promptAction.showToast({
      message: TOAST_EXIT_MSG,
      duration: TOAST_EXIT_DURATION,
    });
    return true; // 已消费，阻止退出
  }
}
