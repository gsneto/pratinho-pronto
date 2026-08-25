import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // The optional PDF renderer is loaded only after an explicit export click.
    chunkSizeWarningLimit: 1300,
  },
  plugins: [react(), tailwindcss()],
})
