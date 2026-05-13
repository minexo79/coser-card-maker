# OEM 客製化覆寫

## Overview
系統支援 OEM / 活動客製化覆寫設定。

可在保留原始版型的情況下，針對：

* 字體
* 顏色
* 文字位置
* 圖片區域
* 畫布配置

進行局部覆寫。

最終 Render Config 會由：

```text
Base Layout + overWriteCanvas
```

合併產生。


---

# 活動資訊

## Event Metadata

| 欄位            | 型別       | 必填  | 說明              |
| ------------- | -------- | --- | --------------- |
| `displayName` | `string` | Yes | 活動名稱            |
| `dayCount`    | `number` | Yes | 活動天數            |
| `startDate`   | `string` | Yes | 活動開始日期（ISO8601） |

---

## displayName

活動顯示名稱。

### 範例

```json
{
  "displayName": "蜂格子 Cosplay 同樂會 Vol.1"
}
```

---

## dayCount

活動天數。

### 範例

```json
{
  "dayCount": 2
}
```

---

## startDate

活動開始日期。

### 格式

```text
YYYY-MM-DD
```

### 範例

```json
{
  "startDate": "2026-05-23"
}
```

---

# overWriteCanvas

用於覆蓋原始 BaseCard 配置 (參考[card-format.md](./card-format.md))。

此設定主要用於：

* OEM 客製化
* 特殊活動版型
* 白牌客戶
* 主題切換

---

## Override 規則

### Object

物件型別採用 Deep Merge。

例如：

```json
Base:
{
  "textPositions": {
    "nickname": {
      "fontSize": 30,
      "x": 100
    }
  }
}

Override:
{
  "textPositions": {
    "nickname": {
      "fontSize": 42
    }
  }
}
```

最終結果：

```json
{
  "textPositions": {
    "nickname": {
      "fontSize": 42,
      "x": 100
    }
  }
}
```

---

# OEM 覆蓋範例

```json
{
  "displayName": "黑貓感謝祭 Vol 114.5.14",
  "dayCount": 2,
  "startDate": "2025-05-14",
  "overWriteCanvas": {
    // 保持與card-format相同之格式
  }
}
```