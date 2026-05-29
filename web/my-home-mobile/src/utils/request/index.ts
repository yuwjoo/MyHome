import axios, { type AxiosRequestConfig } from 'axios'
import { initInterceptor } from './interceptor'
import { API_BASE_URL } from '@/utils/config'

export const defaultConfig: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  sendEnv: 'web',
}

export const request = axios.create(defaultConfig)

initInterceptor(request)
