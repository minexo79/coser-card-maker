# Anicon DIVA CardMaker
本專案是一個以 React + HTML5 Canvas 為核心的預定圖製作工具。
使用者可填入活動資訊、上傳多天圖片，右側即時預覽合成結果，最後下載為 PNG 圖片檔案。

## 主要功能

- [X] 多天數模板切換
- [X] 分別上傳圖片與調整水平偏移
- [ ] 社群連結 (以QRCode) 顯示
- [ ] 支援客製化預定底圖 (超連結方式存取)

## 技術棧
- React + Vite
- Vitest
- qrcode 1.5

## 專案架構

```text
card-maker-react/
├── public/
│   ├── fonts/                    # 字型資源
│   └── img/                      # 卡片底圖資源（1p/2p/3p）
├── src/
│   ├── App.jsx                   # 根元件
│   ├── main.jsx                  # 入口
│   ├── index.css                 # 全域樣式
│   ├── components/
│   │   ├── CardMaker.jsx         # 主頁容器（表單與預覽佈局）
│   │   ├── CardPreview.jsx       # Canvas 預覽展示
│   │   ├── ImageUpload.jsx       # 圖片上傳元件
│   │   ├── Copyright.jsx         # 版權聲明
│   │   └── PreviewModal.jsx      # 放大預覽與下載
│   ├── hooks/
│   │   ├── useCardMaker.js       # 核心狀態與 Canvas 繪製流程
│   │   └── useQRCode.js          # QR Code 產生封裝
│   ├── models/
│   │   └── cardTemplates.js      # 1p/2p/3p 模板設定（畫布/圖槽/文字）
│   └── __tests__/
│       ├── components/
│       ├── hooks/
│       └── models/
├── doc/
│   ├── architecture.md
│   └── plan.md
└── package.json
```

## 架構與流程文件

分層說明、資料流、開發流程已移至完整文件：`doc/architecture.md`。

## 擴充指引

### 新增模板（例如 4p）

1. 在 `src/models/cardTemplates.js` 新增模板定義（`canvas`、`imageSlots`、`textPositions`）。
2. 放入對應底圖到 `public/img/`。
3. 確認 `imageSlots` 的 `key` 命名延續 `d1`, `d2`...。
4. 啟動專案驗證天數切換、圖片上傳與文字位置。

### 新增表單欄位

1. 在 `useCardMaker.js` 的狀態中加入欄位。
2. 在 `CardMaker.jsx` 加入 UI 控制項。
3. 在 `renderCanvas` 增加對應繪製邏輯。
4. 視需要更新測試。

## 文件
- 架構與流程詳解：`doc/architecture.md`
