const {
  overrideStaffStatus,
  getStatusHistory,
  getStatusSummary,
  updateStaffStatusAutomatically,
  getStatusStatistics,
  cleanupOldStatusLogs,
  getGraceInfo
} = require('../../services/staffStatusService');

/**
 * GET /api/staff/:id/status-history
 * Get status change history for a staff member with date filtering
 */
const getStaffStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, startDate, endDate } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 50,
      startDate,
      endDate
    };

    const history = await getStatusHistory(parseInt(id), options);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status history'
    });
  }
};

/**
 * POST /api/staff/:id/override-status
 * Manually override staff status
 */
const overrideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changedBy, reason } = req.body;

    // Validate required fields
    if (!status || !changedBy) {
      return res.status(400).json({
        success: false,
        error: 'Status and changedBy are required'
      });
    }

    // Validate status value
    const validStatuses = [
      'On Duty',
      'Off Duty',
      'On Break',
      'On Leave',
      'Emergency Leave',
      'Late',
      'Extended Shift'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await overrideStaffStatus(
      parseInt(id),
      status,
      changedBy,
      reason
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error overriding status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to override status'
    });
  }
};

/**
 * GET /api/staff/status-summary
 * Get current status summary for all staff
 */
const getStaffStatusSummary = async (req, res) => {
  try {
    const summary = await getStatusSummary();

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching status summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status summary'
    });
  }
};

/**
 * POST /api/staff/:id/update-status-auto
 * Manually trigger automatic status update for a staff member
 */
const triggerAutoUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await updateStaffStatusAutomatically(parseInt(id));

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error triggering auto update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger automatic update'
    });
  }
};

/**
 * GET /api/staff/status-statistics
 * Get status tracking statistics for monitoring
 */
const getStaffStatusStatistics = async (req, res) => {
  try {
    const stats = await getStatusStatistics();

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching status statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status statistics'
    });
  }
};

/**
 * POST /api/staff/cleanup-logs
 * Manually trigger cleanup of old status logs
 */
const triggerLogCleanup = async (req, res) => {
  try {
    const { retentionDays = 180 } = req.body;

    const result = await cleanupOldStatusLogs(retentionDays);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error triggering log cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup logs'
    });
  }
};

/**
 * GET /api/staff/:id/grace-info
 * Get grace period information for a staff member
 */
const getStaffGraceInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const graceInfo = await getGraceInfo(parseInt(id));

    res.json({
      success: true,
      ...graceInfo
    });
  } catch (error) {
    console.error('Error fetching grace info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch grace info'
    });
  }
};

module.exports = {
  getStaffStatusHistory,
  overrideStatus,
  getStaffStatusSummary,
  triggerAutoUpdate,
  getStaffStatusStatistics,
  triggerLogCleanup,
  getStaffGraceInfo
};
