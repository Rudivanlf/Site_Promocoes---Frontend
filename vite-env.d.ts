/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_API_URL: string
  readonly VITE_AUTH_REGISTER_PATH?: string
  readonly VITE_AUTH_LOGIN_PATH?: string
  readonly VITE_AUTH_REGISTER_PATHS?: string
  readonly VITE_AUTH_LOGIN_PATHS?: string
  readonly VITE_AUTH_REGISTER_METHODS?: string
  readonly VITE_AUTH_LOGIN_METHODS?: string
  readonly VITE_AUTH_EMAIL_FIELD?: string
  readonly VITE_AUTH_PASSWORD_FIELD?: string
  // adicione outras variáveis VITE_ aqui, se houver
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}