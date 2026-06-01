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
  static info<T = null>(tag: string, format: string, ...args: T[]): void {
    hilog.info(DOMAIN, tag, format, ...args);
  }

  /**
   * @param tag    - 日志标签
   * @param format - 格式化字符串
   * @param args   - 格式化参数
   */
  static error<T = null>(tag: string, format: string, ...args: T[]): void {
    hilog.error(DOMAIN, tag, format, ...args);
  }

  /**
   * @param tag    - 日志标签
   * @param format - 格式化字符串
   * @param args   - 格式化参数
   */
  static warn<T = null>(tag: string, format: string, ...args: T[]): void {
    hilog.warn(DOMAIN, tag, format, ...args);
  }

  /**
   * @param tag    - 日志标签
   * @param format - 格式化字符串
   * @param args   - 格式化参数
   */
  static debug<T = null>(tag: string, format: string, ...args: T[]): void {
    hilog.debug(DOMAIN, tag, format, ...args);
  }
}
