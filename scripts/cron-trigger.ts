const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function main() {
  console.log(`Triggering engine at ${APP_URL}/api/cron`);

  const res = await fetch(`${APP_URL}/api/cron`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  console.log('Engine result:', JSON.stringify(data, null, 2));
  process.exit(res.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
