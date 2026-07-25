export function getCurrentDateInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

export function getCurrentDayNumber(
  startDate: string,
  timezone: string,
  durationDays: number
): number {
  const currentDateStr = getCurrentDateInTimezone(timezone);
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const current = new Date(`${currentDateStr}T00:00:00.000Z`);

  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const currentDay = diffDays + 1;

  return Math.max(0, Math.min(currentDay, durationDays));
}

export function isDayAccessible(
  dayNumber: number,
  currentDayNumber: number
): boolean {
  return dayNumber >= 1 && dayNumber <= currentDayNumber;
}
