/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
    fontFamily: {
        'custom': ['LINESeedTW', 'Microsoft JhengHei', 'sans-serif'],
        'noto': ['LINESeedTW', 'Microsoft JhengHei', 'sans-serif'],
        'sans': ['LINESeedTW', 'Custom Font', 'Microsoft JhengHei', 'PingFang TC', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
      colors: {
        'card-primary': '#3b82f6',
        'card-secondary': '#64748b',
      }
    },
  },
  plugins: [],
}