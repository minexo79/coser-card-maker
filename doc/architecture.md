# 專案架構與開發流程說明

## 1. 專案概覽

Anicon DIVA CardMaker 是一個以 React + HTML5 Canvas 為核心的預定圖製作工具。
使用者在左側表單填入活動資訊、設定天數、上傳每日圖片，右側即時預覽合成後的卡片，最後可下載 PNG。

目前系統已採用「模板驅動」架構，支援多種版型，並以同一套 Hook 邏輯動態處理多天資料。

### 技術棧

| 類別 | 工具 / 版本 |
|---|---|
| UI 框架 | React |
| 建置工具 | Vite |
| 樣式 | Tailwind CSS 3 |
| 圖片合成 | HTML5 Canvas API |
| QR Code | qrcode 1.5 |
| 圖示 | lucide-react |
| 測試 | Vitest + Testing Library |

---

## 2. 目錄結構

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
│   │   ├── CardMaker.jsx             # 主容器（表單 + 預覽）
│   │   ├── CardPreview.jsx           # Canvas 預覽展示
│   │   ├── ImageUpload.jsx           # 圖片上傳元件
│   │   ├── Copyright.jsx             # 版權聲明
│   │   └── PreviewModal.jsx          # 放大預覽與下載
│   ├── hooks/
│   │   ├── useCardMaker.js           # 核心狀態 + Canvas 繪製
│   │   └── useQRCode.js              # QR Code 生成
│   ├── models/
│   │   └── cardTemplates.js          # 1p/2p/3p 模板設定
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

---

## 3. 分層說明

### 3.1 Components 層（src/components）

#### CardMaker.jsx

- 主畫面容器，採 12 欄 grid 佈局（左側設定、右側預覽）。
- 呼叫 useCardMaker 取得所有狀態與行為。
- 控制主要表單欄位：活動名稱、起始日期、天數、暱稱、類別、留言。
- 依當前模板的 imageSlots 產生每日設定區，並以 tab 切換要編輯的天數。
- 以 useEffect 監聽資料變化，觸發 renderCanvas（hook 端已做 300ms debounce）。

#### CardPreview.jsx

- 純展示元件，負責顯示 canvas 與 loading overlay。
- 提供點擊放大入口（交由父層開啟 Modal）。

#### ImageUpload.jsx

- 封裝檔案輸入，統一上傳互動與樣式。
- 允許 image/* 類型，檔案大小由 useCardMaker 驗證。

#### PreviewModal.jsx

- 顯示放大預覽並提供下載按鈕。
- 透過 canvas.toDataURL() 取圖。
- 開啟時鎖定 body 捲軸，關閉時還原。

### 3.2 Hooks 層（src/hooks）

#### useCardMaker.js

核心責任：將「模板設定 + 使用者輸入 + 圖片資料」轉為最終 Canvas 內容。

1. 模板驅動初始化

- 由 CARD_TEMPLATES 動態建出 templateByDayCount 映射。
- 自動推導 supportedDayCounts 與 defaultDayCount。
- 統一蒐集所有 day key（d1, d2, d3...），確保各狀態物件結構一致。

2. 狀態模型

- sharedFormData：共用欄位（title, nickname, category, message, showQRCode, websiteUrl）
- dayDetails：各天獨立欄位（date, cosrole）
- imageDatas：各天圖片 DataURL
- imageOffsets：各天圖片水平偏移
- dayCount：目前天數
- isLoading / showModal：UI 狀態

3. 關鍵行為

- normalizeDayCount：將使用者輸入正規化為可用模板天數。
- updateDayDetail：更新特定天資料；若更新 d1 date，會自動推算後續日期。
- handleImageUpload：驗證大小（5MB）並以 FileReader 轉 DataURL。
- getCurrentTemplate：依 dayCount 回傳對應模板（含 fallback）。

4. 渲染與效能控制

- formDataString：將關鍵渲染資料序列化，作為變更快照。
- isRenderingRef：渲染鎖，避免並發重入。
- lastRenderDataRef：若快照未變，跳過渲染。
- debouncedRenderCanvas：300ms 延遲觸發，減少高頻重算。

5. Canvas 合成流程（renderCanvas）

```text
1) 取得當前模板並設定 canvas 尺寸
2) 載入模板底圖（template.baseImagePath）
3) 逐一繪製 imageSlots 對應的使用者圖片（cover 裁切 + clip）
4) 若啟用 QR Code，生成後繪製於右下角
5) 依模板 textPositions 繪製 title / nickname / category / message
6) 逐日繪製 date + cosrole（MM-DD 轉換）
```

#### useQRCode.js

- 封裝 qrcode 套件。
- 提供 DataURL 與 Canvas 兩種輸出，主流程使用 Canvas 版本合成。

### 3.3 Models 層（src/models）

#### cardTemplates.js

此檔為版型設定唯一來源，集中定義：

- baseImagePath：底圖來源
- canvas：畫布尺寸
- upload：上傳限制
- qrCode：QR 尺寸與留白
- imageSlots：多天圖片插槽（key/label/座標/尺寸）
- textPositions：各文字區塊字級與座標

---

## 4. 資料流

```text
使用者操作（輸入欄位 / 天數切換 / 圖片上傳 / QR 開關）
   ↓
CardMaker 觸發事件
   ↓
useCardMaker 更新狀態
  - sharedFormData
  - dayDetails
  - imageDatas
  - imageOffsets
   ↓
CardMaker useEffect 呼叫 renderCanvas
   ↓
useCardMaker 內部 debounce + 快照去重 + 渲染鎖
   ↓
Canvas 合成（底圖 -> 每日圖片 -> QR -> 文字）
   ↓
CardPreview 即時顯示
   ↓
PreviewModal 以 toDataURL 放大檢視與下載
```

---

## 5. 開發流程

### 5.1 本機啟動

```bash
npm install
npm run dev
```

預設網址：http://localhost:5173（vite --host，可區網存取）

### 5.2 日常指令

```bash
npm run lint
npm run test
npm run coverage
npm run build
npm run preview
```

### 5.3 典型開發步驟

```text
1) 調整模板（cardTemplates.js）或 UI 欄位（CardMaker.jsx）
2) 補上/調整 useCardMaker 的狀態與繪製邏輯
3) 啟動 dev 確認畫面與輸出 PNG
4) 執行 lint + test
5) 再進行 build 驗證產出
```

---

## 6. 擴充指引

### 6.1 新增模板（例如 4p）

1. 在 src/models/cardTemplates.js 新增模板物件。
2. 新增對應底圖到 public/img。
3. 設定 imageSlots（d1, d2, d3, d4）與 textPositions。
4. 驗證 dayCount 切換、每日上傳、文字位置與下載結果。

### 6.2 新增表單欄位

1. 在 useCardMaker.js 新增欄位狀態與更新函式。
2. 在 CardMaker.jsx 增加 UI 控制項。
3. 在 renderCanvas 增加繪製規則。
4. 視需求補測試。

### 6.3 調整底圖與版面

1. 替換模板的 baseImagePath 指向新檔。
2. 調整 imageSlots 與 textPositions 座標。
3. 逐模板檢查文字、裁切與 QR 位置。
