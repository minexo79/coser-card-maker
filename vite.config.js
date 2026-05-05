import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文件: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    host: '0.0.0.0'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: []
  }
})
