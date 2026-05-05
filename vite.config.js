import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// Vite 配置文件: https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    allowedHosts: true,
    port: 8080
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [] 
  }
})