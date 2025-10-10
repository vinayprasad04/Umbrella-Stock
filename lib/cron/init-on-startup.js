/**
 * Auto-initialize Cron Job on Server Startup
 *
 * This module automatically initializes the cron job when imported
 * Import this in any API route to ensure cron job starts with the server
 */

let initialized = false;

function autoInitCron() {
  if (initialized) return;

  try {
    // Only run on server-side
    if (typeof window === 'undefined') {
      const { initCronJob } = require('./activities-sync-cron');
      initCronJob();
      initialized = true;
    }
  } catch (error) {
    console.error('❌ Failed to auto-initialize cron job:', error);
  }
}

// Auto-initialize
autoInitCron();

module.exports = { autoInitCron };
