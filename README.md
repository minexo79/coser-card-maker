# Anicon DIVA CardMaker
本專案適用於動漫展參加者的預定圖製作工具。使用者可填入活動資訊、上傳圖片，系統即時透過 HTML5 Canvas 合成卡片，並支援下載為 PNG。

## 技術棧
- **React 19** + **Vite 8** — UI 框架與建置工具
- **Tailwind CSS 3** — 樣式
- **HTML5 Canvas** — 卡片合成與繪製
- **qrcode** — QR Code 產生
- **lucide-react** — UI 圖示

## 專案結構
```
src/
├── App.jsx                  # 根元件
├── components/
│   ├── CardMaker.jsx        # 主容器：表單輸入 + 版面配置
│   ├── CardPreview.jsx      # Canvas 預覽區塊
│   ├── ImageUpload.jsx      # 圖片上傳元件
│   └── PreviewModal.jsx     # 放大預覽與下載 Modal
├── hooks/
│   ├── useCardMaker.js      # 核心狀態管理與 Canvas 渲染邏輯
│   └── useQRCode.js         # QR Code 產生封裝
└── constants/
    └── cardLayout.js        # 版面尺寸、文字位置等所有常數
```

## 功能
- [X] 圖片生成
- [ ] 多天數支援
- [ ] 客製化上傳底圖 & 定位點
- [ ] 底圖切換成後端API獲取

## 快速開始
```bash
npm install
npm run dev
```

預設開發伺服器啟動於 `http://localhost:5173`（`--host` 模式，區網可存取）。

## 詳細架構說明
請參閱 [doc/architecture.md](doc/architecture.md)。
