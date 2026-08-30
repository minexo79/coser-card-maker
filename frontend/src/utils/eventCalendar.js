// Pure helpers for the "this week's events" homepage.
// A week is defined as Monday 00:00 → next Monday 00:00 (Mon-first).

function parseDate(value) {
  if (!value) return null;
  // "YYYY-MM-DD" in local time (avoid UTC shifting issues)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Monday as the first day of the current week.
export function getWeekStart(now = new Date()) {
  const d = startOfDay(now);
  const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - day);
  return d;
}

export function getWeekEnd(now = new Date()) {
  return addDays(getWeekStart(now), 7); // exclusive
}

// Does the event's date range [start, start + dayCount - 1] overlap the week
// starting at weekStart? Handles cross-week / weekend events and past events.
export function isEventInWeek(event, weekStart) {
  if (!event) return false;
  const start = parseDate(event.startDate);
  if (!start) return false;

  const dayCount = Math.max(Number.parseInt(event.dayCount, 10) || 1, 1);
  const eventEnd = endOfDay(addDays(start, dayCount - 1));
  const weekStartDate = startOfDay(weekStart);
  const weekEndDate = addDays(weekStartDate, 7); // exclusive

  return start < weekEndDate && eventEnd >= weekStartDate;
}

export function filterThisWeek(events = [], now = new Date()) {
  const weekStart = getWeekStart(now);
  return events.filter((event) => isEventInWeek(event, weekStart));
}

// "MM/DD" or "MM/DD ～ MM/DD" for a single / multi-day event.
export function formatEventDateRange(event) {
  const start = parseDate(event?.startDate);
  if (!start) return '';
  const dayCount = Math.max(Number.parseInt(event?.dayCount, 10) || 1, 1);
  const pad = (n) => String(n).padStart(2, '0');
  const startStr = `${pad(start.getMonth() + 1)}/${pad(start.getDate())}`;
  if (dayCount <= 1) return startStr;
  const end = addDays(start, dayCount - 1);
  return `${startStr} ～ ${pad(end.getMonth() + 1)}/${pad(end.getDate())}`;
}
