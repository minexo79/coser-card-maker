# 專案架構與開發流程說明

## 1. 專案概覽

Anicon DIVA CardMaker 是一個以 React + HTML5 Canvas 為核心的預訂圖製作工具。
使用者在表單填入活動資訊、設定天數、上傳每日圖片，即時預覽合成後的卡片，最後下載 PNG。
可將圖卡儲存至後端並透過 `/card/:id` 連結分享。

系統採「前後端分離」部署：

- **frontend/**：React SPA，負責表單、Canvas 合成、預覽與下載（部署於 Vercel）
- **backend/**：Python FastAPI，負責卡片／活動模板 JSON 儲存、圖片上傳（R2/S3）、
  JWT 身分驗證與審計日誌（自架主機）

除了製圖之外，後續加入：

- **登入/登出與使用者管理**：JWT 存取權杖 + httpOnly refresh cookie、角色權限（admin / user）
- **管理面板**（`/admin`）：模板清單、模板編輯器、使用者管理、密碼修改、審計日誌、
  後端運行狀態、系統狀態
- **客製化 OEM 模板**：以 `/api/events/{id}` 儲存之版面（含 `createdBy` 所有權），
  前端以 `/:eventId` 或 `/make?id=xxx` 載入並覆寫預設版面
- **首頁「本週場次」**：`/` 顯示本週有活動的場次卡片，點擊直接進入該活動製圖
- **全域錯誤處理**：前端以彈窗顯示統一代碼（E001~E006）

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
| 後端資料庫 | MongoDB（pymongo；本機/測試以 mongomock 回退） |
| 後端物件儲存 | Cloudflare R2 / S3（boto3；無憑證時回退本機磁碟） |
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
│       ├── versions.js                 # FRONTEND_VERSION / NODE_VERSION（系統狀態表）
│       ├── components/
│       │   ├── CardMaker.jsx           # 製圖主頁（表單 + 預覽 + 儲存/載入）
│       │   ├── CardPreview.jsx         # Canvas 預覽展示
│       │   ├── ImageUpload.jsx         # 圖片上傳元件
│       │   ├── PreviewModal.jsx        # 放大預覽與下載
│       │   ├── Login.jsx               # 登入頁
│       │   ├── NavBar.jsx              # 頂部導覽列（含活動下拉）
│       │   ├── ProtectedRoute.jsx      # 需登入的受保護路由
│       │   ├── HomePage.jsx            # 首頁「本週場次」
│       │   ├── Copyright.jsx           # 全站版權聲明
│       │   ├── ErrorBoundary.jsx       # React error boundary（發布 E004）
│       │   ├── admin/
│       │   │   ├── AdminDashboard.jsx  # 管理面板（tab 容器）
│       │   │   ├── UserManagement.jsx  # 使用者管理（admin）
│       │   │   ├── ChangePassword.jsx  # 密碼修改
│       │   │   ├── AuditLogList.jsx    # 審計日誌（admin）
│       │   │   ├── BackendStatus.jsx   # 後端運行狀態（所有使用者）
│       │   │   └── SystemStatus.jsx    # 系統狀態（admin）
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
│       │   ├── CardMakerProvider.jsx / cardMakerContext.js / useCardMakerContext.js
│       │   └── ErrorProvider.jsx / ErrorContext.js / useError.js # 全域錯誤彈窗
│       ├── hooks/
│       │   ├── useCardMaker.js           # 核心製圖狀態 + Canvas 繪製 + 後端存取
│       │   ├── useImageLayerRenderer.js  # 角色圖片離屏圖層繪製
│       │   └── useTools.js               # 共用工具
│       ├── services/
│       │   ├── api.js                    # 一般 API client（JWT + 401 自動 refresh）
│       │   ├── auth.js                   # 認證 API（login/refresh/logout/audit/system…）
│       │   └── errorBus.js               # 全域錯誤匯流排（發布錯誤事件）
│       ├── utils/
│       │   ├── cardPayload.js            # 卡片 payload 序列化純函式
│       │   ├── templateDraft.js          # 模板草稿純函式（建草稿/展平元素）
│       │   ├── geometry.js               # 幾何運算
│       │   ├── clipboard.js              # 剪貼簿複製
│       │   ├── errorCodes.js             # 全域錯誤代碼對照表（E001~E006）
│       │   └── eventCalendar.js          # 本週場次篩選/日期格式化純函式
│       ├── models/
│       │   └── cardTemplates.js          # 1p~4p 內建模板設定
│       └── __tests__/                    # vitest 測試
├── backend/
│   ├── app/
│   │   ├── main.py                       # FastAPI 入口 + 中介層 + CORS
│   │   ├── core/
│   │   │   ├── config.py                 # Settings（環境變數 / .env）
│   │   │   ├── security.py               # JWT 驗證相依（require_jwt_write）
│   │   │   ├── file_validation.py        # 上傳圖片內容驗證（Pillow magic bytes）
│   │   │   └── db.py                     # MongoDB 連線（空 URI 回退 mongomock）
│   │   ├── routers/
│   │   │   ├── ping.py                   # GET /api/ping
│   │   │   ├── auth.py                   # 登入/refresh/使用者管理/審計查詢
│   │   │   ├── cards.py                  # POST /api/cards、GET /api/cards/{id}
│   │   │   ├── events.py                 # 活動模板 CRUD + 所有權
│   │   │   ├── uploads.py                # POST /api/uploads、GET /uploads/{key} 代理
│   │   │   └── system.py                 # GET /api/admin/system-status（admin）
│   │   └── services/
│   │       ├── storage.py                # 卡片（MongoDB collection: cards）
│   │       ├── users.py                  # 使用者（MongoDB + bcrypt）
│   │       ├── event_templates.py        # 活動模板（MongoDB collection）
│   │       ├── audit.py                  # 審計日誌（MongoDB collection）
│   │       └── object_storage.py         # R2/S3 物件儲存（回退本機磁碟）
│   ├── tests/                            # pytest 測試
│   ├── requirements.txt
│   ├── .env.example                      # JWT/MongoDB/R2 等環境變數範例
│   ├── data/                             # DATA_DIR（執行期生成）
│   └── uploads/                          # 本機回退用上傳目錄（執行期生成）
├── README.md
├── PLAN.md
└── docs/architecture.md                  # 本文件
```

---

## 3. 前端架構

### 3.1 頁面與路由（App.jsx）

| 路由 | 說明 | 權限 |
|---|---|---|
| `/` | 首頁「本週場次」（HomePage） | 公開 |
| `/make` | DIY 預訂製作器（自訂版型，CardMakerProvider） | 公開 |
| `/make?id=xxx` | OEM 預訂頁（`eventName = id`，覆寫版面） | 公開 |
| `/:eventId` | 客製化 OEM 模板（`/api/events/{id}` 覆寫版面） | 公開 |
| `/card/:cardId` | 載入已儲存的圖卡（分享連結） | 公開 |
| `/login` | 登入頁 | 公開 |
| `/admin` | 管理面板（`?tab=` 切換，見 3.2） | 需登入 |
| `/template-editor`、`/upload` | 舊路徑 → `Navigate` 至 `/admin?tab=templates` | — |

路由巢狀：`ErrorProvider` > `ErrorBoundary` > `BrowserRouter` > `AuthProvider`；`/make` 與
`/card/:cardId` 共用 `DiyLayout`（`CardMakerProvider`），`/:eventId` 用 `OemLayout`
（以 `eventName` 帶入）。`Copyright` 在全站最外層顯示。

### 3.2 管理面板（AdminDashboard.jsx，`?tab=` 切換）

| tab | 內容 | 可見 |
|---|---|---|
| `list` | 模板清單（TemplateListPage） | 所有登入使用者 |
| `templates` | 模板編輯器（TemplateEditor） | 所有登入使用者 |
| `password` | 密碼修改（ChangePassword） | 所有登入使用者 |
| `status` | 後端狀態（BackendStatus，每 5 秒 ping） | 所有登入使用者 |
| `users` | 使用者管理（UserManagement） | admin |
| `audit` | 審計日誌（AuditLogList） | admin |
| `system` | 系統狀態（SystemStatus） | admin |

### 3.3 Components 層

- **CardMaker.jsx**：主畫面容器（12 欄 grid：左側設定、右側預覽）；依路由取得的
  `eventName`（`params.eventName || params.eventId || ?id=`）決定載入哪個活動模板。
- **CardPreview / ImageUpload / PreviewModal**：純展示與預覽、檔案輸入封裝、
  放大預覽＋ `canvas.toDataURL()` 下載。
- **templateEditor/**：模板編輯器系列元件，以 `useTemplateDraft` 管理可覆寫版面
  （overWriteCanvas）的草稿。
- **admin/**：管理面板各 tab 內容（見 3.2）。
- **HomePage.jsx**：使用 `eventCalendar.js` 篩選本週場次，顯示卡片縮圖與日期範圍，
  點擊「製作預訂」進入該活動。
- **ErrorBoundary.jsx / ErrorProvider.jsx**：渲染錯誤發布 E004；API 層錯誤透過
  `errorBus` 發布，以彈窗顯示「代碼：說明」。

### 3.4 Hooks / Services / Utils 層

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
  Vercel rewrite 轉發，無需設定後端網址（`vite.config.js` proxy：`/api`、`/uploads`）。
- 自動附加 `Authorization: Bearer <JWT>`；收到 401（且非 `/api/auth/*`）時，以
  httpOnly refresh cookie 換新 access token 後重試一次；並用 `isRefreshing`/`failedQueue`
  排隊併發請求，避免多次 refresh。refresh 失敗即清除 token 並跳轉 `/login`。
- 網路錯誤標記 `isNetworkError`；非 2xx 統一解析 `.detail`。除 `{ silent: true }`
  外皆發布到 `errorBus` 觸發全域錯誤彈窗。
- `resolveAssetUrl()`：後端資源相對路徑、前端素材、完整網址均原樣使用。
- 提供 ping / saveCard / loadCard / uploadImage / getEventTemplates / getEventList /
  getEventTemplate / saveEventTemplate / deleteEventTemplate / resolveAssetUrl。

#### services/auth.js

- 存取 token 存於 `localStorage`（key：`ccm_jwt`）、使用者資訊存 `ccm_user`。
- 提供 login / refreshAccessToken / logout / getMe / changePassword / listUsers /
  createUser / deleteUser / resetUserPassword / listAuditLogs / getSystemStatus。
- `getSystemStatus` 帶 `X-Frontend-Version` / `X-Node-Version` header（取自 versions.js，
  `__NODE_VERSION__` 由 Vite 於建置時注入）。
- login 成功由 Set-Cookie 帶入 refresh cookie（`credentials: 'same-origin'`）。

#### services/errorBus.js + utils/errorCodes.js

統一代碼 E001~E006：

| 代碼 | 說明 | 觸發 |
|---|---|---|
| E001 | 後端連線失敗 | `isNetworkError` |
| E002 | 資料庫連線失敗 | detail 含 mongodb/database/資料庫 |
| E003 | 儲存空間連線失敗 | detail 含 storage/upload/儲存 |
| E004 | 前端運行錯誤 | ErrorBoundary |
| E005 | 後端運行錯誤 | 一般非 2xx |
| E006 | 未知錯誤 | 預設 |

### 3.5 Models 層

- **cardTemplates.js**：內建版型（canvas/upload/imageSlots/titleImage/textPositions）。

---

## 4. 後端架構

### 4.1 入口與中介層（main.py）

- `SecurityHeadersMiddleware`：回應加 `X-Content-Type-Options: nosniff`。
- `BodySizeLimitMiddleware`（A-009）：依 `Content-Length` 超過 `MAX_REQUEST_BYTES`（10MB）
  立即回 413。
- CORS：`ALLOWED_ORIGINS` 白名單、`allow_credentials=True`（讓前端攜帶 cookie）、
  `allow_headers=["content-type", "authorization"]`。
- lifespan 啟動時呼叫 `ensure_initial_admin()`（首次啟動且 `ADMIN_PASSWORD != changeme`
  時建立初始 admin，建於 MongoDB）。
- 僅在回退本機儲存時才建立目錄：未設定 MongoDB（用 mongomock）才建立 `DATA_DIR`；
  未設定 R2/S3（用本機磁碟）才建立 `UPLOADS_DIR`。R2 與 MongoDB 皆設定時不建立本機目錄。
- 掛載路由：ping / cards / events / uploads（+ `uploads.files_router`）/ auth / system。

### 4.2 core 層

- **config.py**：`Settings` 由環境變數 / `.env` 讀取（見 10.3）。
- **security.py**：`require_jwt_write` — 解析 `Authorization: Bearer <JWT>`、
  驗簽章、驗 `type == "access"`，回傳 payload（含 `sub`、`role`）。所有寫入端點皆以此保護。
- **file_validation.py**：`validate_image_content()` — 以 Pillow `Image.open().verify()`
  驗證真實內容（magic bytes），僅允許 PNG / JPEG；過小（<8 bytes）或非圖形檔回 415。
- **db.py**：`MONGODB_URI` 有值時連真實 MongoDB；空時回退記憶體 mongomock。
  提供 `get_db()`、`get_collection(name)`、`strip_id()`。

### 4.3 routers 層

| 檔案 | 端點 | 說明 |
|---|---|---|
| ping.py | `GET /api/ping` | 心跳（公開） |
| auth.py | `/api/auth/*` | 登入、refresh、logout、`/me`、使用者 CRUD（admin）、審計查詢（admin） |
| cards.py | `/api/cards` | 儲存/讀取圖卡 |
| events.py | `/api/events/*` | 活動模板 CRUD（含所有權）、`/list`、`/mine` |
| uploads.py | `POST /api/uploads`、`GET /uploads/{key}` | 上傳＋代理取回 |
| system.py | `GET /api/admin/system-status` | 系統狀態（admin） |

### 4.4 services 層

所有持久化服務以 MongoDB collection 儲存：`strip_id` 卸除 `_id` 後回傳。

- **storage.py**：`cards`，`save_card(payload, created_by)` 以 `uuid4().hex[:12]` 為 ID。
- **users.py**：`users`，密碼以 bcrypt 雜湊儲存，提供 CRUD 與 `ensure_initial_admin()`。
- **event_templates.py**：`event_templates`，依 `createdBy` 做可見性與所有權過濾。
- **audit.py**：`audit_log`（append-only、最多 10000 筆），事件常數：
  `login_success / login_failure / password_change / password_reset / user_create /
  user_delete / template_upsert / template_delete`，提供 `log_event()` 與 `get_logs()`。
- **object_storage.py**：底圖物件儲存。設有 R2/S3 憑證時以 boto3（S3 相容 endpoint）
  上傳/取回；否則回退本機 `UPLOADS_DIR`。提供 `save_object(key, data)`、
  `get_object(key)`、`is_valid_key()`、`content_type_for()`、`is_r2_configured()`。

---

## 5. 身分驗證與授權

### 5.1 Token 生命週期

- **Access token**（`type: access`）：JWT HS256，內含 `{sub, role, exp, iat}`，
  存活 `JWT_EXPIRY_MINUTES`。前端存 `localStorage.ccm_jwt`，以 `Authorization: Bearer` 送出。
- **Refresh token**（`type: refresh`）：存活 `JWT_REFRESH_EXPIRY_DAYS`（預設 7 天），
  以 httpOnly cookie `refresh_token` 存放（`secure`, `samesite=strict`,
  `path=/api/auth`），前端 JS 不可讀。`POST /api/auth/refresh` 會輪換（rotate）。
- 登出由 `POST /api/auth/logout` 清除 cookie 與本地 token。

### 5.2 角色與權限

| 角色 | 能力 |
|---|---|
| admin | 使用者管理、審計查詢、系統狀態、可編輯/刪除任何活動模板 |
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
| GET | `/api/events/list` | 公開* | 列出活動名稱（NavBar 下拉用） |
| GET | `/api/events/mine` | JWT | 我的模板（含共用模板） |
| GET | `/api/events/{event_id}` | 公開 | 讀取單一模板 |
| PUT | `/api/events/{event_id}` | JWT | 建立/覆寫模板（含所有權） |
| DELETE | `/api/events/{event_id}` | JWT | 刪除模板（僅擁有者/admin） |
| POST | `/api/uploads` | JWT | 上傳圖片（PNG/JPEG）→ `{url}` |
| GET | `/uploads/{key}` | 公開 | 代理取回已上傳的底圖 |
| GET | `/api/admin/system-status` | Admin | 系統狀態（版本/環境變數） |
| GET | `/api/ping` | 公開 | 心跳 |

> `GET /api/events` 的可見性：admin 看全部；登入 non-admin 看自己的＋共用模板；
> 匿名僅看共用（`createdBy` 為空）模板，無法列舉他人模板。`/api/events/list`
> 回傳 `["<eventId>", ...]`，僅供 NavBar 下拉與首頁使用。

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

模板結構（與前端 overWriteCanvas 一致）：

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

### 6.6 上傳與取回

#### POST /api/uploads

- **認證**：JWT　multipart 欄位 `file`。
- 以 Pillow 驗證內容為 **PNG / JPEG**（其他或偽裝檔 **415**）；超過 5MB **413**。
- 檔名以 `uuid4().hex` 生成（不信任原始檔名）。
- 寫入 R2/S3（未設定憑證時寫入本機 `UPLOADS_DIR`）。
- **Response 200**
  ```json
  { "url": "/uploads/<uuid>.png" }
  ```

#### GET /uploads/{key}

- **認證**：公開
- 伺服器端依 key 從 R2/S3（或本機磁碟）取回，回傳對應 `Content-Type`。
- key 需符合 `[0-9a-f]{32}\.(png|jpe?g)`（防路徑穿越），否則 **404**；不存在 **404**。
- 前端以相對路徑 `/uploads/...` 儲存於 `baseImagePath`，由 Vite proxy / Vercel rewrite 轉發至此。

### 6.7 系統

#### GET /api/admin/system-status

- **認證**：Admin
- 由前端帶 `X-Frontend-Version` / `X-Node-Version` header 回報；後端回版本與 Python/Node 版本。
- **Response 200**：`{ frontendVersion, backendVersion, frontendNodeVersion, backendPythonVersion, environment }`。
- `environment` 為安全子集：Mongo URI 以遮罩密碼形式回傳（`user:****@`），R2 憑證欄位
  會回傳設定值（若未設定則為空字串）；永不暴露 `JWT_SECRET` / `ADMIN_PASSWORD` 原始值。

#### GET /api/ping

- **認證**：公開　**Response 200**：`{ status: "ok", uptime: <秒>, timestamp: "<ISO8601>" }`

### 6.8 錯誤碼與限制

| 狀態碼 | 情境 |
|---|---|
| 400 | 非 JSON、payload 非法、密碼策略違規、不可刪除自己 |
| 401 | 缺/錯/過期 token、refresh 失敗 |
| 403 | 非 admin 存取管理端點、不可編輯他人模板 |
| 404 | 卡片/模板/使用者/上傳物件不存在 |
| 409 | 帳號已存在 |
| 413 | 超過大小上限（卡片 5MB／模板 512KB／上傳 5MB／全域 10MB） |
| 415 | 上傳內容非圖形或非 PNG/JPEG |
| 422 | event_id 非法、模板 JSON 非法 |

---

## 7. 資料模型與持久化

後端以 MongoDB 儲存（`MONGODB_URI` 空時回退記憶體 mongomock）。Collection：

| Collection | 內容 | 由誰寫入 | `_id` |
|---|---|---|---|
| `users` | 使用者帳號（bcrypt 密碼雜湊） | `users.py` | username |
| `cards` | 圖卡（id/eventName/createdAt/updatedAt/payload） | `storage.py` | card id |
| `event_templates` | 活動模板（dayCount/startDate/overWriteCanvas/createdBy） | `event_templates.py` | event id |
| `audit_log` | 審計事件（append-only，最多 10000 筆） | `audit.py` | 自動 |

底圖物件（非 DB）以 R2/S3 儲存，無憑證時回退本機 `UPLOADS_DIR`。

---

## 8. 主要資料流

```text
【製圖】使用者操作 → CardMaker 表單事件 → useCardMaker 更新狀態
  → useEffect(debounce) → renderCanvas（快照去重 + 渲染鎖 + 快取）
  → Canvas 合成 → CardPreview 即時顯示 → PreviewModal toDataURL 下載

【上傳】選檔 → api.uploadImage(FormData) → POST /api/uploads（JWT）
  → 伺服器 Pillow 驗內容、5MB 上限、生成 uuid 檔名 → 寫入 R2/S3（或本機磁碟）
  → 回 /uploads/<uuid>.<ext> → URL 寫入 imageDatas / 底圖 → 觸發重繪
  → 前端需要圖時 GET /uploads/<key> → 後端代理由 R2/S3 取回

【儲存】儲存按鈕 → buildCardPayload() → POST /api/cards（JWT）
  → MongoDB cards collection 寫入 → 回 { id } → 顯示分享連結 /card/:id

【載入】開啟 /card/:id 或輸入 ID → GET /api/cards/:id
  → applyCardPayload() → 還原天數/表單/圖片 URL/偏移 → 重繪

【OEM 模板】編輯器儲存 → PUT /api/events/{id}（JWT，寫入 createdBy）
  → 訪客開 /:eventId 或 /make?id=x → GET /api/events/{id} → overWriteCanvas 覆寫版面

【首頁場次】進入 / → GET /api/events → eventCalendar.filterThisWeek 篩本週
  → 顯示場次卡片 → 點擊進入 /:eventId 製圖

【登入】Login.jsx → POST /api/auth/login → 存 access token + Set-Cookie refresh
  → 之後每個請求自動帶 Authorization；401 時 POST /refresh 輪換後重試

【審計】安全相關事件 → audit.log_event() → MongoDB audit_log（admin 查詢）

【錯誤】api.js/auth.js/ErrorBoundary 捕捉 → errorBus.emitError → ErrorProvider
  → 依 detectErrorCode 映射 E001~E006 → 彈窗顯示 【代碼：說明】＋詳細訊息
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
| DATA_DIR | backend/data | 執行期資料目錄 |
| UPLOADS_DIR | backend/uploads | 本機回退用底圖目錄 |
| MONGODB_URI | (空) | MongoDB 連線字串；空時回退 mongomock |
| MONGODB_DB_NAME | ccm | MongoDB 資料庫名稱 |
| ADMIN_USERNAME / ADMIN_PASSWORD | admin / changeme | 初始 admin（`changeme` 不會建立） |
| R2_ACCOUNT_ID | (空) | R2 帳戶 ID（推導 S3 endpoint） |
| R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY | (空) | R2 S3 API 憑證 |
| R2_BUCKET_NAME | (空) | R2 Bucket 名稱 |
| R2_REGION | auto | Region（R2 用 auto） |
| R2_ENDPOINT_URL | (空) | 自訂 S3 endpoint；空時依 R2_ACCOUNT_ID 推導 |

> R2/S3 底圖儲存：`R2_ACCOUNT_ID`＋`R2_ACCESS_KEY_ID`＋`R2_SECRET_ACCESS_KEY`＋
> `R2_BUCKET_NAME` 皆設時啟用；否則（含本機開發/測試）一律回退本機 `UPLOADS_DIR`，
> 介面與流程不變。
