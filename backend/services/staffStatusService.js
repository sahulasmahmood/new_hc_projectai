const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  manualOverrideGracePeriod: 60,
  enableAutomaticUpdates: true
};

async function logStatusChange(staffId, previousStatus, newStatus, changeType, changedBy = null, reason = null) {
  try {
    await prisma.staffStatusLog.create({
      data: {
        staffId,
        previousStatus,
        newStatus,
        changeType,
        changedBy,
        reason
      }
    });
  } catch (error) {
    console.error('Error logging status change:', error);
  }
}

function shouldBeOnDuty(shiftTime, weekOff) {
  if (!shiftTime || !shiftTime.startTime || !shiftTime.endTime) {
    return null;
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Check if today is the staff's week off day
  if (weekOff && weekOff.toLowerCase() === currentDay) {
    return false; // Staff is off duty on their week off day
  }
  
  const { startTime, endTime } = shiftTime;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

function getExpectedStatus(shiftTime, weekOff) {
  const onDuty = shouldBeOnDuty(shiftTime, weekOff);
  
  if (onDuty === null) {
    return null;
  }
  
  return onDuty ? 'On Duty' : 'Off Duty';
}

async function hasRecentManualOverride(staffId) {
  const gracePeriodAgo = new Date();
  gracePeriodAgo.setMinutes(gracePeriodAgo.getMinutes() - CONFIG.manualOverrideGracePeriod);
  
  const recentManualChange = await prisma.staffStatusLog.findFirst({
    where: {
      staffId,
      changeType: 'manual',
      timestamp: {
        gte: gracePeriodAgo
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  });
  
  return !!recentManualChange;
}

async function updateStaffStatusAutomatically(staffId) {
  if (!CONFIG.enableAutomaticUpdates) {
    return { updated: false, reason: 'Automatic updates disabled' };
  }

  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { shiftTime: true }
    });

    if (!staff) {
      return { updated: false, reason: 'Staff not found' };
    }

    const hasManualOverride = await hasRecentManualOverride(staffId);
    if (hasManualOverride) {
      return { 
        updated: false, 
        reason: 'Recent manual override exists',
        gracePeriodMinutes: CONFIG.manualOverrideGracePeriod
      };
    }

    const expectedStatus = getExpectedStatus(staff.shiftTime, staff.weekOff);
    
    if (expectedStatus === null) {
      return { updated: false, reason: 'No shift assigned' };
    }

    if (staff.status === expectedStatus) {
      return { updated: false, reason: 'Status already correct' };
    }

    const previousStatus = staff.status;
    await prisma.staff.update({
      where: { id: staffId },
      data: { status: expectedStatus }
    });

    // Determine reason for automatic change
    let reason = null;
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (staff.weekOff && staff.weekOff.toLowerCase() === currentDay) {
      reason = 'Weekly Off';
    }

    await logStatusChange(
      staffId,
      previousStatus,
      expectedStatus,
      'automatic',
      null,
      reason
    );

    return {
      updated: true,
      previousStatus,
      newStatus: expectedStatus,
      reason: 'Automatic update based on shift time'
    };
  } catch (error) {
    console.error('Error updating staff status:', error);
    return { updated: false, reason: 'Error occurred', error: error.message };
  }
}

async function updateAllStaffStatuses() {
  try {
    // Only get staff with shifts and include shift data in one query
    const allStaff = await prisma.staff.findMany({
      where: {
        shiftId: {
          not: null
        }
      },
      select: { 
        id: true,
        status: true,
        weekOff: true,
        shiftTime: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      }
    });

    const results = {
      total: allStaff.length,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    const batches = [];
    
    for (let i = 0; i < allStaff.length; i += BATCH_SIZE) {
      batches.push(allStaff.slice(i, i + BATCH_SIZE));
    }

    // Process each batch
    for (const batch of batches) {
      const batchPromises = batch.map(async (staff) => {
        try {
          // Check if status needs updating without additional DB calls
          const expectedStatus = getExpectedStatus(staff.shiftTime, staff.weekOff);
          
          if (expectedStatus === null || staff.status === expectedStatus) {
            results.skipped++;
            return;
          }

          // Check for recent manual override
          const hasManualOverride = await hasRecentManualOverride(staff.id);
          if (hasManualOverride) {
            results.skipped++;
            return;
          }

          // Determine reason for automatic change
          let reason = null;
          const now = new Date();
          const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          
          if (staff.weekOff && staff.weekOff.toLowerCase() === currentDay) {
            reason = 'Weekly Off';
          }

          // Update status and log in a transaction
          await prisma.$transaction(async (tx) => {
            await tx.staff.update({
              where: { id: staff.id },
              data: { status: expectedStatus }
            });

            await tx.staffStatusLog.create({
              data: {
                staffId: staff.id,
                previousStatus: staff.status,
                newStatus: expectedStatus,
                changeType: 'automatic',
                reason: reason
              }
            });
          });

          results.updated++;
        } catch (error) {
          console.error(`Error updating staff ${staff.id}:`, error);
          results.errors++;
        }
      });

      // Wait for batch to complete before processing next batch
      await Promise.all(batchPromises);
    }

    return results;
  } catch (error) {
    console.error('Error updating all staff statuses:', error);
    throw error;
  }
}

/**
 * Clean up old status logs to prevent database bloat
 * Keeps logs for specified number of days for compliance
 */
async function cleanupOldStatusLogs(retentionDays = 180) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Count records before deletion
    const totalCount = await prisma.staffStatusLog.count();
    
    // Delete old records in batches to avoid locking the table
    const BATCH_SIZE = 1000;
    let deletedCount = 0;
    
    while (true) {
      const deleteResult = await prisma.staffStatusLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      if (deleteResult.count === 0) {
        break;
      }
      
      deletedCount += deleteResult.count;
      
      // If we deleted less than batch size, we're done
      if (deleteResult.count < BATCH_SIZE) {
        break;
      }
    }

    const remainingCount = await prisma.staffStatusLog.count();

    return {
      deletedCount,
      remainingCount,
      cutoffDate: cutoffDate.toISOString()
    };
  } catch (error) {
    console.error('Error cleaning up old status logs:', error);
    throw error;
  }
}

/**
 * Get status statistics for monitoring
 */
async function getStatusStatistics() {
  try {
    const stats = await prisma.staffStatusLog.groupBy({
      by: ['changeType'],
      _count: {
        id: true
      },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const totalLogs = await prisma.staffStatusLog.count();
    const oldestLog = await prisma.staffStatusLog.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true }
    });

    return {
      last24Hours: stats,
      totalLogs,
      oldestLogDate: oldestLog?.timestamp
    };
  } catch (error) {
    console.error('Error fetching status statistics:', error);
    throw error;
  }
}

/**
 * Get grace period information for a staff member
 */
async function getGraceInfo(staffId) {
  try {
    const gracePeriodAgo = new Date();
    gracePeriodAgo.setMinutes(gracePeriodAgo.getMinutes() - CONFIG.manualOverrideGracePeriod);
    
    const lastManualChange = await prisma.staffStatusLog.findFirst({
      where: {
        staffId,
        changeType: 'manual',
        timestamp: {
          gte: gracePeriodAgo
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (!lastManualChange) {
      return {
        hasGracePeriod: false,
        remainingMinutes: 0
      };
    }

    const timeSinceChange = Date.now() - new Date(lastManualChange.timestamp).getTime();
    const minutesSinceChange = Math.floor(timeSinceChange / (1000 * 60));
    const remainingMinutes = Math.max(0, CONFIG.manualOverrideGracePeriod - minutesSinceChange);

    return {
      hasGracePeriod: remainingMinutes > 0,
      remainingMinutes,
      lastManualChange: lastManualChange.timestamp
    };
  } catch (error) {
    console.error('Error fetching grace info:', error);
    throw error;
  }
}

async function overrideStaffStatus(staffId, newStatus, changedBy, reason = null) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      throw new Error('Staff not found');
    }

    const previousStatus = staff.status;

    await prisma.staff.update({
      where: { id: staffId },
      data: { status: newStatus }
    });

    await logStatusChange(
      staffId,
      previousStatus,
      newStatus,
      'manual',
      changedBy,
      reason
    );

    return {
      success: true,
      previousStatus,
      newStatus,
      changedBy,
      reason
    };
  } catch (error) {
    console.error('Error overriding staff status:', error);
    throw error;
  }
}

async function getStatusHistory(staffId, options = {}) {
  try {
    const { limit = 50, startDate, endDate } = options;
    
    let where = { staffId };
    
    // Add date filtering if provided
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the entire end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.timestamp.lt = endDateTime;
      }
    }

    const history = await prisma.staffStatusLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return history;
  } catch (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }
}

async function getStatusSummary() {
  try {
    const staff = await prisma.staff.findMany({
      select: { status: true }
    });

    const summary = staff.reduce((acc, s) => {
      const status = s.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return summary;
  } catch (error) {
    console.error('Error fetching status summary:', error);
    throw error;
  }
}

module.exports = {
  updateStaffStatusAutomatically,
  updateAllStaffStatuses,
  overrideStaffStatus,
  getStatusHistory,
  getStatusSummary,
  logStatusChange,
  cleanupOldStatusLogs,
  getStatusStatistics,
  getGraceInfo,
  CONFIG
};
