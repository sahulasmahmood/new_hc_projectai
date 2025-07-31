const express = require('express');
const router = express.Router();
const { analyzePatientSymptoms } = require('../controllers/ai/symptoms');
const { 
  handleAppointmentChat, 
  bookAppointmentFromChat, 
  getConversationHistory, 
  clearConversation 
} = require('../controllers/ai/appointmentChat');

// Symptom analysis routes
router.post('/analyze-symptoms', analyzePatientSymptoms);

// Appointment chat routes
router.post('/chat/appointment', handleAppointmentChat);
router.post('/chat/book-appointment', bookAppointmentFromChat);
router.get('/chat/history/:conversationId', getConversationHistory);
router.get('/chat/history', getConversationHistory);
router.delete('/chat/clear/:conversationId', clearConversation);
router.delete('/chat/clear', clearConversation);

module.exports = router;