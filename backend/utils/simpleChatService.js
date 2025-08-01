const {
  processAppointmentChat,
  CONVERSATION_STATES,
} = require('./appointmentChatService');
const {
  getConversationSession,
  updateConversationSession,
  initializeSession,
  getPatientContext,
  addMessageToSession,
} = require('./simpleChatMemory');

/**
 * Process chat message with simplified memory (Redis + existing DB data)
 */
async function processSimpleChat(message, sessionId, patientPhone = null, userId = null) {
  try {
    // Initialize session if needed
    let session = await getConversationSession(sessionId);
    if (!session) {
      session = await initializeSession(sessionId, patientPhone);
    }
    
    // Get patient context from existing database
    const patientContext = await getPatientContext(patientPhone || session.patientPhone);
    
    // Build conversation context for the original chat service
    const conversationContext = {
      state: session.state || CONVERSATION_STATES.GREETING,
      bookingData: session.bookingData || {},
      availableSlots: session.availableSlots || [],
      messages: session.messages || [],
    };
    
    // Add patient info if available
    if (patientContext) {
      conversationContext.patientInfo = patientContext;
      
      // Pre-fill known patient data in booking
      if (!conversationContext.bookingData.patientName && patientContext.name) {
        conversationContext.bookingData.patientName = patientContext.name;
      }
      if (!conversationContext.bookingData.patientPhone && patientContext.phone) {
        conversationContext.bookingData.patientPhone = patientContext.phone;
      }
      if (!conversationContext.bookingData.patientEmail && patientContext.email) {
        conversationContext.bookingData.patientEmail = patientContext.email;
      }
      if (!conversationContext.bookingData.patientAge && patientContext.age) {
        conversationContext.bookingData.patientAge = patientContext.age;
      }
    }
    
    // Add user message to session
    await addMessageToSession(sessionId, 'user', message);
    
    // Process with original appointment chat service
    const response = await processAppointmentChat(message, conversationContext, userId);
    
    // Add assistant response to session
    await addMessageToSession(sessionId, 'assistant', response.message);
    
    // Update session with new conversation context
    const updatedSession = {
      ...session,
      state: response.conversationContext?.state || session.state,
      bookingData: response.conversationContext?.bookingData || session.bookingData,
      availableSlots: response.availableSlots || session.availableSlots,
    };
    
    await updateConversationSession(sessionId, updatedSession);
    
    // Personalize response for returning patients
    const personalizedResponse = personalizeForReturningPatient(response, patientContext);
    
    return personalizedResponse;
    
  } catch (error) {
    console.error('Error in simple chat processing:', error);
    
    // Fallback response
    return {
      message: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
      conversationContext: { state: CONVERSATION_STATES.GREETING },
    };
  }
}

/**
 * Simple personalization using existing patient data
 */
function personalizeForReturningPatient(response, patientContext) {
  if (!patientContext) return response;
  
  const personalizedResponse = { ...response };
  
  // Personalize greeting for returning patients
  if (response.conversationContext?.state === CONVERSATION_STATES.GREETING) {
    personalizedResponse.message = `Hello ${patientContext.name}! Welcome back. How can I help you with your appointment today?`;
  }
  
  // Add context about recent appointments if relevant
  if (response.conversationContext?.state === CONVERSATION_STATES.ASKING_DATE && 
      patientContext.recentAppointments?.length > 0) {
    const lastAppointment = patientContext.recentAppointments[0];
    if (lastAppointment.type) {
      personalizedResponse.message += `\n\nI see your last appointment was for ${lastAppointment.type}. Would you like to book a similar appointment?`;
    }
  }
  
  return personalizedResponse;
}

/**
 * Get conversation history for a session
 */
async function getConversationHistory(sessionId) {
  try {
    const session = await getConversationSession(sessionId);
    return session?.messages || [];
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

module.exports = {
  processSimpleChat,
  getConversationHistory,
  CONVERSATION_STATES,
};