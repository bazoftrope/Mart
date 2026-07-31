import { addDays, parseISO, format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

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

/**
 * Build a UTC timestamp for a pulse reading.
 * The date part is fixed to the report day (stream start date + dayNumber - 1),
 * the time part is taken from `measuredAt` and interpreted in the user's timezone.
 */
export function buildMeasuredAtUtc(
  startDate: string,
  dayNumber: number,
  measuredAt: string,
  timezone: string
): Date {
  const reportDate = format(
    addDays(parseISO(startDate), dayNumber - 1),
    'yyyy-MM-dd'
  );
  const date = new Date(measuredAt);
  const time = date.toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour12: false,
  });
  return fromZonedTime(`${reportDate}T${time}`, timezone);
}
