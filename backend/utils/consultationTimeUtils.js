/**
 * Consultation Time Management Utilities
 * Handles official vs actual consultation times for business consistency
 */

/**
 * Parse appointment time string and create scheduled start/end times
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} time - Time string (e.g., "11:30 AM")
 * @param {string} duration - Duration in minutes (e.g., "30")
 * @returns {Object} - { scheduledStart, scheduledEnd }
 */
const getScheduledConsultationTimes = (date, time, duration) => {
  // Parse date components (timezone-safe)
  const [year, month, day] = date.split('-').map(Number);
  const scheduledStart = new Date(year, month - 1, day); // month is 0-indexed
  
  // Parse time string (e.g., "11:30 AM")
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  
  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  scheduledStart.setHours(hours, minutes, 0, 0);
  
  // Calculate scheduled end time
  const durationMinutes = parseInt(duration);
  const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60000);
  
  return { scheduledStart, scheduledEnd };
};

/**
 * Validate consultation start attempt and return appropriate response
 * @param {string} date - Appointment date (YYYY-MM-DD)
 * @param {string} time - Appointment time (e.g., "11:30 AM")
 * @param {string} duration - Duration in minutes
 * @param {Date} currentTime - Current timestamp (optional, defaults to now)
 * @returns {Object} - { canStart, message, messageType, scheduledTimes, actualTime }
 */
const validateConsultationStart = (date, time, duration, currentTime = new Date()) => {
  const { scheduledStart, scheduledEnd } = getScheduledConsultationTimes(date, time, duration);
  
  // Format times for display
  const formatTime = (date) => date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  const scheduledStartStr = formatTime(scheduledStart);
  const scheduledEndStr = formatTime(scheduledEnd);
  const currentTimeStr = formatTime(currentTime);
  
  // Check if current time is past scheduled end time
  if (currentTime > scheduledEnd) {
    return {
      canStart: false,
      message: `Cannot start consultation. The scheduled time slot (${scheduledStartStr} - ${scheduledEndStr}) has already ended. Current time: ${currentTimeStr}`,
      messageType: 'error',
      scheduledTimes: { scheduledStart, scheduledEnd },
      actualTime: currentTime
    };
  }
  
  // Check if starting early (before scheduled start time)
  if (currentTime < scheduledStart) {
    const minutesEarly = Math.ceil((scheduledStart - currentTime) / 60000);
    return {
      canStart: true,
      message: `You're starting ${minutesEarly} minute(s) early. The consultation will still be recorded as the official time slot: ${scheduledStartStr} - ${scheduledEndStr}`,
      messageType: 'info',
      scheduledTimes: { scheduledStart, scheduledEnd },
      actualTime: currentTime
    };
  }
  
  // Check if starting late (after scheduled start but before end)
  if (currentTime > scheduledStart) {
    const minutesLate = Math.ceil((currentTime - scheduledStart) / 60000);
    return {
      canStart: true,
      message: `You're starting ${minutesLate} minute(s) late. The consultation will still be recorded as the official time slot: ${scheduledStartStr} - ${scheduledEndStr}`,
      messageType: 'warning',
      scheduledTimes: { scheduledStart, scheduledEnd },
      actualTime: currentTime
    };
  }
  
  // Starting exactly on time
  return {
    canStart: true,
    message: `Starting consultation on time: ${scheduledStartStr} - ${scheduledEndStr}`,
    messageType: 'success',
    scheduledTimes: { scheduledStart, scheduledEnd },
    actualTime: currentTime
  };
};

/**
 * Format consultation time display for UI
 * @param {Date} scheduledStart - Official scheduled start time
 * @param {Date} scheduledEnd - Official scheduled end time
 * @param {Date} actualStart - Actual start time (optional)
 * @param {Date} actualEnd - Actual end time (optional)
 * @returns {Object} - Formatted time strings for display
 */
const formatConsultationTimes = (scheduledStart, scheduledEnd, actualStart = null, actualEnd = null) => {
  const formatTime = (date) => date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  const formatDateTime = (date) => date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return {
    officialSlot: `${formatTime(scheduledStart)} - ${formatTime(scheduledEnd)}`,
    scheduledStart: formatTime(scheduledStart),
    scheduledEnd: formatTime(scheduledEnd),
    actualStart: actualStart ? formatDateTime(actualStart) : null,
    actualEnd: actualEnd ? formatDateTime(actualEnd) : null,
    duration: Math.ceil((scheduledEnd - scheduledStart) / 60000) // in minutes
  };
};

/**
 * Calculate consultation analytics
 * @param {Date} scheduledStart - Official scheduled start time
 * @param {Date} scheduledEnd - Official scheduled end time
 * @param {Date} actualStart - Actual start time
 * @param {Date} actualEnd - Actual end time (optional)
 * @returns {Object} - Analytics data
 */
const calculateConsultationAnalytics = (scheduledStart, scheduledEnd, actualStart, actualEnd = null) => {
  const startVariance = Math.round((actualStart - scheduledStart) / 60000); // in minutes
  const scheduledDuration = Math.ceil((scheduledEnd - scheduledStart) / 60000);
  
  let actualDuration = null;
  let endVariance = null;
  
  if (actualEnd) {
    actualDuration = Math.ceil((actualEnd - actualStart) / 60000);
    endVariance = Math.round((actualEnd - scheduledEnd) / 60000);
  }
  
  return {
    startVariance, // negative = early, positive = late, 0 = on time
    endVariance,   // negative = early, positive = late, 0 = on time
    scheduledDuration,
    actualDuration,
    onTime: Math.abs(startVariance) <= 2, // within 2 minutes considered on time
    efficiency: actualDuration ? Math.round((scheduledDuration / actualDuration) * 100) : null
  };
};

module.exports = {
  getScheduledConsultationTimes,
  validateConsultationStart,
  formatConsultationTimes,
  calculateConsultationAnalytics
};