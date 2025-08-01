const { Redis } = require('@upstash/redis');
const { PrismaClient } = require('../generated/prisma');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const prisma = new PrismaClient();

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Get conversation session from Redis
 */
async function getConversationSession(sessionId) {
  try {
    const sessionKey = `chat:${sessionId}`;
    const session = await redis.get(sessionKey);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
      await redis.del(sessionKey);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting conversation session:', error);
    return null;
  }
}

/**
 * Update conversation session in Redis
 */
async function updateConversationSession(sessionId, sessionData) {
  try {
    const sessionKey = `chat:${sessionId}`;
    
    const updatedSession = {
      ...sessionData,
      lastActivity: Date.now(),
    };
    
    // Store in Redis with 30-minute expiration
    await redis.setex(sessionKey, Math.floor(SESSION_TIMEOUT / 1000), updatedSession);
    
    return updatedSession;
  } catch (error) {
    console.error('Error updating conversation session:', error);
    throw error;
  }
}

/**
 * Initialize new conversation session
 */
async function initializeSession(sessionId, patientPhone = null) {
  try {
    const sessionKey = `chat:${sessionId}`;
    
    // Check if session already exists
    const existingSession = await redis.get(sessionKey);
    if (existingSession) {
      return existingSession;
    }
    
    // Create new session
    const newSession = {
      sessionId,
      patientPhone,
      state: 'greeting',
      bookingData: {},
      availableSlots: [],
      messages: [],
      lastActivity: Date.now(),
      createdAt: Date.now(),
    };
    
    // Store in Redis with 30-minute expiration
    await redis.setex(sessionKey, Math.floor(SESSION_TIMEOUT / 1000), newSession);
    
    return newSession;
  } catch (error) {
    console.error('Error initializing session:', error);
    throw error;
  }
}

/**
 * Get patient context from existing database
 */
async function getPatientContext(patientPhone) {
  try {
    if (!patientPhone) return null;
    
    // Find patient by phone
    const patient = await prisma.patient.findFirst({
      where: { phone: patientPhone },
      include: {
        appointments: {
          orderBy: { createdAt: 'desc' },
          take: 3, // Last 3 appointments for context
        },
      },
    });
    
    if (!patient) return null;
    
    return {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      age: patient.age,
      allergies: patient.allergies,
      recentAppointments: patient.appointments.map(apt => ({
        date: apt.date,
        time: apt.time,
        type: apt.type,
        status: apt.status,
      })),
    };
  } catch (error) {
    console.error('Error getting patient context:', error);
    return null;
  }
}

/**
 * Add message to session (keep last 10 messages)
 */
async function addMessageToSession(sessionId, role, content) {
  try {
    const session = await getConversationSession(sessionId);
    if (!session) return;
    
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    
    // Add message and keep only last 10
    session.messages.push(message);
    if (session.messages.length > 10) {
      session.messages = session.messages.slice(-10);
    }
    
    await updateConversationSession(sessionId, session);
  } catch (error) {
    console.error('Error adding message to session:', error);
  }
}

/**
 * Clear conversation session
 */
async function clearSession(sessionId) {
  try {
    const sessionKey = `chat:${sessionId}`;
    await redis.del(sessionKey);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Clean up expired sessions (run periodically)
 */
async function cleanupExpiredSessions() {
  try {
    // Get all chat session keys
    const sessionKeys = await redis.keys('chat:*');
    
    for (const key of sessionKeys) {
      const session = await redis.get(key);
      if (session && Date.now() - session.lastActivity > SESSION_TIMEOUT) {
        await redis.del(key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

// Auto cleanup every 30 minutes
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

module.exports = {
  getConversationSession,
  updateConversationSession,
  initializeSession,
  getPatientContext,
  addMessageToSession,
  clearSession,
  cleanupExpiredSessions,
};