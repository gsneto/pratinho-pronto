/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_CHECKOUT_URL?: string
  readonly VITE_META_PIXEL_ID?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** Liga os selos de conteúdo demonstrativo apenas no ambiente de QA/prévia. */
  readonly VITE_DEMO_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
