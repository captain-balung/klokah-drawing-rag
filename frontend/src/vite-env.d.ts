/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 後端 API base URL；未設則用程式內預設 http://127.0.0.1:8000 */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
