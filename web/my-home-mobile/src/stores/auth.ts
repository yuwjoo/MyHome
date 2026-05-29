import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import { useAppStore } from './app'
import type { UserInfo } from '@/types'

/** localStorage 中存储 token / user 的键名 */
const TOKEN_KEY = 'access_token'
const USER_KEY = 'user_info'

/** 默认用户信息 */
const DEFAULT_USER: UserInfo = {
  name: '',
  avatar: '',
  phone: '',
  email: '',
  gender: '男',
  level: '普通用户',
}

/**
 * 认证状态管理
 * - accessToken: 登录凭证，持久化到 localStorage
 * - userInfo: 当前登录用户信息
 * - login(): 登录后保存 token + 用户信息，同步全局登录态
 * - logout(): 退出登录，清除所有状态并跳转登录页
 */
export const useAuthStore = defineStore('auth', () => {
  // ── 状态 ──
  const accessToken = ref<string>(localStorage.getItem(TOKEN_KEY) || '')

  /** 从 localStorage 恢复用户信息 */
  function loadUserFromStorage(): UserInfo {
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (raw) return JSON.parse(raw) as UserInfo
    } catch { /* ignore */ }
    return { ...DEFAULT_USER }
  }
  const userInfo = ref<UserInfo>(loadUserFromStorage())

  // ── Token 持久化 ──
  watch(accessToken, (val) => {
    if (val) {
      localStorage.setItem(TOKEN_KEY, val)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  })

  // ── 用户信息持久化 ──
  watch(userInfo, (val) => {
    localStorage.setItem(USER_KEY, JSON.stringify(val))
  }, { deep: true })

  // ── 方法 ──

  /**
   * 保存登录凭证及用户信息
   * @param token 服务端返回的 token
   * @param user  服务端返回的用户信息（LoginUserDto）
   */
  function login(token: string, user?: { userName?: string; avatarUrl?: string; userAccount?: string }) {
    accessToken.value = token
    if (user) {
      userInfo.value = {
        name: user.userName || user.userAccount || '',
        avatar: user.avatarUrl || '',
        phone: user.userAccount || '',
        email: '',
        gender: '男',
        level: '普通用户',
      }
    }
    useAppStore().login()
  }

  /** 更新用户信息（如修改昵称后调用） */
  function updateUserInfo(partial: Partial<UserInfo>) {
    userInfo.value = { ...userInfo.value, ...partial }
  }

  /**
   * 退出登录：清除 token、用户信息、重置全局登录态、跳转登录页
   */
  function logout() {
    accessToken.value = ''
    userInfo.value = { ...DEFAULT_USER }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    useAppStore().logout()
    router.push('/login')
  }

  return { accessToken, userInfo, login, updateUserInfo, logout }
})
