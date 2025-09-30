const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate exponential backoff delay
const getRetryDelay = (attempt) => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Detect language of input (English or Tamil)
const detectLanguage = async (input) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Detect if the text is in English or Tamil language. Respond with ONLY "ENGLISH" or "TAMIL" - nothing else.

Examples:
- "I have a headache" → ENGLISH
- "எனக்கு தலைவலி இருக்கிறது" → TAMIL
- "My stomach hurts" → ENGLISH  
- "என் வயிறு வலிக்கிறது" → TAMIL`
        },
        {
          role: "user",
          content: `What language is this: "${input}"`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 10,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    return response === "TAMIL" ? "TAMIL" : "ENGLISH"; // Default to English if unclear
  } catch (error) {
    console.error("Language detection failed:", error);
    return "ENGLISH"; // Default to English if detection fails
  }
};

// Check if input is medically relevant using AI
const checkMedicalRelevance = async (input) => {
  try {
    // Use GROQ for fast relevance checking
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a medical relevance checker. Determine if the user's input is related to health, medical symptoms, or healthcare concerns.

Respond with ONLY "MEDICAL" or "NON_MEDICAL" - nothing else.

MEDICAL examples:
- Symptoms (headache, fever, pain, nausea, etc.)
- Health concerns (feeling sick, tired, dizzy)
- Medical conditions or diseases
- Body parts or functions
- Health-related questions
- Medication or treatment inquiries

NON_MEDICAL examples:
- General conversation
- Technology questions
- Weather, sports, entertainment
- Math, science (non-medical)
- Programming, business
- Random topics unrelated to health`
        },
        {
          role: "user",
          content: `Is this medical/health related: "${input}"`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 10,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    return response === "MEDICAL";
  } catch (error) {
    console.error("Medical relevance check failed:", error);
    // If check fails, assume it's medical to be safe (don't block potentially medical queries)
    return true;
  }
};

// GROQ models in order of preference (updated with current supported models)
const GROQ_MODELS = [
  {
    name: "llama-3.1-8b-instant",
    description: "Fast and efficient Llama 3.1",
    maxTokens: 1000
  },
  {
    name: "llama-3.1-70b-versatile", 
    description: "Higher quality Llama 3.1, slower",
    maxTokens: 1000
  },
  {
    name: "llama-3.2-3b-preview",
    description: "Latest Llama 3.2 preview",
    maxTokens: 1000
  },
  {
    name: "gemma2-9b-it",
    description: "Google's Gemma 2 model",
    maxTokens: 1000
  }
];

// GROQ AI analysis function with multi-model fallback and Tamil support
const analyzeWithGroq = async (symptoms, language = "ENGLISH") => {
  let lastError = null;
  
  // Try each GROQ model in order
  for (let i = 0; i < GROQ_MODELS.length; i++) {
    const model = GROQ_MODELS[i];
    
    try {
      console.log(`🔄 Trying GROQ model: ${model.name} (${model.description})`);
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: language === "TAMIL" 
              ? `நீங்கள் ஒரு மேம்பட்ட மருத்துவ AI உதவியாளர். நீங்கள் செல்லுபடியாகும் JSON மட்டுமே பதிலளிக்க வேண்டும். விளக்கங்கள் இல்லை, markdown இல்லை, JSON கட்டமைப்பிற்கு வெளியே உரை இல்லை.

முக்கியம்: இது கல்வி நோக்கங்களுக்காக மட்டுமே மற்றும் தொழில்முறை மருத்துவ ஆலோசனையை மாற்றக்கூடாது.

நீங்கள் அறிகுறிகளை பகுப்பாய்வு செய்து இந்த JSON கட்டமைப்பில் மட்டுமே பதிலளிக்க வேண்டும்:
{
  "possibleConditions": [
    {
      "name": "நோயின் பெயர்",
      "probability": "அதிகம்/நடுத்தரம்/குறைவு", 
      "description": "முக்கிய அறிகுறிகளுடன் விரிவான மருத்துவ விளக்கம்"
    }
  ],
  "recommendedActions": [
    "குறிப்பிட்ட நடவடிக்கை 1",
    "குறிப்பிட்ட நடவடிக்கை 2", 
    "குறிப்பிட்ட நடவடிக்கை 3"
  ],
  "suggestedMedications": [
    {
      "name": "மருந்தின் பெயர்",
      "type": "மருந்தகத்தில் கிடைக்கும்",
      "purpose": "இது என்ன சிகிச்சை அளிக்கிறது",
      "disclaimer": "சரியான அளவு மற்றும் பயன்பாட்டிற்கு எப்போதும் மருந்தாளர் அல்லது மருத்துவரை அணுகவும்"
    }
  ],
  "recommendedSpecialist": {
    "type": "நிபுணர் வகை (உதா: இதய மருத்துவர், தோல் மருத்துவர்)",
    "reason": "ஏன் இந்த நிபுணர் பரிந்துரைக்கப்படுகிறார்",
    "urgency": "குறைவு/நடுத்தரம்/அதிகம்/அவசரம்"
  },
  "urgencyLevel": "குறைவு/நடுத்தரம்/அதிகம்/அவசரம்",
  "disclaimer": "இந்த பகுப்பாய்வு தகவல் நோக்கங்களுக்காக மட்டுமே. சரியான நோயறிதல் மற்றும் சிகிச்சைக்கு மருத்துவ நிபுணரை அணுகவும்.",
  "generalAdvice": "அறிகுறிகளின் அடிப்படையில் விரிவான சுகாதார ஆலோசனை"
}

மேம்பட்ட பதில்களுக்கான வழிகாட்டுதல்கள்:
- அறிகுறிகளை பொருத்தமான மருத்துவ நிபுணர்களுடன் இணைக்கவும்
- சரியான மறுப்புகளுடன் பொதுவான மருந்தகத்தில் கிடைக்கும் மருந்துகளை மட்டுமே பரிந்துரைக்கவும்
- குறிப்பிட்ட, செயல்படக்கூடிய பரிந்துரைகளை வழங்கவும்
- விரிவான நிலை விளக்கங்களை சேர்க்கவும்
- நிபுணர் பரிந்துரைகளுக்கு அறிகுறி சேர்க்கைகளை கருத்தில் கொள்ளவும்
- எப்போதும் தொழில்முறை மருத்துவ ஆலோசனையை வலியுறுத்தவும்`
              : `You are an advanced medical AI assistant. You MUST respond with valid JSON only. No explanations, no markdown, no text outside the JSON structure.

IMPORTANT: This is for educational purposes only and should not replace professional medical advice.

You must analyze symptoms and return ONLY this exact JSON structure:
{
  "possibleConditions": [
    {
      "name": "Condition Name",
      "probability": "High/Medium/Low", 
      "description": "Detailed medical description with key symptoms"
    }
  ],
  "recommendedActions": [
    "Specific action 1",
    "Specific action 2", 
    "Specific action 3"
  ],
  "suggestedMedications": [
    {
      "name": "Medication Name",
      "type": "Over-the-counter",
      "purpose": "What it treats",
      "disclaimer": "Always consult pharmacist or doctor for proper dosage and usage"
    }
  ],
  "recommendedSpecialist": {
    "type": "Specialist Type (e.g., Cardiologist, Dermatologist)",
    "reason": "Why this specialist is recommended",
    "urgency": "Low/Medium/High/Emergency"
  },
  "urgencyLevel": "Low/Medium/High/Emergency",
  "disclaimer": "This analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis and treatment.",
  "generalAdvice": "Comprehensive health advice based on symptoms"
}

Guidelines for enhanced responses:
- Map symptoms to appropriate medical specialists
- Suggest only common over-the-counter medications with proper disclaimers
- Provide specific, actionable recommendations
- Include detailed condition descriptions
- Consider symptom combinations for specialist recommendations
- Always emphasize professional medical consultation`
          },
          {
            role: "user",
            content: language === "TAMIL"
              ? `இந்த அறிகுறிகளை பகுப்பாய்வு செய்து நிபுணர் பரிந்துரைகள் மற்றும் பாதுகாப்பான மருந்து பரிந்துரைகளுடன் மேம்பட்ட மருத்துவ வழிகாட்டுதலை வழங்கவும்: "${symptoms}"`
              : `Analyze these symptoms and provide enhanced medical guidance with specialist recommendations and safe medication suggestions: "${symptoms}"`
          }
        ],
        model: model.name,
        temperature: 0.1,
        max_tokens: model.maxTokens,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error(`No response from GROQ model ${model.name}`);
      }

      // Clean the response - remove any markdown formatting
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to parse JSON
      try {
        const result = JSON.parse(cleanedResponse);
        console.log(`✅ GROQ model ${model.name} succeeded!`);
        return result;
      } catch (parseError) {
        console.error(`❌ GROQ model ${model.name} JSON parsing failed:`, parseError.message);
        
        // If it's the last model, return structured fallback
        if (i === GROQ_MODELS.length - 1) {
          return {
            possibleConditions: [
              {
                name: "Analysis Available",
                probability: "Medium",
                description: cleanedResponse.substring(0, 150) + "..."
              }
            ],
            recommendedActions: [
              "Consult with a healthcare professional",
              "Monitor your symptoms closely",
              "Seek medical attention if symptoms worsen"
            ],
            urgencyLevel: "Medium",
            disclaimer: "This analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis and treatment.",
            generalAdvice: "Based on your symptoms, it's recommended to seek professional medical advice for proper evaluation."
          };
        }
        
        // Try next model
        continue;
      }
      
    } catch (error) {
      lastError = error;
      console.error(`❌ GROQ model ${model.name} failed:`, error.message);
      
      // If it's a rate limit error, try next model immediately
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        console.log(`🔄 Rate limit hit on ${model.name}, trying next model...`);
        continue;
      }
      
      // If it's the last model, throw the error
      if (i === GROQ_MODELS.length - 1) {
        throw error;
      }
      
      // Try next model
      continue;
    }
  }
  
  // This shouldn't be reached, but just in case
  throw lastError || new Error("All GROQ models failed");
};

// Gemini AI analysis function
const analyzeWithGemini = async (symptoms) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an advanced medical AI assistant. Analyze the following symptoms and provide an enhanced structured response.
  
  IMPORTANT: This is for educational purposes only and should not replace professional medical advice.
  
  Symptoms: "${symptoms}"
  
  Please provide a JSON response with the following enhanced structure:
  {
    "possibleConditions": [
      {
        "name": "Condition Name",
        "probability": "High/Medium/Low",
        "description": "Detailed medical description with key symptoms and characteristics"
      }
    ],
    "recommendedActions": [
      "Specific actionable recommendation 1",
      "Specific actionable recommendation 2",
      "Specific actionable recommendation 3"
    ],
    "suggestedMedications": [
      {
        "name": "Medication Name",
        "type": "Over-the-counter",
        "purpose": "What symptoms it treats",
        "disclaimer": "Always consult pharmacist or doctor for proper dosage and usage"
      }
    ],
    "recommendedSpecialist": {
      "type": "Specialist Type (e.g., Cardiologist, Dermatologist, Neurologist)",
      "reason": "Why this specialist is recommended based on symptoms",
      "urgency": "Low/Medium/High/Emergency"
    },
    "urgencyLevel": "Low/Medium/High/Emergency",
    "disclaimer": "This analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis and treatment.",
    "generalAdvice": "Comprehensive health advice based on symptoms"
  }
  
  Enhanced Guidelines:
  - Map symptoms to appropriate medical specialists (Cardiologist for chest pain, Dermatologist for skin issues, etc.)
  - Suggest only common over-the-counter medications with proper disclaimers
  - Provide specific, actionable recommendations
  - Include detailed condition descriptions with medical context
  - Consider symptom combinations for accurate specialist recommendations
  - Always emphasize professional medical consultation
  - Focus on practical, safe medical guidance
  
  Return only valid JSON without any markdown formatting.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  // Clean the response similar to GROQ
  let cleanedResponse = response.trim();
  
  // Remove markdown code blocks if present
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(cleanedResponse);
  } catch (parseError) {
    console.error("Gemini JSON parsing failed. Raw response:", response);
    
    // If JSON parsing fails, create a structured response
    return {
      possibleConditions: [
        {
          name: "Analysis Available",
          probability: "Medium",
          description: cleanedResponse.substring(0, 150) + "..."
        }
      ],
      recommendedActions: [
        "Consult with a healthcare professional",
        "Monitor your symptoms closely",
        "Seek medical attention if symptoms worsen"
      ],
      urgencyLevel: "Medium",
      disclaimer: "This analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis and treatment.",
      generalAdvice: "Based on your symptoms, it's recommended to seek professional medical advice for proper evaluation."
    };
  }
};

// Fallback analysis for when AI is unavailable
const getFallbackAnalysis = (symptoms) => {
  const symptomsLower = symptoms.toLowerCase();
  
  // Simple keyword-based analysis as fallback
  let urgencyLevel = "Medium";
  let possibleConditions = [];
  let recommendedActions = [
    "Monitor your symptoms closely",
    "Stay hydrated and get adequate rest",
    "Consult a healthcare professional if symptoms persist or worsen",
    "Seek immediate medical attention if you experience severe symptoms"
  ];

  // Emergency keywords
  if (symptomsLower.includes("chest pain") || 
      symptomsLower.includes("difficulty breathing") || 
      symptomsLower.includes("severe pain") ||
      symptomsLower.includes("unconscious") ||
      symptomsLower.includes("bleeding heavily")) {
    urgencyLevel = "Emergency";
    possibleConditions.push({
      name: "Emergency Condition Suspected",
      probability: "High",
      description: "Your symptoms may indicate a serious condition requiring immediate medical attention."
    });
    recommendedActions = [
      "Seek immediate emergency medical care",
      "Call emergency services if symptoms are severe",
      "Do not delay medical treatment"
    ];
  }
  // High urgency keywords
  else if (symptomsLower.includes("high fever") || 
           symptomsLower.includes("severe headache") ||
           symptomsLower.includes("persistent vomiting") ||
           symptomsLower.includes("severe abdominal pain")) {
    urgencyLevel = "High";
    possibleConditions.push({
      name: "Condition Requiring Medical Attention",
      probability: "Medium",
      description: "Your symptoms suggest you should consult a healthcare provider soon."
    });
  }
  // Common conditions
  else if (symptomsLower.includes("fever") || symptomsLower.includes("headache") || symptomsLower.includes("cough")) {
    possibleConditions.push({
      name: "Common Illness",
      probability: "Medium",
      description: "Your symptoms are consistent with common conditions like cold, flu, or viral infection."
    });
  }
  else {
    possibleConditions.push({
      name: "General Symptoms",
      probability: "Low",
      description: "Your symptoms require professional medical evaluation for proper diagnosis."
    });
  }

  // Add basic medication suggestions for common symptoms
  let suggestedMedications = [];
  let recommendedSpecialist = null;

  if (symptomsLower.includes("fever") || symptomsLower.includes("temperature")) {
    suggestedMedications.push({
      name: "Paracetamol/Acetaminophen",
      type: "Over-the-counter",
      dosage: "500mg every 6 hours (max 4g/day)",
      purpose: "Reduces fever and relieves pain",
      disclaimer: "Always consult pharmacist or doctor before taking"
    });
  }

  if (symptomsLower.includes("headache") || symptomsLower.includes("head pain")) {
    suggestedMedications.push({
      name: "Ibuprofen",
      type: "Over-the-counter", 
      dosage: "200-400mg every 6-8 hours",
      purpose: "Relieves headache and reduces inflammation",
      disclaimer: "Always consult pharmacist or doctor before taking"
    });
    recommendedSpecialist = {
      type: "Neurologist",
      reason: "For persistent or severe headaches evaluation",
      urgency: urgencyLevel
    };
  }

  if (symptomsLower.includes("chest pain") || symptomsLower.includes("heart")) {
    recommendedSpecialist = {
      type: "Cardiologist",
      reason: "For chest pain and heart-related symptoms evaluation",
      urgency: "Emergency"
    };
  }

  if (symptomsLower.includes("skin") || symptomsLower.includes("rash") || symptomsLower.includes("itch")) {
    recommendedSpecialist = {
      type: "Dermatologist", 
      reason: "For skin-related symptoms evaluation",
      urgency: urgencyLevel
    };
  }

  return {
    possibleConditions,
    recommendedActions,
    suggestedMedications,
    recommendedSpecialist,
    urgencyLevel,
    disclaimer: "This analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis and treatment.",
    generalAdvice: "Based on your symptoms, it's recommended to seek professional medical advice for proper evaluation. This fallback analysis was provided due to temporary AI service unavailability.",
    fallbackUsed: true
  };
};

const analyzeSymptoms = async (symptoms) => {
  // PHASE 0: Detect language
  console.log("🌐 Detecting language...");
  const language = await detectLanguage(symptoms);
  console.log(`✅ Language detected: ${language}`);
  
  // PHASE 1: Check if input is medically relevant
  console.log("🔍 Checking medical relevance...");
  const isMedical = await checkMedicalRelevance(symptoms);
  
  if (!isMedical) {
    console.log("❌ Non-medical query detected, declining to analyze");
    return {
      possibleConditions: [],
      recommendedActions: [],
      suggestedMedications: [],
      recommendedSpecialist: null,
      urgencyLevel: "N/A",
      disclaimer: language === "TAMIL" 
        ? "நான் சுகாதாரம் மற்றும் மருத்துவம் தொடர்பான அறிகுறிகளுக்கு மட்டுமே பகுப்பாய்வு வழங்க முடியும். மருத்துவ வழிகாட்டுதலுக்கு உங்கள் சுகாதார கவலைகள் அல்லது அறிகுறிகளை விவரிக்கவும்."
        : "I can only provide analysis for health and medical-related symptoms. Please describe your health concerns or symptoms for medical guidance.",
      generalAdvice: language === "TAMIL"
        ? "இந்த அமைப்பு குறிப்பாக மருத்துவ அறிகுறி பகுப்பாய்விற்காக வடிவமைக்கப்பட்டுள்ளது. மருத்துவம் அல்லாத கேள்விகளுக்கு, தகுந்த ஆதாரங்கள் அல்லது நிபுணர்களை அணுகவும்."
        : "This system is designed specifically for medical symptom analysis. For non-medical questions, please consult appropriate resources or professionals.",
      aiProvider: "Medical Filter",
      nonMedicalQuery: true,
      language: language
    };
  }
  
  console.log("✅ Medical query confirmed, proceeding with analysis");
  
  let lastGeminiError = null;
  let lastGroqError = null;
  
  // PHASE 2: Try GROQ AI first (FAST!)
  console.log(`🟢 Starting analysis with GROQ AI (fast mode) in ${language}...`);
  for (let attempt = 0; attempt <= 2; attempt++) { // 2 retries for GROQ
    try {
      const analysis = await analyzeWithGroq(symptoms, language);
      console.log(`✅ GROQ analysis successful on attempt ${attempt + 1} (⚡ FAST!)`);
      return { ...analysis, aiProvider: "GROQ", language: language };
    } catch (error) {
      lastGroqError = error;
      console.error(`❌ GROQ analysis failed on attempt ${attempt + 1}:`, error.message);
      
      // Retry GROQ with short delay
      if (attempt < 2) {
        const delay = 500 * (attempt + 1); // 500ms, 1s (very fast retries)
        console.log(`⏳ Retrying GROQ in ${delay}ms... (attempt ${attempt + 2}/3)`);
        await sleep(delay);
        continue;
      }
      
      break;
    }
  }
  
  // PHASE 2: GROQ failed, try Gemini AI as backup
  console.log("🔵 GROQ failed, switching to Gemini AI (slower backup)...");
  for (let attempt = 0; attempt <= 2; attempt++) { // Reduced retries for Gemini
    try {
      const analysis = await analyzeWithGemini(symptoms);
      console.log(`✅ Gemini analysis successful on attempt ${attempt + 1}`);
      return { ...analysis, aiProvider: "Gemini" };
    } catch (error) {
      lastGeminiError = error;
      console.error(`❌ Gemini analysis failed on attempt ${attempt + 1}:`, error.message);
      
      // Shorter retry for Gemini since it's backup
      if (attempt < 2) {
        const delay = 1000 * (attempt + 1); // 1s, 2s
        console.log(`⏳ Retrying Gemini in ${delay}ms... (attempt ${attempt + 2}/3)`);
        await sleep(delay);
        continue;
      }
      
      break;
    }
  }
  
  // PHASE 3: Both AI providers failed, use keyword-based fallback
  console.log(`🔄 Both GROQ and Gemini failed, using keyword-based fallback`);
  console.error("Final GROQ error:", lastGroqError?.message);
  console.error("Final Gemini error:", lastGeminiError?.message);
  
  return { ...getFallbackAnalysis(symptoms), aiProvider: "Fallback" };
};

module.exports = {
  analyzeSymptoms,
};
