/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // добавьте другие env переменные здесь при необходимости
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
