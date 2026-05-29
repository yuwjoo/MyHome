import type { AxiosInstance, AxiosResponse } from 'axios'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import type { ResponseBody } from '@/api/types/common'

/**
 * 初始化请求/响应拦截器
 */
export const initInterceptor = (axios: AxiosInstance) => {
  // ── 请求拦截器：注入 Authorization Token ──
  axios.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    config.headers['Authorization'] = `Bearer ${authStore.accessToken}`
    return config
  })

  // ── 响应拦截器：统一错误处理 ──
  axios.interceptors.response.use(
    (response: AxiosResponse<ResponseBody>) => {
      if (response?.data.code !== 20200) handleError(response)
      return response
    },
    (error) => {
      handleError(error.response)
      return Promise.reject(error)
    },
  )
}

/**
 * 统一异常处理
 * @param response 响应对象
 */
const handleError = (response: AxiosResponse<ResponseBody>) => {
  // 非 JSON 响应跳过，避免对二进制/流式响应误处理
  if (!((response?.headers['content-type'] || '') as string).includes('application/json')) return

  // 401 未授权：登录态失效
  if (response?.data.code === 40401) {
    toast.error(response?.data.message || '登录状态失效，请重新登录！')
    useAuthStore().logout()
  } else {
    // 其他业务异常
    toast.error(response?.data.message || '网络繁忙！')
  }
}
