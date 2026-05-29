/**
 * src/api/modules/auth.ts —— 认证相关接口
 */
import type { ServerApi } from '../types/serverApi'
import type { ResponseBody } from '@/api/types/common'
import { request } from '@/utils/request'

/** 注册新用户 */
export function systemAuthRegister(data: ServerApi['/system/auth/register']['config']['data']) {
  return request<ResponseBody<ServerApi['/system/auth/register']['response']>>({
    url: '/system/auth/register',
    method: 'POST',
    data,
  })
}

/** 用户登录 */
export function systemAuthLogin(data: ServerApi['/system/auth/login']['config']['data']) {
  return request<ResponseBody<ServerApi['/system/auth/login']['response']>>({
    url: '/system/auth/login',
    method: 'POST',
    data,
  })
}

/** 修改用户信息 */
export function systemAuthUpdateUserInfo(
  data: ServerApi['/system/auth/updateUserInfo']['config']['data'],
) {
  return request<ResponseBody<ServerApi['/system/auth/updateUserInfo']['response']>>({
    url: '/system/auth/updateUserInfo',
    method: 'POST',
    data,
  })
}

/** 修改密码 */
export function systemAuthChangePassword(
  data: ServerApi['/system/auth/changePassword']['config']['data'],
) {
  return request<ResponseBody<void>>({
    url: '/system/auth/changePassword',
    method: 'POST',
    data,
  })
}
