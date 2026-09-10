/**
 * @file electronApi
 * @description 统一导出 preload 注入到 window 上的 electronApi，供渲染进程业务代码引用
 */

// electronApi 对象
export const electronApi = window.electronApi
