// ============================================================
// 登录会话持久化（token / 用户信息）
// ------------------------------------------------------------
// 独立于 Pinia：HTTP 封装与路由守卫直接读写 localStorage，
// 避免与 store 之间形成循环依赖。
// ============================================================

const TOKEN_KEY = 'my-home-recipe.access_token'
const USER_KEY = 'my-home-recipe.user_info'

/** 登录用户信息（来自后端 LoginResDto.user） */
export interface AuthUser {
  userAccount?: string
  userName?: string
  avatarUrl?: string
}

/** 读取 token（无则空串） */
export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

/** 保存 token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 读取用户信息（无则 null） */
export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

/** 保存用户信息 */
export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** 清除全部会话（登出 / 登录失效） */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
