# 專案架構與開發流程說明

## 1. 專案概覽
**Anicon DIVA CardMaker** 是一個以 React + HTML5 Canvas 為核心的預定圖製作工具。使用者在左側表單填入活動資訊並上傳圖片後，右側即時預覽合成後的卡片，完成後可下載為 PNG 圖檔。

### 技術棧
| 類別 | 工具 / 版本 |
|---|---|
| UI 框架 | React 19 |
| 建置工具 | Vite 8 |
| 樣式 | Tailwind CSS 3 |
| 圖片合成 | HTML5 Canvas API |
| QR Code | qrcode 1.5 |
| 圖示 | lucide-react |

---

## 2. 目錄結構

```
card-maker-react/
├── public/
│   ├── fonts/                  # 自訂字型
│   └── img/
│       └── card_base.png       # 卡片底圖（靜態資源）
├── src/
│   ├── main.jsx                # 應用程式入口，掛載 React root
│   ├── App.jsx                 # 根元件，提供背景色包覆 CardMaker
│   ├── index.css               # 全域樣式（Tailwind base + 自訂 class）
│   ├── components/
│   │   ├── CardMaker.jsx       # 主容器元件
│   │   ├── CardPreview.jsx     # Canvas 預覽展示元件
│   │   ├── ImageUpload.jsx     # 圖片上傳元件
│   │   └── PreviewModal.jsx    # 放大預覽與下載 Modal
│   ├── hooks/
│   │   ├── useCardMaker.js     # 核心邏輯 Hook
│   │   └── useQRCode.js        # QR Code 產生 Hook
│   └── constants/
│       └── cardLayout.js       # 版面所有尺寸與文字位置常數
├── doc/
│   └── architecture.md         # 本文件
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

---

## 3. 架構分層
### 3.1 元件層（`src/components/`）
#### `CardMaker.jsx` — 主容器
- 整個應用的主視圖，採 **12 欄 grid** 佈局（左 4 欄表單、右 8 欄預覽）。
- 呼叫 `useCardMaker` Hook 取得所有狀態與行為。
- 透過 `useEffect` 監聽 `formData` 與 `imageData` 的變化，以 **300ms debounce** 自動觸發 `renderCanvas()`。
- 處理表單欄位：活動名稱、暱稱、類別（COSER / 攝影師）、日期、角色名、留言、QR Code 開關與網址輸入。

#### `CardPreview.jsx` — Canvas 預覽
- 純展示（presentational）元件，只接收 `canvasRef`、`isLoading`、`onPreviewClick` props。
- 渲染 `<canvas>` 元素，顯示 loading spinner 和「點擊放大」懸停提示。

#### `ImageUpload.jsx` — 圖片上傳
- 封裝 `<input type="file">` 的點擊與 `change` 事件。
- 針對 iOS Safari 做相容處理（`touchAction: manipulation`、`WebkitTapHighlightColor`）。
- 限制格式為 JPG / PNG，大小驗證由 `useCardMaker` 負責。

#### `PreviewModal.jsx` — 放大預覽與下載
- 使用 `fixed inset-0` 全螢幕遮罩。
- 從 `canvasRef.current.toDataURL()` 讀取圖片並以 `<img>` 顯示。
- 下載功能：動態建立 `<a download>`，檔名格式為 `card-preview-{timestamp}.png`。
- 開啟時鎖定 `document.body` 捲軸（`overflow: hidden`）。

---

### 3.2 Hook 層（`src/hooks/`）

#### `useCardMaker.js` — 核心邏輯

**狀態管理**
| 狀態 | 類型 | 說明 |
|---|---|---|
| `formData` | Object | 所有表單欄位值 |
| `imageData` | string \| null | 使用者上傳圖片的 Base64 DataURL |
| `isLoading` | boolean | Canvas 渲染中旗標 |
| `showModal` | boolean | Modal 顯示控制 |
**渲染最佳化**

- `isRenderingRef`：防止同一時間重複觸發渲染。
- `lastRenderDataRef`：儲存上次渲染的資料快照（`formDataString + imageData`），資料未變則跳過渲染。
- `formDataString`：以 `useMemo` 將 `formData` 序列化為字串，作為輕量比對依據。

**Canvas 繪製流程（`renderCanvas`）**
```
1. 設定 canvas 尺寸（來自 CARD_CANVAS 常數）
2. 載入底圖 /img/card_base.png
   └─ 失敗時跳出錯誤提示
3. 若有使用者圖片：
   └─ 計算 cover 裁切比例（imageOffsetX 控制水平偏移）
   └─ canvas.clip() 限制繪製區域
4. 若啟用 QR Code：
   └─ 呼叫 useQRCode.generateQRCodeCanvas()
   └─ 繪製白底背景後貼上 QR Code（右下角）
5. 繪製文字（title / nickname / category / message / dateRole）
   └─ title 支援多行（空格或換行符拆分），自動垂直置中
   └─ message 自動換行（measureText 超出 maxWidth 則斷行）
```

#### `useQRCode.js` — QR Code 產生
提供兩個方法：

| 方法 | 輸出 | 用途 |
|---|---|---|
| `generateQRCode(text)` | DataURL string | 一般圖片用途 |
| `generateQRCodeCanvas(text)` | HTMLCanvasElement | 直接合成至主 Canvas |

預設設定：110.9px、黑白色、`errorCorrectionLevel: M`、`margin: 1`。

---

### 3.3 常數層（`src/constants/cardLayout.js`）

所有版面數值的**唯一真實來源**，修改版面時只需編輯此檔案。

| 匯出常數 | 說明 |
|---|---|
| `CARD_CANVAS` | 畫布尺寸（1220 × 850 px） |
| `CARD_UPLOAD` | 上傳限制（最大 5 MB） |
| `CARD_IMAGE_AREA` | 使用者圖片裁切區域座標與尺寸 |
| `CARD_QR_CODE` | QR Code 尺寸與內外 padding |
| `CARD_TEXT` | 各文字欄位的字族、字級、座標 |
| `DEFAULT_BASE_IMAGE_LAYOUT` | fallback 底圖的矩形版面結構 |

---

## 4. 資料流

```
使用者操作（表單輸入 / 圖片上傳）
         │
         ▼
   useCardMaker
   ├─ updateFormData() → setFormData()
   └─ handleImageUpload() → FileReader → setImageData()
         │
         ▼ (formData / imageData 變化)
   CardMaker useEffect (debounce 300ms)
         │
         ▼
   renderCanvas()
   ├─ 底圖（/img/card_base_1p.png 或 fallback）
   ├─ 使用者圖片（cover 裁切 + clip）
   ├─ QR Code（useQRCode → canvas 繪製）
   └─ 文字（title / nickname / category / message / dateRole）
         │
         ▼
   <canvas ref={canvasRef}>
   ├─ CardPreview → 即時預覽
   └─ PreviewModal → toDataURL() → 下載 PNG
```

---

## 5. 靜態資源

| 路徑 | 說明 |
|---|---|
| `public/img/card_base_1p.png` | 卡片底圖，由 Canvas 繪製時載入 |
| `public/fonts/` | LINESeedTW 字型檔，CSS `@font-face` 引入，用於 Canvas `ctx.font` |

> **注意**：Canvas 繪製文字時使用的字型必須已由瀏覽器載入（DOM 中有使用該字型），否則會 fallback 至 Arial。`index.css` 以 Tailwind 全域 class 確保字型提前載入。

---

## 6. 擴充指引

### 新增表單欄位
1. 在 `useCardMaker.js` 的 `formData` 初始值新增欄位。
2. 在 `cardLayout.js` 的 `CARD_TEXT` 新增對應的座標與字級常數。
3. 在 `useCardMaker.js` 的 `renderCanvas()` 內新增繪製邏輯。
4. 在 `CardMaker.jsx` 新增表單 UI 控制項。

### 更換底圖
1. 將新圖片放入 `public/img/`。
2. 修改 `useCardMaker.js` 中 `baseImg.src` 路徑。
3. 依新底圖調整 `cardLayout.js` 中各區域的座標常數。
