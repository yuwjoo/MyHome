// ============================================================
// HTTP 客户端（axios 封装）
// ------------------------------------------------------------
// 统一处理：
//  - 自动附加 Authorization: Bearer <token>
//  - 后端统一响应体 { code, data, message }，code 20200 视为成功
//  - 登录失效（HTTP 401 / code 40401）：清除会话并跳转登录页
//  - 业务/网络错误抛 ApiError，message 可直接提示用户
//  - 接口地址由 VITE_API_BASE_URL 决定，见 config.ts
// ============================================================

import axios from 'axios'
import { AxiosError } from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from './config'
import { clearSession, getToken } from './authSession'

/** 业务成功码 */
const CODE_OK = 20200

/** 未授权业务码 */
const CODE_UNAUTHORIZED = 40401

/** 请求超时时间（毫秒） */
const REQUEST_TIMEOUT = 20000

export class ApiError extends Error {
  readonly code?: number
  readonly status?: number

  constructor(message: string, code?: number, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** query 参数（GET） */
  params?: Record<string, string | number | boolean | undefined>
  /** 请求体（JSON） */
  data?: unknown
  /** 公开接口：不带 token、不做登录失效跳转（如登录/注册） */
  public?: boolean
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 公开接口：不带 token、不触发登录失效跳转（如登录/注册） */
    public?: boolean
  }
}

/** 后端统一响应体结构 */
interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

/** axios 实例（baseURL 由环境变量决定） */
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：自动附加 Authorization 头
instance.interceptors.request.use((config) => {
  const token = getToken()
  if (token && !config.public) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** 拼接 query 参数（过滤 undefined / null / 空串，空参不携带） */
function serializeParams(params: Record<string, unknown> | undefined): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  return search.toString()
}

/** 登录失效统一处理：清会话并按需跳登录页 */
function handleUnauthorized(config?: InternalAxiosRequestConfig): void {
  clearSession()
  const isPublic = Boolean(config?.public)
  if (!isPublic && !location.pathname.startsWith('/login')) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    location.replace(`/login?redirect=${redirect}`)
  }
}

// 响应拦截器：
//  - 成功分支（HTTP 2xx）：校验后端统一业务码，非 20200 一律按错误抛
//  - 失败分支：将 HTTP / 网络 / 超时错误统一转换为 ApiError
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const body = response.data
    if (!body || typeof body.code !== 'number') {
      throw new ApiError('响应格式异常，请稍后重试')
    }
    if (body.code === CODE_UNAUTHORIZED) {
      handleUnauthorized(response.config)
      throw new ApiError(body.message || '登录状态已失效，请重新登录', CODE_UNAUTHORIZED, response.status)
    }
    if (body.code !== CODE_OK) {
      throw new ApiError(body.message || '请求失败', body.code, response.status)
    }
    return response
  },
  (error: unknown) => {
    // 非 axios 错误（如业务码校验抛出的 ApiError）直接透传，避免被吞掉
    if (!(error instanceof AxiosError)) throw error

    const status = error.response?.status
    const body = error.response?.data as { code?: number; message?: string; data?: unknown } | undefined

    if (status === 401 || body?.code === CODE_UNAUTHORIZED) {
      handleUnauthorized(error.config)
      throw new ApiError(body?.message || '登录状态已失效，请重新登录', CODE_UNAUTHORIZED, status)
    }
    if (error.response) {
      throw new ApiError(body?.message || `请求失败（HTTP ${status}）`, body?.code, status)
    }
    throw new ApiError(error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '网络连接失败，请检查网络')
  },
)

/**
 * 发起请求并返回响应 data（code 20200 时）
 * @param options 请求配置
 * @returns 后端响应 data 字段
 */
export async function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', params, data, public: isPublic = false } = options

  const response = await instance.request<ApiResponse<T>, AxiosResponse<ApiResponse<T>>>({
    url,
    method,
    params,
    data,
    public: isPublic,
    paramsSerializer: {
      serialize: (query) => serializeParams(query as Record<string, unknown>),
    },
  })

  // 业务码已由响应拦截器校验，此处直接取业务数据
  return response.data.data
}
