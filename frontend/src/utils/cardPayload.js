// Serializable card payload helpers shared between the UI state and the backend API.
// Kept framework-free so they are trivial to unit test.

const cloneByDayKey = (obj) => {
  const out = {};
  Object.entries(obj || {}).forEach(([key, value]) => {
    out[key] = value && typeof value === 'object' ? { ...value } : value;
  });
  return out;
};

// Build the JSON body expected by POST /api/cards.
export function buildCardPayload({
  dayCount,
  eventName = null,
  sharedFormData,
  dayDetails,
  imageDatas,
  imageOffsets,
  titleImageData
}) {
  return {
    dayCount: dayCount ?? null,
    eventName: eventName ?? null,
    sharedFormData: { ...(sharedFormData || {}) },
    dayDetails: cloneByDayKey(dayDetails),
    imageDatas: cloneByDayKey(imageDatas),
    imageOffsets: cloneByDayKey(imageOffsets),
    titleImageData: titleImageData ?? null
  };
}

// Restore UI state fields from a stored payload. Throws on invalid input.
export function applyCardPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid card payload');
  }

  return {
    dayCount: payload.dayCount ?? null,
    eventName: payload.eventName ?? null,
    sharedFormData: { ...(payload.sharedFormData || {}) },
    dayDetails: cloneByDayKey(payload.dayDetails),
    imageDatas: cloneByDayKey(payload.imageDatas),
    imageOffsets: cloneByDayKey(payload.imageOffsets),
    titleImageData: payload.titleImageData ?? null
  };
}
