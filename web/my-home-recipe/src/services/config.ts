// ============================================================
// 运行环境配置
// ------------------------------------------------------------
// 接口地址由 Vite 环境变量 VITE_API_BASE_URL 提供（host:port，
// 不含 /api），并按 mode 自动切换：
//   - .env.development → 本地开发后端 http://localhost:3000
//   - .env.production  → 生产后端 http://47.115.161.79:3000
// 后端全局路由前缀固定为 /api，因此此处统一拼接。
// 未配置环境变量时回退到同源相对路径 /api（由部署层反代）。
// ============================================================

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || ''

/** 后端 API 基础路径（统一以 /api 结尾形式使用） */
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN.replace(/\/+$/, '')}/api` : '/api'
