# 開發規劃：多天數卡片模板 + 導航流程

## 背景與前提

| 項目 | 說明 |
|---|---|
| 現有底圖 | `card_base_1p.png`（座標完整）、`card_base_2p.png`（座標待提供） |
| 天數選擇 | 下拉 1天 / 2天 → 自動切換 1p / 2p 底圖 |
| D1 / D2 獨立性 | 各自擁有獨立的日期、角色名稱、上傳圖片 |
| 條款行為 | 每次開啟頁面都顯示，無快取 |
| 架構原則 | 維持 Hooks + Component 分層，不過度抽象 |

---

## Phase 1 — 測試框架 + Model Layer

**目標**：補齊測試基礎設施，建立模板座標的唯一來源。

### 步驟

1. 安裝測試依賴
   - `vitest`、`@testing-library/react`、`@testing-library/jest-dom`、`jsdom`、`@vitest/coverage-v8`
2. 更新 `vite.config.js`，加入 `test: { environment: 'jsdom', globals: true, setupFiles }`
3. 更新 `package.json`，新增 `test` 與 `coverage` script
4. 新建 `src/models/cardTemplates.js`，定義統一模板結構：
   - `CARD_TEMPLATES['1p']` → 完整座標（從現有 `cardLayout.js` 搬入）
   - `CARD_TEMPLATES['2p']` → 結構相同，canvas 與 imageSlots 座標暫填 `null`
   - 每個 `imageSlot`：`{ key: 'd1' | 'd2', label, x, y, width, height }`
5. 更新 `src/constants/cardLayout.js`，改為從 model re-export，保持向後相容（現有 import 零修改）
6. 新建 `src/__tests__/models/cardTemplates.test.js`：
   - 每個 template 必要欄位存在
   - 1p 的 `imageSlots` 長度為 `1`
   - 2p 的 `imageSlots` 長度為 `2`

### 驗收
> `npm run test` 全部通過；現有 App 行為零變動。

---

## Phase 2 — Hook 重構：支援多天數狀態

**目標**：`useCardMaker` 的圖片與日期狀態改為 per-day 結構，並接通 Model。

### 步驟

1. 更新 `src/hooks/useCardMaker.js`：

   | 舊狀態 | 新狀態 |
   |---|---|
   | `imageData` | `imageDatas: { d1: null, d2: null }` |
   | `imageOffsetX` | `imageOffsets: { d1: 0, d2: 0 }` |
   | `formData.date` | `dayDetails.d1.date` / `dayDetails.d2.date` |
   | `formData.cosrole` | `dayDetails.d1.cosrole` / `dayDetails.d2.cosrole` |

   - `formData` 保留共享欄位：`title`、`nickname`、`message`、`category`、`websiteUrl`、`showQRCode`
   - 新增 `dayCount` state（預設 `1`）
   - 新增 `handleImageUpload(file, dayKey)` day-aware 版本
   - 新增 `updateDayDetail(dayKey, field, value)`
   - 新增 `getCurrentTemplate()` → 依 `dayCount` 回傳 `CARD_TEMPLATES['1p']` 或 `'2p'`
   - `renderCanvas` Phase 3 先保持 d1 單槽邏輯正確，Phase 5 補全

2. 測試：
   - `dayCount` 切換 → `getCurrentTemplate()` 回傳正確模板
   - `handleImageUpload('d1')` 只更新 `imageDatas.d1`
   - `updateDayDetail('d2', 'date', '2026-04-01')` 更新正確欄位

### 驗收
> 1天模式功能與 Phase 2 完全相同（d1 資料對應現行邏輯）。

---

## Phase 3 — DIY View UI 更新

**目標**：表單加入天數切換下拉，D2 欄位條件渲染。

### 步驟

1. 更新 `src/components/ImageUpload.jsx`：加入 `label` prop，顯示在上傳區標題（如「第一天 DAY 1」）
2. 更新 `src/components/CardMaker.jsx`：
   - 活動名稱下方加入「天數」下拉 `<select>`（選項：`1天` / `2天`）→ 呼叫 `setDayCount`
   - 日期、角色、ImageUpload、位移滑桿封裝為 `DaySlot` 區塊（component 內的 UI 區塊，非獨立 component）
   - D1 永遠顯示；D2 僅在 `dayCount === 2` 時顯示
   - 每個 `DaySlot` 標題來自 `template.imageSlots[i].label`
3. 測試：
   - 下拉切換至 2天 → D2 區塊出現
   - 下拉切換回 1天 → D2 區塊消失
   - D1 / D2 的 ImageUpload 分別傳入正確 `dayKey`

### 驗收
> 選 1天行為與現在相同；選 2天可填兩組資料（Canvas 繪製 Phase 5 補全）。

---

## Phase 4 — 多p Canvas 多槽渲染

**目標**：補入 2p 甚至 多p 實際座標，Canvas 依天數繪製多個圖片槽。

### 步驟

1. 填入 `src/models/cardTemplates.js` 的 np `null` 佔位座標
2. 更新 `src/hooks/useCardMaker.js` 的 `renderCanvas`：
   - 依 `template.imageSlots` 陣列迭代
   - 每個 slot 從 `imageDatas[slot.key]` 取圖、`imageOffsets[slot.key]` 做水平偏移
   - 文字來自 `dayDetails[slot.key]`
3. 測試（Mock Canvas）：
   - 1p 模板 → `drawImage` 呼叫 1 次
   - 2p 模板 → `drawImage` 呼叫 2 次

### 驗收
> 選 2天後兩張圖分別出現在 Day 1 / Day 2 圖框。

---

## Phase 5 — Navigation Shell（條款 + 首頁）

**目標**：加入使用者流程前置畫面，DIY 頁面維持現狀完整。

### 步驟

1. 新建 `src/hooks/useAppNavigation.js`
   - 狀態機：`'terms'` → `'home'` → `'diy'`
   - 初始值永遠是 `'terms'`
   - 暴露：`currentPage`、`acceptTerms()`、`goToDiy()`、`goToHome()`
2. 新建 `src/components/TermsModal.jsx`
   - 全螢幕遮罩，顯示使用條款文字
   - 「同意並繼續」→ `acceptTerms()` → 導向 `'home'`
3. 新建 `src/components/HomePage.jsx`
   - **合作活動**：灰底、disabled、標示「即將推出」（不實作功能）
   - **DIY 製作**：可點擊 → `goToDiy()`
4. 更新 `src/App.jsx`：依 `currentPage` 渲染對應畫面
5. 測試：
   - `useAppNavigation` 所有狀態轉換
   - `TermsModal` 渲染與按鈕行為
   - `HomePage` 兩卡片渲染與 disabled 狀態

### 驗收
> 開啟 App → 條款 → 首頁 → DIY，製作功能與 Phase 1 完全相同。

---

## 檔案異動總覽

| 檔案 | 動作 | 階段 |
|---|---|---|
| `src/models/cardTemplates.js` | 新建 | Phase 1 |
| `src/constants/cardLayout.js` | 改為 re-export from model | Phase 1 |
| `vite.config.js` | 加入 test config | Phase 1 |
| `package.json` | 加 test / coverage script | Phase 1 |
| `src/hooks/useAppNavigation.js` | 新建 | Phase 2 |
| `src/components/TermsModal.jsx` | 新建 | Phase 2 |
| `src/components/HomePage.jsx` | 新建 | Phase 2 |
| `src/App.jsx` | 更新 | Phase 2 |
| `src/hooks/useCardMaker.js` | 重構 | Phase 3、5 |
| `src/components/CardMaker.jsx` | 更新 | Phase 4 |
| `src/components/ImageUpload.jsx` | 加 `label` prop | Phase 4 |
| `src/__tests__/**` | 各階段新增 | Phase 1–5 |

---

## 待確認事項

1. **2p 文字位置**：`nickname`、`title`、`message`、`dateRole` 在 2p 底圖的座標是否與 1p 相同？建議 Phase 5 前確認，以便在 model 中正確設定 `textPositions`。
2. **2p QR Code**：右下角 QR Code 在 2p 底圖上是否有對應留白空間？位置是否需要調整？
