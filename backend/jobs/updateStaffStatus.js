const cron = require('node-cron');
const { updateAllStaffStatuses } = require('../services/staffStatusService');

/**
 * Scheduled job to update staff statuses based on shift times
 * Runs every minute
 */

let isRunning = false;

async function runStatusUpdate() {
  if (isRunning) {
    console.log('[Staff Status Job] Previous job still running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = new Date();

  try {
    console.log(`[Staff Status Job] Starting at ${startTime.toISOString()}`);
    
    const results = await updateAllStaffStatuses();
    
    const endTime = new Date();
    const duration = endTime - startTime;

    console.log(`[Staff Status Job] Completed in ${duration}ms`);
    console.log(`[Staff Status Job] Results:`, {
      total: results.total,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors
    });

    // Log details if there were updates or errors
    if (results.updated > 0 || results.errors > 0) {
      console.log('[Staff Status Job] Details:', 
        results.details.filter(d => d.updated || d.error)
      );
    }
  } catch (error) {
    console.error('[Staff Status Job] Error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the scheduled job
 */
function startStatusUpdateJob() {
  // Run every minute: '* * * * *'
  const schedule = '* * * * *';
  
  console.log('[Staff Status Job] Scheduling job with cron:', schedule);
  
  const job = cron.schedule(schedule, runStatusUpdate, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  // Run once immediately on startup
  console.log('[Staff Status Job] Running initial update...');
  runStatusUpdate();

  return job;
}

/**
 * Stop the scheduled job
 */
function stopStatusUpdateJob(job) {
  if (job) {
    job.stop();
    console.log('[Staff Status Job] Job stopped');
  }
}

module.exports = {
  startStatusUpdateJob,
  stopStatusUpdateJob,
  runStatusUpdate
};
