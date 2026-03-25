import pg from 'pg';

const JOB_NAME = 'traderview-engine';

/**
 * Convert tradeFrequencyHours → cron expression.
 *   1  → "0 * * * *"       (every hour)
 *   4  → "0 *​/4 * * *"     (every 4 hours)
 *   24 → "0 0 * * *"       (once a day at midnight)
 */
function hoursToCron(hours: number): string {
  if (hours <= 1) return '0 * * * *';
  if (hours >= 24) return '0 0 * * *';
  return `0 */${hours} * * *`;
}

/**
 * Get a direct PG connection (bypasses pgbouncer).
 * pg_cron functions require a non-pooled connection.
 */
function getDirectClient() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  return new pg.Client({ connectionString: url });
}

/**
 * Update (or create) the pg_cron schedule for the trading engine.
 * Called when tradeFrequencyHours changes in Settings.
 */
export async function updateCronSchedule(hours: number, appUrl?: string): Promise<void> {
  const cron = hoursToCron(hours);
  const client = getDirectClient();

  try {
    await client.connect();

    // Check if job already exists
    const existing = await client.query(
      `SELECT jobid FROM cron.job WHERE jobname = $1`,
      [JOB_NAME],
    );

    if (existing.rows.length > 0) {
      // Update existing schedule
      await client.query(
        `SELECT cron.alter_job(job_id := $1, schedule := $2)`,
        [existing.rows[0].jobid, cron],
      );
    } else if (appUrl) {
      // Create the job if it doesn't exist and we have the app URL
      const cronSecret = process.env.CRON_SECRET || '';
      await client.query(
        `SELECT cron.schedule(
          $1,
          $2,
          $3
        )`,
        [
          JOB_NAME,
          cron,
          `SELECT net.http_post(
            url := '${appUrl}/api/cron',
            headers := '{"Authorization": "Bearer ${cronSecret}", "Content-Type": "application/json"}'::jsonb,
            body := '{}'::jsonb
          )`,
        ],
      );
    }
  } finally {
    await client.end();
  }
}

/**
 * Get the current cron schedule from pg_cron (for display purposes).
 */
export async function getCronSchedule(): Promise<{ schedule: string; active: boolean } | null> {
  const client = getDirectClient();

  try {
    await client.connect();
    const result = await client.query(
      `SELECT schedule, active FROM cron.job WHERE jobname = $1`,
      [JOB_NAME],
    );
    if (result.rows.length === 0) return null;
    return { schedule: result.rows[0].schedule, active: result.rows[0].active };
  } catch {
    return null;
  } finally {
    await client.end();
  }
}
