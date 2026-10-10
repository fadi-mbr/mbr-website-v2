import cronSuite from './reviews-cron.test';
cronSuite().catch(error => { console.error(error); process.exit(1); });
