# Anicon DIVA CardMaker

以 React.JS + Python FastAPI 為網站架構的場次預定圖製作工具。採前後端分離架構：
使用者填入活動資訊、上傳多天圖片，網站會即時預覽合成結果，可儲存至後端並透過連結下載為 PNG。

## 專案結構（monorepo）

```text
ccm/
├── .kilo/skills     # 所有用到的技術的 Skill 文件
├── frontend/        # React + Vite 前端
├── backend/         # Python FastAPI 後端（MongoDB 儲存、R2/S3 圖片儲存、JWT 認證）
├── docs/            # architecture.md 等架構文件
└── README.md        # 專案說明
```

## 快速開始

### 前端

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### 後端（Conda + Python 3.12）

```bash
cd backend
conda create -n ccm-backend python=3.12 -y
conda activate ccm-backend
pip install -r requirements.txt
cp .env.example .env   # 設定 JWT_SECRET、MONGODB_URI、R2_* 等環境變數
uvicorn app.main:app --reload --port 8000
```

> - **MongoDB**：`MONGODB_URI` 有值時連真實 MongoDB；留空時以記憶體 mongomock 執行，
>   方便本機開發與測試。
> - **底圖儲存**：設有 `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` /
>   `R2_BUCKET_NAME` 時，上傳底圖寫入 Cloudflare R2（Amazon S3 相容，boto3）；
>   未設定時回退本機 `UPLOADS_DIR`。

## 頁面路由

| 路由 | 說明 |
|---|---|
| `/` | 首頁「本週場次」（列出本週有活動的場次） |
| `/make` | DIY 預定製作器（自訂版型） |
| `/make?id=xxx`、`/:eventId` | 客製化 OEM 模板 |
| `/card/:cardId` | 載入已儲存的圖卡（分享連結） |
| `/login` | 登入頁 |
| `/admin` | 管理面板（模板清單/編輯、密碼修改、後端狀態；admin 另有使用者、審計日誌、系統狀態） |

> `/template-editor`、`/upload` 為舊路徑，會導向 `/admin?tab=templates`。

## 測試與品質

```bash
# 前端（於 frontend/）
npm run lint
npx vitest run
npm run build

# 後端（於 backend/，需啟用 conda 環境）
python -m pytest tests -v
```

## 文件

- 架構與流程詳解：`docs/architecture.md`（含 `docs/architecture.md#6-backend-api-參考` 後端 API 參考）

## 參考

- [雲緣起活動網站前端 - YAF_web](https://github.com/YunlinAnimeFestival/YAF_web)

## 協議

本專案採用 [MIT License](./LICENSE) 授權
