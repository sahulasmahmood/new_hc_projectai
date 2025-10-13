require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { serve } = require('inngest/express');
const routes = require('./routes');
const { inngest } = require('./inngest/client');
const { 
  onAppointmentConfirmation, 
  onAppointmentCancellation, 
  onAppointmentReschedule 
} = require('./inngest/functions/appointment-emails');
const {
  onAppointmentReminder,
  onAppointmentFollowUp,
  onSmartAppointmentSuggestions,
  onWaitlistManagement
} = require('./inngest/functions/appointment-automation');
const { initializeDefaultsOnce } = require('./utils/initializeDefaults');
const { startStatusUpdateJob } = require('./jobs/updateStaffStatus');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', routes);

// Inngest endpoint
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions: [
      onAppointmentConfirmation, 
      onAppointmentCancellation, 
      onAppointmentReschedule,
      onAppointmentReminder,
      onAppointmentFollowUp,
      onSmartAppointmentSuggestions,
      onWaitlistManagement
    ],
  })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize default roles, departments, and vitals settings on startup
// Initialize defaults only once (on fresh database)
initializeDefaultsOnce().then((result) => {
  if (result.skipped) {
    console.log('💡 Tip: Manage roles, departments, and categories through the admin UI');
  }
}).catch(err => {
  console.error('Failed to initialize defaults:', err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start staff status update job
  startStatusUpdateJob();
  console.log('✅ Staff status tracking job started');
});
