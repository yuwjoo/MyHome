/**
 * src/api/modules/express.ts —— 快递相关接口
 */
import type { ServerApi } from '../types/serverApi'
import type { ResponseBody } from '@/api/types/common'
import { request } from '@/utils/request'

/** 获取快递信息 */
export function expressGetExpressInfo(params: ServerApi['/express/getExpressInfo']['config']['params']) {
  return request<ResponseBody<ServerApi['/express/getExpressInfo']['response']>>({
    url: '/express/getExpressInfo',
    method: 'GET',
    params,
  })
}

/** 根据快递单号查询快递公司 */
export function expressQueryCompanyByOrderNumber(params: ServerApi['/express/queryCompanyByOrderNumber']['config']['params']) {
  return request<ResponseBody<ServerApi['/express/queryCompanyByOrderNumber']['response']>>({
    url: '/express/queryCompanyByOrderNumber',
    method: 'GET',
    params,
  })
}
