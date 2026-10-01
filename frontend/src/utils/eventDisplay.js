// 活動名稱（顯示用）與活動代號（eventId，URL / API 用）的共用 helper。
// 後端讀取時已對舊資料補上 name，這裡仍保留 fallback 以防萬一。

export const EVENT_NAME_MAX_LENGTH = 100;

export function getEventDisplayName(event) {
  const name = typeof event?.name === 'string' ? event.name.trim() : '';
  return name || event?.id || '';
}

// 將 /api/events/list 的回應統一為 [{ id, name }]；相容舊版後端回傳的字串陣列。
export function normalizeEventList(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => (typeof item === 'string' ? { id: item, name: item } : item))
    .filter((item) => item && typeof item.id === 'string' && item.id)
    .map((item) => ({ id: item.id, name: getEventDisplayName(item) }));
}
