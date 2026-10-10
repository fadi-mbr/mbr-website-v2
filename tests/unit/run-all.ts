import cronSuite from './reviews-cron.test';
import stagingSuite from './staging.test';
async function main() { await cronSuite(); await stagingSuite(); }
main().catch(error => { console.error(error); process.exit(1); });
