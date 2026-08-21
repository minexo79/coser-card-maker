# Anicon DIVA CardMaker

以 React + HTML5 Canvas 為核心的預定圖製作工具，採前後端分離架構：
使用者填入活動資訊、上傳多天圖片，即時預覽合成結果，可儲存至後端並透過連結分享，最後下載為 PNG。

## 專案結構（monorepo）

```text
ccm/
├── frontend/    # React + Vite 前端（原 CCM 專案）
├── backend/     # Python FastAPI 後端（卡片儲存、圖片上傳、heartbeat）
└── PLAN.md      # 重構計畫文件
```

## 快速開始

### 前端

```bash
cd frontend
npm install
cp .env.example .env   # 設定 VITE_API_BASE_URL
npm run dev            # http://localhost:5173
```

### 後端（Conda + Python 3.12）

```bash
cd backend
conda create -n ccm-backend python=3.12 -y
conda activate ccm-backend
pip install -r requirements.txt
cp .env.example .env   # 設定 API_TOKEN 與 ALLOWED_ORIGINS
uvicorn app.main:app --reload --port 8000
```

## 頁面路由

| 路由 | 說明 |
|---|---|
| `/` | 預設製圖頁 |
| `/:eventName` | 客製化 OEM 模板 |
| `/card/:cardId` | 載入已儲存的圖卡（分享連結） |
| `/heartbeat` | 後端伺服器心跳燈號 |

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

- 架構與流程詳解：`frontend/doc/architecture.md`
- 重構計畫：`PLAN.md`

## 參考

- [雲緣起活動網站前端 - YAF_web](https://github.com/YunlinAnimeFestival/YAF_web)
