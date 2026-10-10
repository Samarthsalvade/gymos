import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site at /gymos/. Local dev stays at /.
  base: process.env.GITHUB_PAGES === 'true' ? '/gymos/' : '/',
  plugins: [react()],
})
