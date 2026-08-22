# Card Template Format Skill

描述 Anicon DIVA CardMaker 中卡片模板的鍵名與含義，適用於所有天數模板（1p~4p）。

---

## 頂層鍵

| 鍵 | 類型 | 含義 |
|---|---|---|
| `baseImagePath` | `string` | 底圖相對路徑（`./img/card_base_Np.png`） |
| `canvas` | `object` | 畫布配置 |
| `upload` | `object` | 上傳限制 |
| `imageSlots` | `array` | 活動圖片槽定義（每個元素對應一天） |
| `titleImage` | `object` | 標題圖文位置配置 |
| `textPositions` | `object` | 文字位置配置 |
| `fontColor` | `string \| null` | 文字顏色覆蓋（hex 格式），優先於預設 `#303030` |
| `categorySelection` | `object \| null` | 圈選版身分配置，鍵為身分名稱，值為 `BoxConfig` |

---

## `canvas` 鍵

| 鍵 | 類型 | 含義 |
|---|---|---|
| `width` | `int` | 畫布寬度（px） |
| `height` | `int` | 畫布高度（px） |
| `downloadWidth` | `int` | 下載寬度（px） |
| `downloadHeight` | `int` | 下載高度（px） |

---

## `upload` 鍵

| 鍵 | 類型 | 含義 |
|---|---|---|
| `maxFileSizeBytes` | `int` | 單張圖片最大位元組數 |

---

## `imageSlots` 元素鍵

每個元素對應一天，結構如下：

| 鍵 | 類型 | 含義 |
|---|---|---|
| `key` | `string` | 唯一識別鍵（`d1`, `d2`, ...） |
| `label` | `string` | 顯示標籤（「第一天」「第二天」...） |
| `x` | `int \| float` | 圖片槽左上角 X 座標 |
| `y` | `int \| float` | 圖片槽左上角 Y 座標 |
| `width` | `int \| float` | 圖片槽寬度 |
| `height` | `int \| float` | 圖片槽高度 |
| `radius` | `int \| float \| null` | 圓角半徑（無圓角時為 null） |
| `dateRole` | `DateRoleConfig \| null` | 出角日期/角色文字配置 |

---

## `dateRole` 鍵

| 鍵 | 類型 | 含義 |
|---|---|---|
| `fontSize` | `int` | 字型大小 |
| `x` | `int \| float` | 左上角 X 座標 |
| `y` | `int \| float` | 左上角 Y 座標 |
| `width` | `int \| float` | 寬度 |
| `height` | `int \| float` | 高度 |

---

## `titleImage` 鍵

| 鍵 | 類型 | 含義 |
|---|---|---|
| `fontSize` | `int` | 字型大小 |
| `x` | `int \| float` | 左上角 X 座標 |
| `y` | `int \| float` | 左上角 Y 座標 |
| `width` | `int \| float` | 寬度 |
| `height` | `int \| float` | 高度 |

---

## `textPositions` 鍵

| 鍵 | 類型 | 含義 |
|---|---|---|
| `fontFamily` | `string` | 字型族 |
| `nickname` | `BoxConfig` | 暱稱文字區域 |
| `category` | `BoxConfig \| null` | 身分文字區域（可能為 null） |
| `message` | `BoxConfig` | 留言文字區域 |

---

## `BoxConfig` 鍵

| 鍵 | 類型 | 含義 |
|---|---|---|
| `x` | `int \| float` | 左上角 X 座標 |
| `y` | `int \| float` | 左上角 Y 座標 |
| `width` | `int \| float` | 寬度 |
| `height` | `int \| float` | 高度 |
| `fontSize` | `int \| null` | 字型大小 |
| `lineHeight` | `int \| null` | 行高（僅 `message` 使用） |

---

## 圖片合成規則

1. **底圖**：優先使用使用者上傳的活動底圖（`baseImageData`）；若無，則使用模板內建的 `baseImagePath`。上傳底圖以等比 cover 方式鋪滿畫布；模板底圖依原尺寸拉伸繪製。
2. **活動圖片**：按 `imageSlots` 順序繪製，每張圖片根據對應的 `imageSlot` 區域進行 cover 裁切 + clip（圓角或矩形）。圖片寬高比大於槽區域時高度填满、水平居中並根據 `imageOffsets[dayKey]` 偏移；否則寬度填满、垂直居中。
3. **離屏圖層**：所有活動圖片先繪製到隱藏的離屏 canvas（`imageLayerRef`），再整合到主 canvas。
4. **文字層**：在所有圖片之上繪製文字（暱稱、身分、留言、出角資訊）。
5. **標題圖**：在底圖上繪製，位置由 `titleImage` 定義，使用等比置中。

---

## 出角資訊格式

出角文字位於每個 `imageSlot` 的 `dateRole` 區域內，格式為 `<日期> <角色名稱>`。

- 日期格式：`MM-DD`（從 `dayDetails[dayKey].date` 轉換）
- 角色名稱：從 `dayDetails[dayKey].cosrole` 取得
- 若日期和角色名稱均為空則不顯示；若只有日期則只顯示日期；若只有角色名稱則只顯示角色名稱