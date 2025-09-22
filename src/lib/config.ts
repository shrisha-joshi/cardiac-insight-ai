// Configuration for the heart attack prediction application

export const config = {
  // ML API Configuration (fallback to mock data if not available)
  mlApi: {
    baseUrl: import.meta.env.VITE_ML_API_URL || 'http://localhost:8000/api',
    timeout: 30000,
    retries: 3
  },
  
  // AI Chat Configuration (uses rule-based fallback)
  ai: {
    providers: {
      openai: {
        enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        maxTokens: 1000
      },
      gemini: {
        enabled: !!import.meta.env.VITE_GOOGLE_GEMINI_API_KEY,
        apiKey: import.meta.env.VITE_GOOGLE_GEMINI_API_KEY,
        model: 'gemini-pro'
      },
      huggingface: {
        enabled: false, // Set to true when API keys are configured
        apiKey: import.meta.env.VITE_HUGGING_FACE_API_KEY
      }
    },
    fallbackEnabled: true // Always use rule-based responses for medical safety
  },
  
  // Medical disclaimers and safety settings
  medical: {
    enableStrictDisclaimers: true,
    emergencyNumbers: {
      us: '911',
      uk: '999',
      eu: '112',
      canada: '911',
      australia: '000'
    }
  },
  
  // Feature flags
  features: {
    mlPrediction: true,
    chatbot: true,
    medicalHistory: true,
    datasetUpload: true,
    profileManagement: true,
    enhancedAI: true // For Gemini and OpenAI enhanced suggestions
  }
};

export default config;