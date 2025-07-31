const { analyzeSymptoms } = require('../../utils/aiService');

const analyzePatientSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    // Validate input
    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return res.status(400).json({
        error: 'Symptoms description is required and must be a non-empty string'
      });
    }

    // Check if symptoms are too short or too long
    if (symptoms.trim().length < 10) {
      return res.status(400).json({
        error: 'Please provide a more detailed description of your symptoms (at least 10 characters)'
      });
    }

    if (symptoms.length > 2000) {
      return res.status(400).json({
        error: 'Symptoms description is too long. Please keep it under 2000 characters.'
      });
    }

    // Analyze symptoms using AI
    const analysis = await analyzeSymptoms(symptoms.trim());

    // Return the analysis
    res.json({
      success: true,
      analysis: {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        inputSymptoms: symptoms.trim()
      }
    });

  } catch (error) {
    console.error('Error in symptom analysis:', error);
    
    // Return appropriate error response
    if (error.message.includes('API key')) {
      return res.status(500).json({
        error: 'AI service configuration error. Please contact support.'
      });
    }

    res.status(500).json({
      error: error.message || 'An error occurred while analyzing symptoms'
    });
  }
};

module.exports = {
  analyzePatientSymptoms
};