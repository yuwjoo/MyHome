/**
 * 两次连续返回键退出处理
 */

import { ToastUtils } from '../utils/ToastUtils';

const EXIT_INTERVAL: number = 2000; // 两次返回键间隔（毫秒）
const TOAST_EXIT_MSG: string = '再按一次退出应用'; // 退出提示文案
const TOAST_EXIT_DURATION: number = 2000; // 提示显示时长（毫秒）

export class DoubleBackExit {
  private lastBackTime: number = 0; // 上次按下返回键的时间戳（毫秒）

  /**
   * 判断是否应该退出应用
   *
   * - 首次按下：显示提示，返回 false（不退出）
   * - 间隔内再次按下：返回 true（应退出）
   * - 间隔外再次按下：重置计时，显示提示，返回 false
   *
   * @returns true = 应该退出应用，false = 已消费事件（显示提示）
   */
  shouldExit(): boolean {
    const now = Date.now();

    // 间隔内再次按下 → 确认退出
    if (now - this.lastBackTime < EXIT_INTERVAL) {
      return true;
    }

    // 首次按下或超时 → 显示提示
    this.lastBackTime = now;
    ToastUtils.show({ message: TOAST_EXIT_MSG, duration: TOAST_EXIT_DURATION });
    return false;
  }

  /**
   * 重置计时状态（页面切换等场景调用）
   */
  reset(): void {
    this.lastBackTime = 0;
  }
}
