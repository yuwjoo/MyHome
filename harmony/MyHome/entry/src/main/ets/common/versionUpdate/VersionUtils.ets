/**
 * 版本号工具类
 */

export class VersionUtils {
  /**
   * 语义化版本号比较
   *
   * @param v1 - 版本号 1
   * @param v2 - 版本号 2
   * @returns v1 > v2 返回正数，相等返回 0，v1 < v2 返回负数
   */
  static compareVersion(v1: string, v2: string): number {
    const parts1: number[] = v1.split('.').map(Number);
    const parts2: number[] = v2.split('.').map(Number);
    const maxLen: number = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
      const n1: number = parts1[i] || 0;
      const n2: number = parts2[i] || 0;
      if (n1 !== n2) {
        return n1 - n2;
      }
    }
    return 0;
  }
}
