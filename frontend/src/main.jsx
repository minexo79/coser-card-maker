import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 移除 index.html 的開機畫面：等首次繪製後淡出，再從 DOM 拿掉
const splash = document.getElementById('splash');
if (splash) {
  let hidden = false;
  const hideSplash = () => {
    if (hidden) return;
    hidden = true;
    splash.classList.add('splash-hide');
    const remove = () => splash.remove();
    splash.addEventListener('transitionend', remove, { once: true });
    // transitionend 不一定會觸發（例如分頁在背景），加一個保底
    setTimeout(remove, 600);
  };
  requestAnimationFrame(() => requestAnimationFrame(hideSplash));
  // 背景分頁不會觸發 requestAnimationFrame，以計時器保底
  setTimeout(hideSplash, 1500);
}
