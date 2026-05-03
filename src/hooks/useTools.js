// return YYYY-MM-DD format string for today, used as default date value in date input.
export const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse day keys (for example d1, d2, d10) into numeric indexes.
export const getDayIndexFromKey = (dayKey) => {
  const match = /^d(\d+)$/i.exec(dayKey || '');
  if (!match) return Number.POSITIVE_INFINITY;
  return Number.parseInt(match[1], 10);
};

export const getDayNumberFromKey = (dayKey) => {
  const match = /^d(\d+)$/i.exec(dayKey || '');
  if (!match) return '?';
  return match[1];
};
