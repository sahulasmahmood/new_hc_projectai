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

function shouldBeOnDuty(shiftTime) {
  if (!shiftTime || !shiftTime.startTime || !shiftTime.endTime) {
    return null;
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const { startTime, endTime } = shiftTime;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

function getExpectedStatus(shiftTime) {
  const onDuty = shouldBeOnDuty(shiftTime);
  
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

    const expectedStatus = getExpectedStatus(staff.shiftTime);
    
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

    await logStatusChange(
      staffId,
      previousStatus,
      expectedStatus,
      'automatic'
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
    const allStaff = await prisma.staff.findMany({
      where: {
        shiftId: {
          not: null
        }
      },
      select: { id: true }
    });

    const results = {
      total: allStaff.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    for (const staff of allStaff) {
      const result = await updateStaffStatusAutomatically(staff.id);
      
      if (result.updated) {
        results.updated++;
      } else {
        results.skipped++;
      }
      
      if (result.error) {
        results.errors++;
      }
      
      results.details.push({
        staffId: staff.id,
        ...result
      });
    }

    return results;
  } catch (error) {
    console.error('Error updating all staff statuses:', error);
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

async function getStatusHistory(staffId, limit = 50) {
  try {
    const history = await prisma.staffStatusLog.findMany({
      where: { staffId },
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
  CONFIG
};
