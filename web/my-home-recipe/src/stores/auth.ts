// ============================================================
// 登录状态（Pinia）
// ------------------------------------------------------------
// token / 用户信息持久化在 localStorage（见 services/authSession），
// 这里提供响应式的登录态供视图使用。
// ============================================================

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { AuthUser } from '@/services/authSession'
import { clearSession, getToken, getUser, setToken, setUser } from '@/services/authSession'

export const useAuthStore = defineStore('auth', () => {
  /** 访问令牌 */
  const token = ref<string>(getToken())
  /** 当前登录用户 */
  const user = ref<AuthUser | null>(getUser())
  /** 是否已登录 */
  const isLoggedIn = computed<boolean>(() => Boolean(token.value))
  /** 展示用昵称（优先 userName，其次账号） */
  const displayName = computed<string>(
    () => user.value?.userName || user.value?.userAccount || '未登录',
  )

  /** 登录成功后写入会话 */
  function login(accessToken: string, info?: AuthUser): void {
    token.value = accessToken
    setToken(accessToken)
    if (info) {
      user.value = info
      setUser(info)
    }
  }

  /** 退出登录：清除会话并回到登录页 */
  function logout(): void {
    token.value = ''
    user.value = null
    clearSession()
    if (!location.pathname.startsWith('/login')) location.assign('/login')
  }

  return { token, user, isLoggedIn, displayName, login, logout }
})
