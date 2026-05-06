# Anicon DIVA CardMaker
本專案是一個以 React + HTML5 Canvas 為核心的預定圖製作工具。
使用者可填入活動資訊、上傳多天圖片，右側即時預覽合成結果，最後下載為 PNG 圖片檔案。

## 主要功能

<<<<<<< HEAD
- 支援多天數模板切換
- 每天可分別上傳圖片與調整水平偏移
- 以起始日期自動推算後續天數日期
- 即時 Canvas 合成預覽（含文字排版與裁切）
- 可選擇是否顯示 QR Code，並輸入自訂網址
- 點擊預覽可開啟 Modal 放大並下載 PNG

## 技術棧

- React 19
- Vite 8
- Tailwind CSS 3
- HTML5 Canvas API
- qrcode 1.5
- lucide-react
- Vitest + Testing Library
=======
- [X] 多天數模板切換
- [X] 分別上傳圖片與調整水平偏移
- [X] 支援客製化預定底圖 (超連結方式)
- [ ] 後端存取

## 技術棧
- React + Vite
- Vitest
>>>>>>> c861ee7 (移除QRCode程式碼，調整圖片繪製邏輯減少流量耗損，整理沒用的程式碼)

## 專案架構

```text
card-maker-react/
├── public/
│   ├── fonts/                        # 字型資源
│   └── img/                          # 卡片底圖（1p/2p/3p）
├── src/
│   ├── main.jsx                      # 應用入口
│   ├── App.jsx                       # 根元件
│   ├── index.css                     # 全域樣式
│   ├── components/
<<<<<<< HEAD
│   │   ├── CardMaker.jsx         # 主頁容器（表單與預覽佈局）
│   │   ├── CardPreview.jsx       # Canvas 預覽展示
│   │   ├── ImageUpload.jsx       # 圖片上傳元件
│   │   └── PreviewModal.jsx      # 放大預覽與下載
=======
│   │   ├── CardMaker.jsx             # 主容器（表單 + 預覽）
│   │   ├── CardPreview.jsx           # Canvas 預覽展示
│   │   ├── ImageUpload.jsx           # 圖片上傳元件
│   │   ├── Copyright.jsx             # 版權聲明
│   │   └── PreviewModal.jsx          # 放大預覽與下載
>>>>>>> c861ee7 (移除QRCode程式碼，調整圖片繪製邏輯減少流量耗損，整理沒用的程式碼)
│   ├── hooks/
│   │   ├── useCardMaker.js           # 核心狀態 + Canvas 繪製
│   │   ├── useImageLayerRenderer.js  # 角色圖片狀態 + Canvas 繪製
│   │   ├── useTools.js               # 共用庫
│   ├── models/
│   │   └── cardTemplates.js          # 1p/2p/3p 模板設定
│   │   └── oemCardTemplates.js       # 客製化模板
│   └── __tests__/
│       ├── components/
│       ├── hooks/
│       └── models/
├── doc/
│   ├── architecture.md               # 本文件
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

## 擴充指引

### 新增模板（例如 4p）

1. 在 `src/models/cardTemplates.js` 新增模板定義（`canvas`、`imageSlots`、`textPositions`）。
2. 放入對應底圖到 `public/img/`。
3. 確認 `imageSlots` 的 `key` 命名延續 `d1`, `d2`...。
4. 啟動專案驗證天數切換、圖片上傳與文字位置。

### 新增客製化模板
1. 在 `src/models/oemCardTemplates.js` 新增如下的模板定義。
```
aabbcc: {
    dayCount: 2,
    startDate: "2026-05-23",
    baseImagePath: "./img/card_base_2p_aabbcc.png",
    lockTitleImage: true
}
```
2. 放入對應底圖到 `public/img/`。
4. 啟動專案，開啟瀏覽器，在網址後面加入`/aabbcc`，驗證圖片是否有更改。

### 新增表單欄位

1. 在 `useCardMaker.js` 的狀態中加入欄位。
2. 在 `CardMaker.jsx` 加入 UI 控制項。
3. 在 `renderCanvas` 增加對應繪製邏輯。
4. 視需要更新測試。

## 文件
- 架構與流程詳解：`doc/architecture.md`
<<<<<<< HEAD
- 開發規劃：`doc/plan.md`
=======

## 參考
- [雲緣起活動網站前端 - YAF_web](https://github.com/YunlinAnimeFestival/YAF_web)
>>>>>>> c861ee7 (移除QRCode程式碼，調整圖片繪製邏輯減少流量耗損，整理沒用的程式碼)
