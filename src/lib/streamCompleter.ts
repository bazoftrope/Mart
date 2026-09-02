import 'reflect-metadata';
import { addDays, parseISO } from 'date-fns';
import { Stream } from '@db/models';
import { getCurrentDateInTimezone } from './calendar';

export async function syncStreamStatus(
  stream: Stream,
  durationDays: number
): Promise<boolean> {
  if (!durationDays || durationDays <= 0) {
    return false;
  }

  const today = parseISO(getCurrentDateInTimezone('UTC'));
  const startDate = parseISO(stream.startDate);
  const endDate = addDays(startDate, durationDays - 1);

  let nextStatus: Stream['status'] | null = null;

  if (today >= endDate) {
    if (stream.status !== 'finished') nextStatus = 'finished';
  } else if (today >= startDate && stream.status === 'open') {
    nextStatus = 'running';
  }

  if (nextStatus === null) {
    return false;
  }

  stream.status = nextStatus;
  await stream.save();
  return true;
}
