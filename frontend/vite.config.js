import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文件: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 在建置時注入執行 Node.js 的版本，供系統狀態表顯示（瀏覽器環境無 process）
    __NODE_VERSION__: JSON.stringify(process.versions.node),
  },
  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [] 
  }
})
