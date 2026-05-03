import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文件: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
<<<<<<< HEAD
    port: 8080
=======
    host: '0.0.0.0'
>>>>>>> 3a2eaab (移除QRCode程式碼，調整圖片繪製邏輯減少流量耗損，整理沒用的程式碼)
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [] 
  }
})
