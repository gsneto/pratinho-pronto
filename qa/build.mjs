import { fileURLToPath } from 'node:url'
import { build } from 'vite'

// Separate output: the production dist/ and its environment remain untouched.
await build({
  root: fileURLToPath(new URL('../', import.meta.url)),
  envDir: false,
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://127.0.0.1:4178/__qa/supabase'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('qa-local-placeholder'),
    'import.meta.env.VITE_META_PIXEL_ID': JSON.stringify(''),
    'import.meta.env.VITE_GA_MEASUREMENT_ID': JSON.stringify(''),
    'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true'),
    'import.meta.env.PROD': 'false',
    'import.meta.env.DEV': 'false',
  },
  build: { outDir: 'tmp/ui-qa-dist' },
})
