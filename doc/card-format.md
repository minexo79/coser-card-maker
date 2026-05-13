# 預定圖格式說明

## Overview
以下為本平台 (Anicon DIVA CardMaker) 之活動預定圖定義方式，該方式是一套基於 JSON 的活動圖卡配置格式，用於定義：
* 畫布尺寸
* 底圖來源
* 圖片上傳限制
* 角色圖片區域
* 活動標題圖片
* 文字渲染位置
* 身分類別顯示
* 客製化視覺設定

此格式適合搭配以下系統使用：
* HTML Canvas
* 自訂圖片 / 第三方合成API

---

# 基本結構

## Root Schema

| 欄位                  | 型別                 | 必填  | 說明                |
| ------------------- | ------------------ | --- | ----------------- |
| `baseImagePath`     | `string`           | Yes | 底圖來源，可為網址或 Base64 |
| `canvas`            | `object`           | Yes | 畫布設定              |
| `upload`            | `object`           | Yes | 上傳限制              |
| `imageSlots`        | `array<ImageSlot>` | Yes | 角色圖片區域定義          |
| `titleImage`        | `object`           | No  | 活動標題圖片區域          |
| `textPositions`     | `object`           | Yes | 文字區域設定            |
| `fontColor`         | `string`           | No  | 全域文字顏色            |
| `categorySelection` | `object`           | No  | 身分類別圈選區域          |

---

# 底圖設定

## baseImagePath

定義卡片底圖來源。

### 型別

```ts
string
```

### 支援格式

* 本地路徑
* URL
* Base64 字串

### 範例

```json
{
  "baseImagePath": "./img/card_base_4p.png"
}
```

---

# 畫布設定

## canvas

定義畫布與輸出尺寸。

### Schema

| 欄位               | 型別       | 必填  | 說明     |
| ---------------- | -------- | --- | ------ |
| `width`          | `number` | Yes | 畫布寬度   |
| `height`         | `number` | Yes | 畫布高度   |
| `downloadWidth`  | `number` | Yes | 匯出圖片寬度 |
| `downloadHeight` | `number` | Yes | 匯出圖片高度 |

### 範例

```json
{
  "canvas": {
    "width": 1690,
    "height": 850,
    "downloadWidth": 1690,
    "downloadHeight": 850
  }
}
```

---

# 上傳限制

## upload

定義使用者圖片上傳限制。

### Schema

| 欄位                 | 型別       | 必填  | 說明            |
| ------------------ | -------- | --- | ------------- |
| `maxFileSizeBytes` | `number` | Yes | 最大檔案大小（Bytes） |

### 範例

```json
{
  "upload": {
    "maxFileSizeBytes": 5242880
  }
}
```

---

# 圖片區域設定

## imageSlots

定義角色圖片插槽。

每個插槽代表一個角色圖片區域。

---

## ImageSlot Schema

| 欄位         | 型別       | 必填  | 說明       |
| ---------- | -------- | --- | -------- |
| `key`      | `string` | Yes | 插槽唯一識別名稱 |
| `label`    | `string` | Yes | 顯示名稱     |
| `x`        | `number` | Yes | 左上角 X 座標 |
| `y`        | `number` | Yes | 左上角 Y 座標 |
| `width`    | `number` | Yes | 寬度       |
| `height`   | `number` | Yes | 高度       |
| `radius`   | `number` | No  | 圓角半徑     |
| `dateRole` | `object` | No  | 角色說明文字區域 |

---

## 座標系統

所有座標皆以左上角為原點。

```text
(0,0)
 ┌────────────────────────► X
 │
 │
 │
 ▼
 Y
```

---

## ImageSlot 範例

```json
{
  "key": "d1",
  "label": "第一天",
  "x": 32.5,
  "y": 300.8,
  "width": 380,
  "height": 456.7,
  "radius": 45
}
```

---

# 角色說明文字

## dateRole

用於顯示角色說明文字。

通常位於角色圖片下方。

### Schema

| 欄位         | 型別       | 必填  | 說明   |
| ---------- | -------- | --- | ---- |
| `fontSize` | `number` | Yes | 字體大小 |
| `x`        | `number` | Yes | X 座標 |
| `y`        | `number` | Yes | Y 座標 |
| `width`    | `number` | Yes | 區域寬度 |
| `height`   | `number` | Yes | 區域高度 |

### 範例

```json
{
  "dateRole": {
    "fontSize": 26,
    "x": 32.5,
    "y": 757.6,
    "width": 380,
    "height": 52.6
  }
}
```

---

# 活動標題圖片

## titleImage

定義活動 Logo / 標題圖片區域。

### Schema

| 欄位       | 型別       | 必填  | 說明   |
| -------- | -------- | --- | ---- |
| `x`      | `number` | Yes | X 座標 |
| `y`      | `number` | Yes | Y 座標 |
| `width`  | `number` | Yes | 寬度   |
| `height` | `number` | Yes | 高度   |

### 範例

```json
{
  "titleImage": {
    "x": 32.5,
    "y": 39.8,
    "width": 324.4,
    "height": 181.7
  }
}
```

---

# 文字區域設定

## textPositions

定義所有文字顯示位置。

---

## Schema

| 欄位           | 型別           | 必填  | 說明     |
| ------------ | ------------ | --- | ------ |
| `fontFamily` | `string`     | Yes | 字體設定   |
| `nickname`   | `TextRegion` | Yes | 暱稱區域   |
| `message`    | `TextRegion` | Yes | 留言區域   |
| `category`   | `TextRegion` | No  | 身分類別文字 |

---

# TextRegion 結構

適用於：

* `nickname`
* `message`
* `category`

---

## Schema

| 欄位           | 型別       | 必填  | 說明   |
| ------------ | -------- | --- | ---- |
| `fontSize`   | `number` | Yes | 字體大小 |
| `x`          | `number` | Yes | X 座標 |
| `y`          | `number` | Yes | Y 座標 |
| `width`      | `number` | Yes | 寬度   |
| `height`     | `number` | Yes | 高度   |
| `lineHeight` | `number` | No  | 行高   |

---

## 範例

```json
{
  "nickname": {
    "fontSize": 36,
    "x": 391.9,
    "y": 92.4,
    "width": 324.4,
    "height": 129.1
  }
}
```

---

# 身分類別圈選

## categorySelection

用於圈選式身分類別顯示。

此設定與：

```json
textPositions.category
```

二擇一使用。

---

## Schema

```json
{
  "categorySelection": {
    "COSER": {},
    "攝影": {},
    "路人": {}
  }
}
```

---

## CategoryRegion Schema

| 欄位       | 型別       | 必填  | 說明   |
| -------- | -------- | --- | ---- |
| `x`      | `number` | Yes | X 座標 |
| `y`      | `number` | Yes | Y 座標 |
| `width`  | `number` | Yes | 寬度   |
| `height` | `number` | Yes | 高度   |

---

## 範例

```json
{
  "categorySelection": {
    "COSER": {
      "x": 42.4,
      "y": 142.8,
      "width": 71.2,
      "height": 40.2
    },
    "攝影": {
      "x": 121.4,
      "y": 142.8,
      "width": 71.2,
      "height": 40.2
    },
    "路人": {
      "x": 188.4,
      "y": 142.8,
      "width": 71.2,
      "height": 40.2
    }
  }
}
```
---

# 客製化設定

## fontColor

設定全域文字顏色。

### 格式

```json
{
  "fontColor": "#000000"
}
```

### 支援格式

* HEX 色碼

---

---

# 完整範例

```json
{
  "baseImagePath": "./img/card_base_2p.jpg",

  "fontColor": "#000000",

  "canvas": {
    "width": 960,
    "height": 540,
    "downloadWidth": 960,
    "downloadHeight": 540
  },

  "upload": {
    "maxFileSizeBytes": 5242880
  },

  "imageSlots": [
    {
      "key": "d1",
      "label": "第一天",
      "x": 306.1,
      "y": 20.2,
      "width": 284.2,
      "height": 416.2,
      "radius": 45
    }
  ],

  "textPositions": {
    "fontFamily": "LINESeedTW, Arial, Helvetica, sans-serif",

    "nickname": {
      "fontSize": 30,
      "x": 102.8,
      "y": 213.5,
      "width": 165.9,
      "height": 51.2
    },

    "message": {
      "fontSize": 30,
      "x": 22.6,
      "y": 315.4,
      "width": 258.2,
      "height": 216.2,
      "lineHeight": 40
    }
  }
}
```
