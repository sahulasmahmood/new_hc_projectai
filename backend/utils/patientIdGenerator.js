const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Generate a prefix from hospital name
 * Takes the first 3 letters of the hospital name and converts to uppercase
 * If hospital name has less than 3 letters, pads with 'A'
 * @param {string} hospitalName - The hospital name
 * @returns {string} - 3-letter prefix
 */
function generatePrefixFromHospitalName(hospitalName) {
  if (!hospitalName || typeof hospitalName !== 'string') {
    throw new Error('Hospital name is required to generate patient ID prefix. Please configure hospital settings first.');
  }
  
  // Remove spaces and special characters, keep only letters
  const cleanName = hospitalName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  
  if (cleanName.length === 0) {
    throw new Error('Hospital name must contain at least one letter to generate patient ID prefix. Please update hospital settings.');
  }
  
  // Take first 3 letters, pad with 'A' if needed
  const prefix = cleanName.substring(0, 3).padEnd(3, 'A');
  return prefix;
}

/**
 * Get the dynamic prefix from hospital settings
 * @returns {Promise<string>} - The prefix to use for patient IDs
 */
async function getPatientIdPrefix() {
  try {
    const hospitalSettings = await prisma.hospitalSettings.findFirst();
    
    if (!hospitalSettings) {
      throw new Error('Hospital settings not found. Please configure Hospital Information first before creating patients.');
    }
    
    if (!hospitalSettings.name) {
      throw new Error('Hospital name not set in settings. Please update Hospital Information with a valid hospital name.');
    }
    
    return generatePrefixFromHospitalName(hospitalSettings.name);
  } catch (error) {
    if (error.message.includes('Hospital')) {
      throw error;
    }
    console.error('Error fetching hospital settings for patient ID prefix:', error);
    throw new Error('Unable to access hospital settings. Please ensure the database is connected and Hospital Information is configured.');
  }
}

module.exports = {
  generatePrefixFromHospitalName,
  getPatientIdPrefix
};