/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 应用标题（渲染进程） */
  readonly VITE_APP_TITLE: string
  /** 后端 API 基础地址（渲染进程） */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
