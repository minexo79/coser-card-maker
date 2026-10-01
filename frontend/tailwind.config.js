/** @type {import('tailwindcss').Config} */
// 顏色一律走 index.css 的 CSS 變數（RGB channel），才能搭配 /opacity 修飾
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 全站統一使用 LINE Seed（含原本等寬字的位置）
        'sans': ['LINESeedTW', 'PingFang TC', 'Microsoft JhengHei', 'sans-serif'],
        'display': ['LINESeedTW', 'PingFang TC', 'Microsoft JhengHei', 'sans-serif'],
        'mono': ['LINESeedTW', 'PingFang TC', 'Microsoft JhengHei', 'sans-serif'],
        'custom': ['LINESeedTW', 'Microsoft JhengHei', 'sans-serif'],
        'noto': ['LINESeedTW', 'Microsoft JhengHei', 'sans-serif'],
      },
      colors: {
        // 面：頁面底 → 卡片 → 浮起
        'ink': token('ink'),
        'surface': token('surface'),
        'raised': token('raised'),
        // 邊框
        'line': {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        // 文字：主要 → 次要 → 說明 → 提示
        'fg': {
          DEFAULT: token('fg'),
          soft: token('fg-soft'),
        },
        'muted': token('muted'),
        'subtle': token('subtle'),
        // 語意色
        'accent': token('accent'),
        'azure': token('azure'),
        'mint': token('mint'),
        'danger': token('danger'),
        'warn': token('warn'),
      },
      borderRadius: {
        'lg': '6px',
        'xl': '10px',
        '2xl': '14px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(1rem)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
