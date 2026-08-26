# 專案架構與開發流程說明

## 1. 專案概覽

Anicon DIVA CardMaker 是一個以 React + HTML5 Canvas 為核心的預定圖製作工具。
使用者在左側表單填入活動資訊、設定天數、上傳每日圖片，右側即時預覽合成後的卡片，
可將圖卡儲存至後端並透過 `/card/:id` 連結分享，最後下載 PNG。

系統採「前後端分離」部署：

- **frontend/**：React SPA，負責表單、Canvas 合成、預覽與下載（部署於 Vercel）
- **backend/**：Python FastAPI，負責卡片 JSON 儲存、圖片上傳與 heartbeat（自架主機）

目前系統採用「模板驅動」架構，支援多種版型，並以同一套 Hook 邏輯動態處理多天資料。

### 技術棧

| 類別 | 工具 / 版本 |
|---|---|
| UI 框架 | React |
| 建置工具 | Vite |
| 樣式 | Tailwind CSS 3 |
| 圖片合成 | HTML5 Canvas API |
| 圖示 | lucide-react |
| 前端測試 | Vitest + Testing Library |
| 後端框架 | Python FastAPI（Conda env：`ccm-backend`，Python 3.12） |
| 後端測試 | pytest + FastAPI TestClient |

---

## 2. 目錄結構

```text
ccm/
├── frontend/
│   ├── public/
│   │   ├── fonts/                        # 字型資源
│   │   └── img/                          # 卡片底圖（1p~4p）
│   ├── src/
│   │   ├── main.jsx                      # 應用入口
│   │   ├── App.jsx                       # 根元件（BrowserRouter）
│   │   ├── index.css                     # 全域樣式
│   │   ├── components/
│   │   │   ├── CardMaker.jsx             # 主容器（表單 + 預覽 + 儲存/載入）
│   │   │   ├── CardPreview.jsx           # Canvas 預覽展示
│   │   │   ├── ImageUpload.jsx           # 圖片上傳元件
│   │   │   ├── Copyright.jsx             # 版權聲明
│   │   │   ├── PreviewModal.jsx          # 放大預覽與下載
│   │   │   └── Heartbeat.jsx             # 後端心跳燈號頁
│   │   ├── hooks/
│   │   │   ├── useCardMaker.js           # 核心狀態 + Canvas 繪製 + 後端存取
│   │   │   ├── useImageLayerRenderer.js  # 角色圖片狀態 + Canvas 繪製
│   │   │   └── useTools.js               # 共用庫
│   │   ├── services/
│   │   │   └── api.js                    # API client（相對路徑 + token）
│   │   ├── utils/
│   │   │   └── cardPayload.js            # 卡片 payload 序列化純函式
│   │   ├── models/
│   │   │   ├── cardTemplates.js          # 1p~4p 模板設定
│   │   │   └── oemCardTemplates.js       # 客製化模板
│   │   └── __tests__/                    # vitest 測試（components/hooks/models/services/utils）
│   ├── .env.example                      # VITE_API_TOKEN 範例
│   └── （建置設定檔略）
├── backend/
│   ├── app/
│   │   ├── main.py                       # FastAPI 入口 + CORS + StaticFiles
│   │   ├── core/
│   │   │   ├── config.py                 # pydantic-settings 環境設定
│   │   │   └── security.py               # x-api-token 驗證（compare_digest）
│   │   ├── routers/
│   │   │   ├── ping.py                   # GET /api/ping
│   │   │   ├── cards.py                  # POST /api/cards、GET /api/cards/{id}
│   │   │   └── uploads.py                # POST /api/uploads
│   │   └── services/
│   │       └── storage.py                # cards.json 原子讀寫
│   ├── tests/                            # pytest 測試
│   ├── requirements.txt
│   ├── .env.example                      # API_TOKEN、ALLOWED_ORIGINS
│   ├── data/cards.json                   # 卡片索引（執行期生成）
│   └── uploads/                          # 上傳圖片（執行期生成）
├── README.md                             # monorepo 總覽
└── PLAN.md                               # 重構計畫
```

---

## 3. 分層說明

### 3.1 Components 層（src/components）

#### CardMaker.jsx

- 主畫面容器，採 12 欄 grid 佈局（左側設定、右側預覽）。
- 呼叫 useCardMaker 取得所有狀態與行為。
- 控制主要表單欄位：暱稱、類別、留言、起始日期、天數、每日出角資訊。
- 「雲端儲存」區塊：儲存到伺服器（取得分享連結）、依 ID 載入。
- 由路由 `/card/:cardId` 進入時自動載入該卡。

#### Heartbeat.jsx

- 每 5 秒呼叫 `api.ping()`，以 HTTP round-trip 作為 ping 延遲量測。
- 極簡燈號：綠＝上線（status ok）、紅＝離線、灰＝檢查中。
- 附帶最後檢查時間與延遲 ms。

#### 其餘元件

- **CardPreview**：純展示；主 canvas + 隱藏的離屏圖層 canvas（imageLayerRef）。
- **ImageUpload**：封裝檔案輸入；檔案大小由 useCardMaker 驗證。
- **PreviewModal**：放大預覽＋ `canvas.toDataURL()` 下載；開啟時鎖定 body 捲軸。

### 3.2 Hooks / Services / Utils 層

#### useCardMaker.js

核心責任：將「模板設定 + 使用者輸入 + 圖片 URL」轉為最終 Canvas 內容，並提供後端存取。

1. 模板驅動初始化：由 CARD_TEMPLATES 建 templateByDayCount 映射與 supportedDayCounts。
2. 狀態模型：
   - sharedFormData：nickname / message / category
   - dayDetails：各天 date、cosrole
   - imageDatas：各天圖片 **URL**（由後端上傳取得）
   - imageOffsets、dayCount、titleImageData、baseCanvasOverride（OEM 覆寫）
3. 圖片上傳：`handleImageUpload` / `handleTitleImageUpload` 先驗大小，再呼叫
   `api.uploadImage(file)` 換回 URL 存入狀態。
4. 後端存取：
   - saveCard()：buildCardPayload() 序列化 → POST /api/cards → 回傳 id；
     未設定 token 時以 prompt 詢問並存入 localStorage。
   - loadCard(id)：GET /api/cards/{id} → applyCardPayload() 還原各項狀態。
5. 渲染效能控制：formDataString 快照去重、isRenderingRef 渲染鎖、底圖/標題圖快取、debounce。
6. Canvas 合成流程：底圖 → 離屏圖層繪製各日圖片（cover 裁切 + clip）→ 合成 →
   標題圖（等比置中）→ 文字（暱稱/類別/留言/每日日期+角色）。

#### services/api.js

- 所有 API 請求使用相對路徑（/api/...、/uploads/...），本地開發由 Vite proxy 轉發，正式環境由 Vercel rewrite 轉發，無需設定後端網址。
- request() 統一附加 `x-api-token` header（存在時），非 2xx 拋出帶 status 的錯誤。
- uploadImage() 回傳相對路徑（`/uploads/...`）；卡片/事件模板僅儲存相對路徑，
  顯示時由 `resolveAssetUrl()` 組合 BASE_URL（後端搬家不需改歷史資料；
  `./img/...` 屬前端模板資源，不補 BASE_URL；完整網址原樣使用以相容舊資料）。
- 提供 ping / saveCard / loadCard / uploadImage / resolveAssetUrl 與 getToken/setToken/clearToken。

#### utils/cardPayload.js

- buildCardPayload()：UI 狀態 → 可序列化 payload（防禦性複製）。
- applyCardPayload()：payload → UI 狀態欄位（缺漏給安全預設、非法輸入拋錯）。
- 純函式設計，便於單元測試；欄位需與後端白名單同步維護。

### 3.3 Models 層（src/models）

- cardTemplates.js：版型設定唯一來源（canvas/upload/imageSlots/titleImage/textPositions）。
- oemCardTemplates.js：客製化模板（URL `/:eventName` 對應 preset，含 overWriteCanvas 覆寫）。

### 3.4 Backend 層（backend/app）

#### main.py

- 建立 FastAPI app；掛 CORSMiddleware（ALLOWED_ORIGINS 白名單，
  涵蓋 /uploads 使跨域圖片可安全繪製 canvas 不被污染）。
- StaticFiles 掛載 `/uploads` 服務上傳圖片。
- 自動建立 data/ 與 uploads/ 目錄。

#### routers/ping.py

- `GET /api/ping` → `{ status:'ok', uptime:<秒>, timestamp:<ISO8601> }`（公開）。

#### routers/cards.py

- `POST /api/cards`（Token）：讀原始 body 做 5MB 上限檢查（413）→ pydantic
  CardPayload 白名單驗證（未知欄位自動剝除）→ storage.save_card() → 回 `{ id }`。
- `GET /api/cards/{id}`（公開）：回完整紀錄；不存在回 404。

#### routers/uploads.py

- `POST /api/uploads`（Token）：multipart 欄位 `file`；
  content-type 白名單（png/jpeg/webp/gif，否則 415）；串流上限 5MB（否則 413）；
  以 `uuid4().hex` 生成檔名（不信任原始檔名）→ 回 `{ url:'/uploads/<name>' }`。

#### core/security.py + core/config.py

- require_token相依性：比對 `x-api-token` 與環境變數 API_TOKEN（secrets.compare_digest）。
- Settings（pydantic-settings）：API_TOKEN、ALLOWED_ORIGINS、DATA_DIR、UPLOADS_DIR、
  MAX_UPLOAD_BYTES、MAX_CARD_PAYLOAD_BYTES，可由 .env 覆寫。

#### services/storage.py

- cards.json 讀寫；寫入採「mkstemp 暫存 → os.replace」原子替換；
  threading.Lock 保護併發。

---

## 4. 資料流

```text
【製圖】使用者操作 → CardMaker 事件 → useCardMaker 更新狀態
  → useEffect(debounce) → renderCanvas（快照去重 + 渲染鎖 + 快取）
  → Canvas 合成 → CardPreview 即時顯示 → PreviewModal toDataURL 下載

【上傳】選檔 → api.uploadImage(FormData) → POST /api/uploads
  → 伺服器驗 MIME/大小、生成 UUID 檔名 → 回傳 /uploads/<uuid>.<ext>
  → URL 寫入 imageDatas / BaseImageData → 觸發重繪

【儲存】儲存按鈕 → buildCardPayload() → POST /api/cards（x-api-token）
  → cards.json 原子寫入 → 回 { id } → 顯示分享連結 /card/:id

【載入】開啟 /card/:id 或輸入 ID → GET /api/cards/:id
  → applyCardPayload() → 還原天數/表單/圖片 URL/偏移 → 重繪

【心跳】/heartbeat 頁面 → 每 5 秒 GET /api/ping → 綠/紅燈 + RTT ms
```

---

## 5. 開發流程

### 5.1 本機啟動（兩個終端）

```bash
# 後端
cd backend
conda activate ccm-backend
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm run dev        # http://localhost:5173
```

首次設定：

```bash
cd backend && conda create -n ccm-backend python=3.12 -y && conda activate ccm-backend && pip install -r requirements.txt && cp .env.example .env
cd frontend && npm install && cp .env.example .env
```

### 5.2 日常指令

```bash
cd frontend
npm run lint
npx vitest run          # 全部前端測試
npm run build

cd backend
python -m pytest tests -v
```

### 5.3 典型開發步驟

```text
1) 調整模板（cardTemplates.js）或 UI 欄位（CardMaker.jsx）
2) 若涉及卡片保存欄位：同步 cardPayload.js 與後端 cards.py 白名單
3) 先補/改兩端測試（vitest + pytest），再實作至綠燈
4) 啟動前後端驗證畫面、儲存/載入與下載 PNG
5) lint + test + build 全數通過
```

---

## 6. 擴充指引

### 6.1 新增模板（例如 5p）

1. 在 src/models/cardTemplates.js 新增模板物件。
2. 新增對應底圖到 public/img。
3. 設定 imageSlots（d1...d5）與 textPositions。
4. 驗證 dayCount 切換、每日上傳、文字位置與下載結果。

### 6.2 新增表單欄位（需隨卡片保存）

1. 在 useCardMaker.js 新增欄位狀態。
2. 更新 utils/cardPayload.js（build/apply）與後端 cards.py 白名單。
3. 同步更新 vitest（cardPayload.test.js）與 pytest（test_cards.py）。
4. 在 CardMaker.jsx 增加 UI 控制項，並於 renderCanvas 增加繪製規則。

### 6.3 調整底圖與版面

1. 替換模板的 baseImagePath 指向新檔。
2. 調整 imageSlots 與 textPositions 座標。
3. 逐模板檢查文字、裁切與下載結果。

### 6.4 後端組態

| 環境變數 | 預設 | 說明 |
|---|---|---|
| API_TOKEN | dev-token | 寫入操作共用 token |
| ALLOWED_ORIGINS | * | CORS 白名單（逗號分隔） |
| DATA_DIR | backend/data | cards.json 位置 |
| UPLOADS_DIR | backend/uploads | 圖片儲存位置 |
