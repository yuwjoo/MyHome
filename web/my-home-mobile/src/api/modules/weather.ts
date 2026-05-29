/**
 * src/api/modules/weather.ts —— 天气相关接口
 */
import type { ServerApi } from '../types/serverApi'
import type { ResponseBody } from '@/api/types/common'
import { request } from '@/utils/request'

/** 获取城市天气列表 */
export function weatherGetCityWeatherList(params: ServerApi['/weather/getCityWeatherList']['config']['params']) {
  return request<ResponseBody<ServerApi['/weather/getCityWeatherList']['response']>>({
    url: '/weather/getCityWeatherList',
    method: 'GET',
    params,
  })
}

/** 获取天气 */
export function weatherGetWeather(params: ServerApi['/weather/getWeather']['config']['params']) {
  return request<ResponseBody<ServerApi['/weather/getWeather']['response']>>({
    url: '/weather/getWeather',
    method: 'GET',
    params,
  })
}
