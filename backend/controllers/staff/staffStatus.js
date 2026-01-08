const {
  overrideStaffStatus,
  getStatusHistory,
  getStatusSummary,
  updateStaffStatusAutomatically
} = require('../../services/staffStatusService');

/**
 * GET /api/staff/:id/status-history
 * Get status change history for a staff member
 */
const getStaffStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const history = await getStatusHistory(
      parseInt(id),
      limit ? parseInt(limit) : 50
    );

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

module.exports = {
  getStaffStatusHistory,
  overrideStatus,
  getStaffStatusSummary,
  triggerAutoUpdate
};
