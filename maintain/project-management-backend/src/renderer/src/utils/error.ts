/**
 * @file 错误文案工具
 * @description 把 IPC 抛出的未知异常转成可展示的错误文案
 */

/**
 * 取错误文案
 *
 * IPC 通道抛错时 reject 的是 Error 实例，直接展示其 message 即可获得主进程给出的原因；
 * 非 Error 形态（如被序列化的字符串）时退回兜底文案
 * @param error 捕获到的未知异常
 * @param fallback 无法解析出文案时的兜底文案
 * @returns 用于提示用户的错误文案
 */
export function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}
