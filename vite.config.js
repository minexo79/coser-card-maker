import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文件: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base:'/front-dev/',
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: []
  }
})
