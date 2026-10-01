// Serializable card payload helpers shared between the UI state and the backend API.
// Kept framework-free so they are trivial to unit test.
//
// Payload shape mirrors oemCardTemplates.js event entries — each card stores only its
// own layout snapshot: { dayCount, startDate, overWriteCanvas, eventId }.
// eventId is the event slug; the backend adds an eventName snapshot (display name) on save.
// User-generated content (form data / image URLs) is intentionally not persisted.

const cloneJsonOrNull = (value) => {
  if (!value || typeof value !== 'object') return null;
  return JSON.parse(JSON.stringify(value));
};

// Build the JSON body expected by POST /api/cards.
export function buildCardPayload({
  dayCount,
  eventId = null,
  dayDetails,
  overWriteCanvas
}) {
  return {
    dayCount: dayCount ?? null,
    // 對齊 oemCardTemplates.js：起始日期取自 d1（未填寫時為空字串）
    startDate: dayDetails?.d1?.date ?? '',
    overWriteCanvas: cloneJsonOrNull(overWriteCanvas),
    eventId: eventId ?? null
  };
}

// Restore UI state fields from a stored payload. Throws on invalid input.
export function applyCardPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid card payload');
  }

  return {
    dayCount: payload.dayCount ?? null,
    startDate: payload.startDate ?? '',
    overWriteCanvas: cloneJsonOrNull(payload.overWriteCanvas),
    // 舊卡片沒有 eventId，當時把活動代號存在 eventName
    eventId: payload.eventId ?? payload.eventName ?? null,
    eventName: payload.eventName ?? null
  };
}
