# Anicon DIVA CardMaker
本專案是一個以 React + HTML5 Canvas 為核心的預定圖製作工具。
使用者可填入活動資訊、上傳多天圖片，右側即時預覽合成結果，最後下載為 PNG 圖片檔案。

## 主要功能

- [X] 多天數模板切換
- [X] 分別上傳圖片與調整水平偏移
- [X] 支援客製化預定底圖 (超連結方式)
- [ ] 後端存取

## 技術棧
- React + Vite
- Vitest

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
│   │   ├── CardMaker.jsx             # 主容器（表單 + 預覽）
│   │   ├── CardPreview.jsx           # Canvas 預覽展示
│   │   ├── ImageUpload.jsx           # 圖片上傳元件
│   │   ├── Copyright.jsx             # 版權聲明
│   │   └── PreviewModal.jsx          # 放大預覽與下載
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
    overWriteCanvas: {
        baseImagePath: "./img/aabbcc.png",
        // 畫布配置
        canvas: {
            width: 1700,
            height: 700,
            downloadWidth: 1700,
            downloadHeight: 700
        },
        // 圖片上傳限制
        upload: {
            maxFileSizeBytes: 5 * 1024 * 1024
        },
        // QR 碼配置
        qrCode: {
            size: 152,
            contentPadding: 10,
            backgroundPadding: 5
        },
        // 圖片槽定義（2p 有兩個）
        imageSlots: [
            {
                key: 'd1',
                label: '第一天',
                x: 393,
                y: 83.6,
                width: 439.5,
                height: 532.7,
                dateRole: {
                    fontSize: 26,
                    x: 390.3,
                    y: 616.4,
                    width: 439.5,
                    height: 52.6
                }
            },
            {
                key: 'd2',
                label: '第二天',
                x: 867.5,
                y: 83.6,
                width: 439.5,
                height: 532.7,
                dateRole: {
                    fontSize: 26,
                    x: 867.5,
                    y: 616.4,
                    width: 439.5,
                    height: 52.6
                }
            }
        ],
        titleImage: {
            fontSize: 36,
            x: 33.6,
            y: 31,
            width: 324.4,
            height: 204.5,
        },
        // 文字位置配置
        textPositions: {
            fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
            nickname: {
                fontSize: 36,
                x: 33.6,
                y: 323.2,
                width: 324.4,
                height: 129.1
            },
            category: {
                fontSize: 36,
                x: 33.6,
                y: 539.9,
                width: 324.4,
                height: 129.1
            },
            message: {
                fontSize: 30,
                x: 1342,
                y: 83.6,
                width: 324.4,
                height: 289.2,
                lineHeight: 42
            }
        }
    }
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

## 參考
- [雲緣起活動網站前端 - YAF_web](https://github.com/YunlinAnimeFestival/YAF_web)
