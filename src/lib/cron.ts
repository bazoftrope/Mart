import cron from 'node-cron';
import { calculateAllRatings } from './ratingCalculator';

let started = false;

export function startRatingCron(): void {
  if (started) return;
  started = true;

  // Every day at 00:05
  cron.schedule('5 0 * * *', async () => {
    console.log('[cron] Starting daily rating calculation...');
    try {
      const result = await calculateAllRatings();
      console.log(`[cron] Done. Processed: ${result.processed}, errors: ${result.errors.length}`);
      if (result.errors.length > 0) {
        console.error('[cron] Errors:', result.errors);
      }
    } catch (error) {
      console.error('[cron] Rating calculation failed:', error);
    }
  });

  console.log('[cron] Rating cron scheduled (daily at 00:05)');
}
