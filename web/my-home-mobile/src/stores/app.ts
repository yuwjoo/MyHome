import { defineStore } from 'pinia'
import { ref } from 'vue'

/** localStorage 中存储 token 的键名（需与 auth store 保持一致） */
const TOKEN_KEY = 'access_token'

export const useAppStore = defineStore('app', () => {
  /** 根据 localStorage 是否存在 token 恢复登录态 */
  const isLoggedIn = ref(!!localStorage.getItem(TOKEN_KEY))

  function login() {
    isLoggedIn.value = true
  }

  function logout() {
    isLoggedIn.value = false
  }

  return { isLoggedIn, login, logout }
})
