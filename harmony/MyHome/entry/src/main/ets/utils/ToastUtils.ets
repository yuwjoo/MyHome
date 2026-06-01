/**
 * Toast 提示工具类
 */

import { promptAction } from '@kit.ArkUI';
import { deviceInfo } from '@kit.BasicServicesKit';
import { LogUtils } from './LogUtils';

export class ToastUtils {
  /**
   * 显示 Toast 提示
   * @param options - Toast 配置项（message 必填，其余选填）
   */
  static async show(options: promptAction.ShowToastOptions): Promise<void> {
    try {
      if (deviceInfo.sdkApiVersion >= 18) {
        // API 18+ 使用 openToast（showToast 已废弃）
        await promptAction.openToast(options)
      } else {
        // 低版本兼容 fallback
        promptAction.showToast(options);
      }
    } catch (e) {
      LogUtils.error('ToastUtils', '%{public}s', `showToast failed: ${JSON.stringify(e)}`);
    }
  }
}
