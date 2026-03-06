/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BASE_API_URL: string
    // adicione outras variáveis VITE_ aqui, se houver
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }