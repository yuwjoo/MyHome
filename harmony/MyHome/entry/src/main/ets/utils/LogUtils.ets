/**
 * 日志工具类
 */

import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0xFF00;

export class LogUtils {
  /**
   * @param tag    - 日志标签
   * @param format - 格式化字符串
   * @param args   - 格式化参数
   */
  static info(tag: string, format: string, ...args: string[]): void {
    hilog.info(DOMAIN, tag, format, ...args);
  }

  /**
   * @param tag    - 日志标签
   * @param format - 格式化字符串
   * @param args   - 格式化参数
   */
  static error(tag: string, format: string, ...args: string[]): void {
    hilog.error(DOMAIN, tag, format, ...args);
  }

  /**
   * @param tag    - 日志标签
   * @param format - 格式化字符串
   * @param args   - 格式化参数
   */
  static warn(tag: string, format: string, ...args: string[]): void {
    hilog.warn(DOMAIN, tag, format, ...args);
  }

  /**
   * @param tag    - 日志标签
   * @param format - 格式化字符串
   * @param args   - 格式化参数
   */
  static debug(tag: string, format: string, ...args: string[]): void {
    hilog.debug(DOMAIN, tag, format, ...args);
  }
}
