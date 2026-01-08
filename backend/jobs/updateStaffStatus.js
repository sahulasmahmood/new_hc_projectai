const cron = require('node-cron');
const { updateAllStaffStatuses, cleanupOldStatusLogs } = require('../services/staffStatusService');

/**
 * Optimized scheduled job for staff status tracking
 * - Runs every 5 minutes (not every minute) for better performance
 * - Includes database cleanup for audit log management
 * - Optimized for large staff counts
 */

let isRunning = false;
let cleanupRunning = false;

// Configuration
const CONFIG = {
  // Run status updates every 5 minutes instead of every minute
  statusUpdateSchedule: '*/5 * * * *', // Every 5 minutes
  
  // Run cleanup once daily at 2 AM
  cleanupSchedule: '0 2 * * *', // Daily at 2:00 AM
  
  // Keep audit logs for 6 months (sufficient for most compliance needs)
  auditRetentionDays: 180,
  
  // Batch size for processing large staff counts
  batchSize: 100,
  
  timezone: "Asia/Kolkata"
};

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

    // Only log if there were actual changes or errors
    if (results.updated > 0 || results.errors > 0) {
      console.log(`[Staff Status Job] Completed in ${duration}ms`);
      console.log(`[Staff Status Job] Results:`, {
        total: results.total,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors
      });
    }
  } catch (error) {
    console.error('[Staff Status Job] Error:', error);
  } finally {
    isRunning = false;
  }
}

async function runCleanup() {
  if (cleanupRunning) {
    console.log('[Staff Status Cleanup] Previous cleanup still running, skipping...');
    return;
  }

  cleanupRunning = true;
  const startTime = new Date();

  try {
    console.log(`[Staff Status Cleanup] Starting audit log cleanup at ${startTime.toISOString()}`);
    
    const result = await cleanupOldStatusLogs(CONFIG.auditRetentionDays);
    
    const endTime = new Date();
    const duration = endTime - startTime;

    console.log(`[Staff Status Cleanup] Completed in ${duration}ms`);
    console.log(`[Staff Status Cleanup] Cleaned up ${result.deletedCount} old records`);
    console.log(`[Staff Status Cleanup] Remaining records: ${result.remainingCount}`);
  } catch (error) {
    console.error('[Staff Status Cleanup] Error:', error);
  } finally {
    cleanupRunning = false;
  }
}

/**
 * Start the optimized scheduled jobs
 */
function startStatusUpdateJob() {
  console.log('[Staff Status Job] Starting optimized status tracking...');
  
  // Status update job - every 5 minutes
  const statusJob = cron.schedule(CONFIG.statusUpdateSchedule, runStatusUpdate, {
    scheduled: true,
    timezone: CONFIG.timezone
  });
  
  // Cleanup job - daily at 2 AM
  const cleanupJob = cron.schedule(CONFIG.cleanupSchedule, runCleanup, {
    scheduled: true,
    timezone: CONFIG.timezone
  });
  
  console.log(`[Staff Status Job] Status updates scheduled: ${CONFIG.statusUpdateSchedule}`);
  console.log(`[Staff Status Job] Cleanup scheduled: ${CONFIG.cleanupSchedule}`);
  console.log(`[Staff Status Job] Audit retention: ${CONFIG.auditRetentionDays} days (6 months)`);
  
  // Run initial update (but not cleanup)
  console.log('[Staff Status Job] Running initial update...');
  runStatusUpdate();

  return { statusJob, cleanupJob };
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
