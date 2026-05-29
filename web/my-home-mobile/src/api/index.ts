/**
 * src/api/index.ts
 * API 统一出口 —— 按业务域分文件，此处统一 re-export
 * 保持向后兼容：原有 import { xxx } from '@/api' 的写法无需修改
 */
export * from './modules/auth'
export * from './modules/oss'
export * from './modules/weather'
export * from './modules/express'
export * from './modules/cloud-disk'
export * from './modules/moments'
