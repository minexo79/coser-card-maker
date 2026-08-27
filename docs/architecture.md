# 專案架構與開發流程說明

## 1. 專案概覽

Anicon DIVA CardMaker 是一個以 React + HTML5 Canvas 為核心的預定圖製作工具。
使用者在表單填入活動資訊、設定天數、上傳每日圖片，即時預覽合成後的卡片，最後下載 PNG。
可將圖卡儲存至後端並透過 `/card/:id` 連結分享。

系統採「前後端分離」部署：

- **frontend/**：React SPA，負責表單、Canvas 合成、預覽與下載（部署於 Vercel）
- **backend/**：Python FastAPI，負責卡片／活動模板 JSON 儲存、圖片上傳、
  JWT 身分驗證與審計日誌（自架主機）

除了製圖之外，後續加入：

- **登入/登出與使用者管理**：JWT 存取權杖 + httpOnly refresh cookie、角色權限（admin / user）
- **管理面板**（`/admin`）：模板清單、模板編輯器、使用者管理、密碼修改、審計日誌
- **客製化 OEM 模板**：以 `/api/events/{id}` 儲存之版面（含 `createdBy` 所有權），
  前端以 `/:eventId` 路由載入並覆寫預設版面

### 技術棧

| 類別 | 工具 / 版本 |
|---|---|
| UI 框架 | React（React Router、Context） |
| 建置工具 | Vite |
| 樣式 | Tailwind CSS |
| 圖片合成 | HTML5 Canvas API |
| 圖示 | lucide-react |
| 前端測試 | Vitest + Testing Library（jsdom） |
| 後端框架 | Python FastAPI（Conda env：`ccm-backend`） |
| 後端認證 | PyJWT + bcrypt（密碼雜湊） |
| 後端測試 | pytest + FastAPI TestClient |

---

## 2. 目錄結構

```text
ccm/
├── frontend/
│   ├── public/
│   │   └── img/                        # 卡片底圖（1p~4p）
│   └── src/
│       ├── main.jsx                    # 應用入口
│       ├── App.jsx                     # 根元件（BrowserRouter + 路由表）
│       ├── components/
│       │   ├── CardMaker.jsx           # 製圖主頁（表單 + 預覽 + 儲存/載入）
│       │   ├── CardPreview.jsx         # Canvas 預覽展示
│       │   ├── ImageUpload.jsx         # 圖片上傳元件
│       │   ├── PreviewModal.jsx        # 放大預覽與下載
│       │   ├── Login.jsx               # 登入頁
│       │   ├── NavBar.jsx              # 頂部導覽列
│       │   ├── ProtectedRoute.jsx      # 需登入的受保護路由
│       │   ├── Heartbeat.jsx           # 後端心跳燈號頁
│       │   ├── admin/
│       │   │   ├── AdminDashboard.jsx  # 管理面板（tab 容器）
│       │   │   ├── UserManagement.jsx  # 使用者管理
│       │   │   ├── ChangePassword.jsx  # 密碼修改
│       │   │   └── AuditLogList.jsx    # 審計日誌
│       │   └── templateEditor/
│       │       ├── TemplateEditor.jsx  # 模板編輯器主體
│       │       ├── TemplateCanvas.jsx  # 畫布與網格疊層
│       │       ├── ElementList.jsx     # 版面樹
│       │       ├── ElementOverlay.jsx  # 元素拖曳框
│       │       ├── PropertyPanel.jsx   # 屬性面板
│       │       ├── Toolbar.jsx         # 工具列（新增元素/底圖/儲存）
│       │       ├── useTemplateDraft.js # 草稿狀態 Hook
│       │       ├── usePointerDrag.js   # 拖曳邏輯 Hook
│       │       ├── TemplateListPage.jsx / TemplateListModal.jsx
│       │       └── constants.js        # 群組標籤、欄位標籤
│       ├── contexts/
│       │   ├── AuthProvider.jsx / AuthContext.js / useAuth.js   # 登入狀態
│       │   └── CardMakerProvider.jsx / cardMakerContext.js / useCardMakerContext.js
│       ├── hooks/
│       │   ├── useCardMaker.js           # 核心製圖狀態 + Canvas 繪製 + 後端存取
│       │   ├── useImageLayerRenderer.js  # 角色圖片離屏圖層繪製
│       │   └── useTools.js               # 共用工具
│       ├── services/
│       │   ├── api.js                    # 一般 API client（JWT + 401 自動 refresh）
│       │   └── auth.js                   # 認證 API（login/refresh/logout/audit…）
│       ├── utils/
│       │   ├── cardPayload.js            # 卡片 payload 序列化純函式
│       │   ├── templateDraft.js          # 模板草稿純函式（建草稿/展平元素）
│       │   ├── geometry.js               # 幾何運算
│       │   └── clipboard.js              # 剪貼簿複製
│       ├── models/
│       │   ├── cardTemplates.js          # 1p~4p 內建模板設定
│       │   └── oemCardTemplates.js       # 客製化模板設定
│       └── __tests__/                    # vitest 測試
├── backend/
│   ├── app/
│   │   ├── main.py                       # FastAPI 入口 + 中介層 + CORS + StaticFiles
│   │   ├── core/
│   │   │   ├── config.py                 # Settings（環境變數 / .env）
│   │   │   ├── security.py               # JWT 驗證相依（require_jwt_write）
│   │   │   └── file_validation.py        # 上傳圖片內容驗證（Pillow magic bytes）
│   │   ├── routers/
│   │   │   ├── ping.py                   # GET /api/ping
│   │   │   ├── auth.py                   # 登入/refresh/使用者管理/審計查詢
│   │   │   ├── cards.py                  # POST /api/cards、GET /api/cards/{id}
│   │   │   ├── events.py                 # 活動模板 CRUD + 所有權
│   │   │   └── uploads.py                # POST /api/uploads
│   │   └── services/
│   │       ├── storage.py                # cards.json 原子讀寫
│   │       ├── users.py                  # users.json + bcrypt
│   │       ├── event_templates.py        # event_templates.json 原子讀寫
│   │       └── audit.py                  # audit_log.json 事件記錄
│   ├── tests/                            # pytest 測試
│   ├── requirements.txt
│   ├── .env.example                      # JWT_SECRET、ALLOWED_ORIGINS
│   ├── data/                             # 執行期生成 JSON（cards/users/event_templates/audit_log）
│   └── uploads/                          # 上傳圖片（執行期生成）
├── README.md
├── PLAN.md
└── docs/architecture.md                  # 本文件
```

---

## 3. 前端架構

### 3.1 頁面與路由（App.jsx）

| 路由 | 說明 | 權限 |
|---|---|---|
| `/` | 預設製圖頁 | 公開 |
| `/card/:cardId` | 載入已儲存的圖卡（分享連結） | 公開 |
| `/:eventId` | 客製化 OEM 模板（`/api/events/{id}` 覆寫版面） | 公開 |
| `/login` | 登入頁 | 公開 |
| `/heartbeat` | 後端心跳燈號 | 公開 |
| `/admin` | 管理面板（模板清單/編輯器、使用者、密碼、審計日誌，`?tab=` 切換） | 需登入 |
| `/template-editor`、`/upload` | 舊路徑 → `Navigate` 至 `/admin?tab=templates` | — |

畫面外層以 `AuthProvider` 統一提供登入狀態給 NavBar 與受保護路由。

### 3.2 Components 層

- **CardMaker.jsx**：主畫面容器（12 欄 grid：左側設定、右側預覽）；透過
  `CardMakerProvider` 取得製圖狀態；由路由 `/card/:cardId` 進入時自動載入該卡。
- **CardPreview / ImageUpload / PreviewModal**：純展示與預覽、檔案輸入封裝、
  放大預覽＋ `canvas.toDataURL()` 下載。
- **templateEditor/**：模板編輯器系列元件（畫布、元素疊層、版面樹、屬性面板、工具列），
  以 `useTemplateDraft` 管理可覆寫版面（overWriteCanvas）的草稿。
- **admin/**：管理面板各 tab 內容。

### 3.3 Hooks / Services / Utils 層

#### useCardMaker.js（＋ CardMakerProvider）

核心責任：把「模板設定 + 使用者輸入 + 圖片 URL」轉為最終 Canvas 內容，並提供後端存取。

1. 模板驅動初始化：由 `CARD_TEMPLATES`（或 OEM 覆寫）建立模板與 `imageSlots`。
2. 狀態模型：`sharedFormData`（nickname/message/category）、`dayDetails`、
   `imageDatas`（各天圖片 URL）、`imageOffsets`、`dayCount`、`titleImageData`、`baseData`。
3. 圖片上傳：`handleImageUpload` 驗大小後呼叫 `api.uploadImage(file)` 換 URL 存入狀態。
4. 後端存取：`saveCard()` → `POST /api/cards`；`loadCard(id)` → `GET /api/cards/{id}`。
5. 渲染效能：快照去重、渲染鎖、底圖/標題圖快取、debounce。

#### services/api.js

- 所有請求使用相對路徑（`/api/...`、`/uploads/...`），本地由 Vite proxy、正式由
  Vercel rewrite 轉發，無需設定後端網址。
- 自動附加 `Authorization: Bearer <JWT>`；收到 401（且非 `/api/auth/*`）時，以
  httpOnly refresh cookie 換新 access token 後重試一次；並用 `isRefreshing`/`failedQueue`
  排隊併發請求，避免多次 refresh。refresh 失敗即清除 token 並跳轉 `/login`。
- `resolveAssetUrl()`：後端資源相對路徑、前端素材、完整網址均原樣使用。
- 提供 ping / saveCard / loadCard / uploadImage / getEventTemplates / saveEventTemplate /
  deleteEventTemplate / resolveAssetUrl。

#### services/auth.js

- 存取 token 存於 `localStorage`（key：`ccm_jwt`）、使用者資訊存 `ccm_user`。
- 提供 login / refreshAccessToken / logout / getMe / changePassword / listUsers /
  createUser / deleteUser / resetUserPassword / listAuditLogs。
- login 成功由 Set-Cookie 帶入 refresh cookie（`credentials: 'same-origin'`）。

### 3.4 Models 層

- **cardTemplates.js**：內建版型（canvas/upload/imageSlots/titleImage/textPositions）。
- **oemCardTemplates.js**：客製化模板 preset，含 `overWriteCanvas` 覆寫。

---

## 4. 後端架構

### 4.1 入口與中介層（main.py）

- `SecurityHeadersMiddleware`：回應加 `X-Content-Type-Options: nosniff`。
- `BodySizeLimitMiddleware`（A-009）：依 `Content-Length` 超過 `MAX_REQUEST_BYTES`（10MB）
  立即回 413。
- CORS：`ALLOWED_ORIGINS` 白名單、`allow_credentials=True`（讓前端攜帶 cookie），
  `allow_headers=["content-type", "authorization"]`。
- lifespan 啟動時呼叫 `ensure_initial_admin()`（首次啟動且 `ADMIN_PASSWORD != changeme`
  時建立初始 admin）。
- 自動建立 `data/`、`uploads/` 目錄；`/uploads` 以 StaticFiles 提供跨域存取。

### 4.2 core 層

- **config.py**：`Settings` 由環境變數 / `.env` 讀取（見 10.3）。JWT 相關：
  `JWT_SECRET`、`JWT_EXPIRY_MINUTES`（預設 30，`.env.example` 設 15）、`JWT_REFRESH_EXPIRY_DAYS`（預設 7）。
- **security.py**：`require_jwt_write` — 解析 `Authorization: Bearer <JWT>`、
  驗簽章、驗 `type == "access"`，回傳 payload（含 `sub`、`role`）。所有寫入端點皆以此保護。
- **file_validation.py**：`validate_image_content()` — 以 Pillow `Image.open().verify()`
  驗證真實內容（magic bytes），僅允許 PNG / JPEG；過小（<8 bytes）或非圖形檔回 415。

### 4.3 routers 層

| 檔案 | 端點 | 說明 |
|---|---|---|
| ping.py | `GET /api/ping` | 心跳（公開） |
| auth.py | `/api/auth/*` | 登入、refresh、logout、`/me`、使用者 CRUD（admin）、審計查詢（admin） |
| cards.py | `/api/cards` | 儲存/讀取圖卡 |
| events.py | `/api/events/*` | 活動模板 CRUD（含所有權） |
| uploads.py | `/api/uploads` | 圖片上傳 |

### 4.4 services 層

所有持久化服務共用同一套「`tempfile.mkstemp` 暫存 → `os.replace` 原子替換 +
`threading.Lock` 保護併發」的模式，並限制記錄數量避免無限成長。

- **storage.py**：`cards.json`，`save_card(payload, created_by)` 以 `uuid4().hex[:12]`
  為 ID。
- **users.py**：`users.json`，密碼以 bcrypt 雜湊儲存，提供 CRUD 與
  `ensure_initial_admin()`。
- **event_templates.py**：`event_templates.json`，依 `createdBy` 做可見性與
  所有權過濾。
- **audit.py**：`audit_log.json`（append-only、最多 10000 筆），事件常數：
  `login_success / login_failure / password_change / password_reset / user_create /
  user_delete / template_upsert / template_delete`，提供 `log_event()` 與 `get_logs()`。

---

## 5. 身分驗證與授權

### 5.1 Token 生命週期

- **Access token**（`type: access`）：JWT HS256，內含 `{sub, role, exp, iat}`，
  存活 `JWT_EXPIRY_MINUTES`（程式預設 30 分，`.env.example` 設 15）。前端存 `localStorage.ccm_jwt`，
  以 `Authorization: Bearer` 送出。
- **Refresh token**（`type: refresh`）：存活 `JWT_REFRESH_EXPIRY_DAYS`（預設 7 天），
  以 httpOnly cookie `refresh_token` 存放（`secure`, `samesite=strict`,
  `path=/api/auth`），前端 JS 不可讀。`POST /api/auth/refresh` 會輪換（rotate）。
- 登出由 `POST /api/auth/logout` 清除 cookie 與本地 token。

### 5.2 角色與權限

| 角色 | 能力 |
|---|---|
| admin | 使用者管理、審計查詢、可編輯/刪除任何活動模板 |
| user | 修改自身密碼、編輯自己的模板或舊（`createdBy` 為空）模板 |
| 未登入 | 公開讀取（卡片、模板、ping）、登入 |

寫入端點（卡片、上傳、事件模板 PUT/DELETE）一律經 `require_jwt_write`。

### 5.3 密碼策略（P-005）

- 至少 8 字元、含大寫、小寫、數字、特殊字元
- 不得為常見密碼黑名單、不得與使用者名稱相同

### 5.4 審計日誌

登入成功/失敗、密碼變更/重設、使用者建立/刪除、模板更新/刪除皆會記錄
（時間、事件、操作者、目標、IP、detail），僅 admin 可查詢。

---

## 6. Backend API 參考

Base URL：後端根路徑（本地 `http://localhost:8000`）。一律走 `api` 前綴。
身分標記：**公開**＝無需認證；**JWT**＝需 `Authorization: Bearer <access token>`；
**Admin**＝需 admin 角色。

### 6.1 端點總覽

| 方法 | 路徑 | 認證 | 用途 |
|---|---|---|---|
| POST | `/api/auth/login` | 公開 | 登入，Set-Cookie refresh token |
| POST | `/api/auth/refresh` | 公開（cookie） | 以 refresh token 換新 access token |
| POST | `/api/auth/logout` | 公開 | 清除 refresh cookie |
| GET | `/api/auth/me` | JWT | 目前使用者資訊 |
| POST | `/api/auth/change-password` | JWT | 修改自己的密碼 |
| GET | `/api/auth/users` | Admin | 列出使用者 |
| POST | `/api/auth/users` | Admin | 建立使用者 |
| DELETE | `/api/auth/users/{username}` | Admin | 刪除使用者 |
| PUT | `/api/auth/users/{username}/password` | Admin | 重設使用者密碼 |
| GET | `/api/auth/audit-logs` | Admin | 查詢審計日誌 |
| POST | `/api/cards` | JWT | 儲存圖卡 → `{id}` |
| GET | `/api/cards/{card_id}` | 公開 | 讀取圖卡 |
| GET | `/api/events` | 公開* | 列出活動模板（依身分過濾） |
| GET | `/api/events/list` | 公開* | 列出活動名稱 |
| GET | `/api/events/mine` | JWT | 我的模板（含共用模板） |
| GET | `/api/events/{event_id}` | 公開 | 讀取單一模板 |
| PUT | `/api/events/{event_id}` | JWT | 建立/覆寫模板（含所有權） |
| DELETE | `/api/events/{event_id}` | JWT | 刪除模板（僅擁有者/admin） |
| POST | `/api/uploads` | JWT | 上傳圖片（PNG/JPEG） |
| GET | `/api/ping` | 公開 | 心跳 |

> `GET /api/events` 的可見性：admin 看全部；登入 non-admin 看自己的＋共用模板；
> 匿名僅看共用（`createdBy` 為空）模板，無法列舉他人模板。

### 6.2 認證

#### POST /api/auth/login

- **認證**：公開
- **Request body**
  ```json
  { "username": "admin", "password": "changeme" }
  ```
- **Response 200**
  ```json
  {
    "token": "<access token>",
    "user": { "username": "admin", "role": "admin", "created_at": "..." }
  }
  ```
- 同時以 `Set-Cookie` 寫入 httpOnly `refresh_token`（path `/api/auth`）。
- 失敗：**401**（`Invalid credentials`），並記錄 `login_failure`。

#### POST /api/auth/refresh

- **認證**：公開，但需攜帶 `refresh_token` cookie
- **Response 200**：同上（`token` + `user`），並輪換 refresh cookie。
- 缺 cookie / 過期 / 型別錯誤：**401**。

#### POST /api/auth/logout

- **認證**：公開
- **Response 200**：`{ "success": true }`，並清除 refresh cookie。

#### GET /api/auth/me

- **認證**：JWT
- **Response 200**：`{ username, role, created_at }`。token 無效/過期：**401**。

#### POST /api/auth/change-password

- **認證**：JWT
- **Request body**：`{ "oldPassword": "...", "newPassword": "..." }`
- 需通過密碼策略（5.3）。舊密碼錯誤：**400**；違反策略：**400**（中文訊息）。
- 成功：`{ "success": true }`，並記錄 `password_change`。

### 6.3 使用者管理（Admin）

#### GET /api/auth/users

- **認證**：Admin　**Response 200**：`[{ username, role, created_at }]`（不含密碼雜湊）。

#### POST /api/auth/users

- **認證**：Admin
- **Request body**：`{ "username": "...", "password": "...", "role": "user" }`（role 僅 `user`/`admin`）
- **Response 201**：`{ username, role, created_at }`。重複帳號：**409**；密碼違反策略：**400**。

#### DELETE /api/auth/users/{username}

- **認證**：Admin　刪除他人帳號；不可刪除自己（**400**）；不存在：**404**。
- 成功：`{ "success": true }`。

#### PUT /api/auth/users/{username}/password

- **認證**：Admin　**Request body**：`{ "newPassword": "..." }`（須通過策略）。
- 不存在：**404**。

#### GET /api/auth/audit-logs?limit=100&event_type=&actor=

- **認證**：Admin　查詢參數；`limit` 最大 1000。回傳最新在前。

### 6.4 卡片

#### POST /api/cards

- **認證**：JWT
- **Request body**（僅以下欄位會被保留，其餘剝除）
  ```json
  {
    "dayCount": 1,
    "startDate": "2026-01-01",
    "overWriteCanvas": { "...": "版面快照" },
    "eventName": null
  }
  ```
- **Response 201**：`{ "id": "<12 位 hex>" }`
- 錯誤：超過 5MB **413**；非 JSON / 欄位型別錯誤 **400**。

#### GET /api/cards/{card_id}

- **認證**：公開；不存在 **404**。
- **Response 200**
  ```json
  {
    "id": "...",
    "eventName": null,
    "createdAt": "...",
    "updatedAt": "...",
    "createdBy": "username | 無",
    "payload": { "dayCount": 1, "startDate": "...", "overWriteCanvas": {}, "eventName": null }
  }
  ```

### 6.5 活動模板（Events）

模板結構（與 `frontend/src/models/oemCardTemplates.js` 一致）：

```json
{
  "dayCount": 1,
  "startDate": "2026-01-01",
  "overWriteCanvas": {
    "baseImagePath": "...",
    "fontColor": "#303030",
    "canvas": { "width": 1220, "height": 700, "downloadWidth": 1220, "downloadHeight": 700 },
    "upload": { "maxFileSizeBytes": 5242880 },
    "imageSlots": [],
    "titleImage": null,
    "textPositions": { "fontFamily": "..." },
    "categorySelection": null
  }
}
```

上傳欄位會自動補寫 `createdBy`（依 JWT 的 `sub`；admin 編輯他人模板時保留原擁有者）。

#### GET /api/events

- **認證**：公開／JWT（自動依身分過濾，見 6.1 註）
- **Response 200**：`{ "<eventId>": { dayCount, startDate, overWriteCanvas, createdBy } }`


#### GET /api/events/list

- **認證**：公開
- **Response 200**：`["<eventId>", "<eventId>", "<eventId>", ...]`

#### GET /api/events/mine

- **認證**：JWT；admin 回全部，其餘回自己的＋共用模板；未登入 **401**。

#### GET /api/events/{event_id}

- **認證**：公開；`event_id` 需符合 `[A-Za-z0-9_-]{1,64}`，否則 **422**；不存在 **404**。

#### PUT /api/events/{event_id}

- **認證**：JWT
- **Request body**：上述模板 JSON（頂層未知欄位會剝除，巢狀保留以相容新版前端）
- 所有權：non-admin 僅能改自己的或共用模板，否則 **403**。
- 錯誤：超過 512KB **413**；非 JSON **422**；event_id 非法 **422**。

#### DELETE /api/events/{event_id}

- **認證**：JWT　所有權規則同 PUT（**403**）；不存在 **404**；成功 **204**。

### 6.6 上傳

#### POST /api/uploads

- **認證**：JWT　multipart 欄位 `file`。
- 以 Pillow 驗證內容為 **PNG / JPEG**（其他或偽裝檔 **415**）；超過 5MB **413**。
- 檔名以 `uuid4().hex` 生成（不信任原始檔名）。
- **Response 200**：`{ "url": "/uploads/<uuid>.png" }`

### 6.7 系統

#### GET /api/ping

- **認證**：公開　**Response 200**：`{ status: "ok", uptime: <秒>, timestamp: "<ISO8601>" }`

### 6.8 錯誤碼與限制

| 狀態碼 | 情境 |
|---|---|
| 400 | 非 JSON、payload 非法、密碼策略違規、不可刪除自己 |
| 401 | 缺/錯/過期 token、refresh 失敗 |
| 403 | 非 admin 存取管理端點、不可編輯他人模板 |
| 404 | 卡片/模板/使用者不存在 |
| 409 | 帳號已存在 |
| 413 | 超過大小上限（卡片 5MB／模板 512KB／上傳 5MB／全域 10MB） |
| 415 | 上傳內容非圖形或非 PNG/JPEG |

---

## 7. 資料模型與持久化

後端以 `data/` 下的 JSON 檔案保存資料，全部採用「暫存檔 + `os.replace`」原子寫入。

| 檔案 | 內容 | 由誰寫入 |
|---|---|---|
| `cards.json` | `{ "<cardId>": { id, eventName, createdAt, updatedAt, createdBy?, payload } }` | `storage.py` |
| `users.json` | `{ "<username>": { username, password_hash, role, created_at } }` | `users.py` |
| `event_templates.json` | `{ "<eventId>": { dayCount, startDate, overWriteCanvas, createdBy } }` | `event_templates.py` |
| `audit_log.json` | `[ { timestamp, event, actor, target, detail, ip } ]`（最多 10000 筆） | `audit.py` |
| `uploads/` | 上傳圖片（uuid 檔名） | `uploads.py` |

---

## 8. 主要資料流

```text
【製圖】使用者操作 → CardMaker 表單事件 → useCardMaker 更新狀態
  → useEffect(debounce) → renderCanvas（快照去重 + 渲染鎖 + 快取）
  → Canvas 合成 → CardPreview 即時顯示 → PreviewModal toDataURL 下載

【上傳】選檔 → api.uploadImage(FormData) → POST /api/uploads（JWT）
  → 伺服器 Pillow 驗內容、5MB 上限、生成 uuid 檔名 → 回 /uploads/<uuid>.<ext>
  → URL 寫入 imageDatas / 底圖 → 觸發重繪

【儲存】儲存按鈕 → buildCardPayload() → POST /api/cards（JWT）
  → cards.json 原子寫入 → 回 { id } → 顯示分享連結 /card/:id

【載入】開啟 /card/:id 或輸入 ID → GET /api/cards/:id
  → applyCardPayload() → 還原天數/表單/圖片 URL/偏移 → 重繪

【OEM 模板】編輯器儲存 → PUT /api/events/{id}（JWT，寫入 createdBy）
  → 訪客開 /:eventId → GET /api/events/{id} → overWriteCanvas 覆寫版面

【登入】Login.jsx → POST /api/auth/login → 存 access token + Set-Cookie refresh
  → 之後每個請求自動帶 Authorization；401 時 POST /refresh 輪換後重試

【審計】安全相關事件 → audit.log_event() → audit_log.json（admin 查詢）
```

---

## 9. 開發流程

### 9.1 本機啟動（兩個終端）

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
cd frontend && npm install
```

### 9.2 日常指令

```bash
cd frontend
npm run lint
npx vitest run      # 全部前端測試
npm run build

cd backend
python -m pytest tests -v
```

### 9.3 典型開發步驟

```text
1) 調整模板（cardTemplates.js）或製圖 UI（CardMaker.jsx）
2) 若涉及卡片/模板保存欄位：同步 cardPayload.js / templateDraft.js
  與後端 cards.py / events.py 的 model 白名單
3) 先補/改兩端測試（vitest + pytest），再實作至綠燈
4) 啟動前後端驗證畫面、儲存/載入、登入與下載 PNG
5) lint + test + build 全數通過
```

---

## 10. 擴充指引

### 10.1 新增內建模板（例如 5p）

1. 在 `src/models/cardTemplates.js` 新增模板物件。
2. 新增對應底圖到 `public/img`。
3. 設定 `imageSlots`（d1...d5）與 `textPositions`。
4. 驗證 dayCount 切換、每日上傳、文字位置與下載結果。

### 10.2 新增活動模板欄位（需隨模板保存）

1. 在 `useTemplateDraft.js` / `ElementList` 等編輯器邏輯新增欄位。
2. 更新後端 `events.py` 的 `EventTemplatePayload` 對應 model（巢狀欄位採 `extra="allow"`，
   頂層採 `extra="ignore"` 剝除未知欄位）。
3. 補前端 `templateDraft.test.js` 與後端 `test_events.py`。

### 10.3 後端組態

| 環境變數 | 預設 | 說明 |
|---|---|---|
| JWT_SECRET | (空) | JWT 簽章密鑰（需自行設定，至少 32 bytes） |
| JWT_EXPIRY_MINUTES | 30（.env.example 設 15） | access token 存活分鐘 |
| JWT_REFRESH_EXPIRY_DAYS | 7 | refresh token 存活天數 |
| ALLOWED_ORIGINS | http://localhost:5173 | CORS 白名單（逗號分隔） |
| DATA_DIR | backend/data | JSON 資料位置 |
| UPLOADS_DIR | backend/uploads | 上傳圖片位置 |
| ADMIN_USERNAME / ADMIN_PASSWORD | admin / changeme | 初始 admin（`changeme` 不會建立） |