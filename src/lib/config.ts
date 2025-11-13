// Configuration for the heart attack prediction application
// All environment variables are optional - app has graceful fallbacks

export const config = {
  // Application Information
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Cardiac Insight AI',
    environment: import.meta.env.VITE_ENV || 'development',
    debug: import.meta.env.VITE_DEBUG_MODE === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info'
  },

  // ML API Configuration (optional - uses local model if not available)
  mlApi: {
    baseUrl: import.meta.env.VITE_ML_API_URL || '',
    timeout: parseInt(import.meta.env.VITE_ML_API_TIMEOUT || '30000'),
    retries: parseInt(import.meta.env.VITE_ML_API_RETRIES || '3'),
    enabled: !!import.meta.env.VITE_ML_API_URL
  },

  // AI Providers Configuration
  ai: {
    // Google Gemini API Configuration
    gemini: {
      enabled: import.meta.env.VITE_ENABLE_GEMINI === 'true' && 
               !!import.meta.env.VITE_GOOGLE_GEMINI_API_KEY,
      apiKey: import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || '',
      model: import.meta.env.VITE_GOOGLE_GEMINI_MODEL || 'gemini-pro'
    },

    // OpenAI GPT Configuration
    openai: {
      enabled: import.meta.env.VITE_ENABLE_OPENAI === 'true' && 
               !!import.meta.env.VITE_OPENAI_API_KEY,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '1000')
    },

    // Rule-based Fallback (always available)
    fallback: {
      enabled: import.meta.env.VITE_ENABLE_FALLBACK === 'true'
    }
  },

  // Medical Safety Configuration
  medical: {
    enableStrictDisclaimers: true,
    requireUserConsent: true,
    emergencyNumbers: {
      india: '108',
      us: '911',
      uk: '999',
      eu: '112',
      canada: '911',
      australia: '000',
      singapore: '995'
    }
  },

  // Feature Flags
  features: {
    mlPrediction: true,
    chatbot: true,
    medicalHistory: import.meta.env.VITE_ENABLE_MEDICAL_HISTORY !== 'false',
    datasetUpload: import.meta.env.VITE_ENABLE_DATASET_UPLOAD !== 'false',
    profileManagement: true,
    enhancedAI: import.meta.env.VITE_ENABLE_ENHANCED_AI !== 'false',
    pdfExport: true,
    aiRecommendations: true
  },

  // API Configuration
  api: {
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000')
  },

  // Storage Configuration
  storage: {
    maxHistoryRecords: parseInt(import.meta.env.VITE_MAX_HISTORY_RECORDS || '50'),
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },

  // Security Configuration
  security: {
    jwtExpiry: parseInt(import.meta.env.VITE_JWT_EXPIRY || '3600'),
    refreshTokenExpiry: parseInt(import.meta.env.VITE_REFRESH_TOKEN_EXPIRY || '604800')
  }
};

/**
 * Helper function to check if AI is available
 */
export const isAIAvailable = (): boolean => {
  return config.ai.gemini.enabled || config.ai.openai.enabled || config.ai.fallback.enabled;
};

/**
 * Helper function to get available AI providers
 */
export const getAvailableAIProviders = (): string[] => {
  const providers: string[] = [];
  if (config.ai.gemini.enabled) providers.push('Gemini');
  if (config.ai.openai.enabled) providers.push('OpenAI');
  if (config.ai.fallback.enabled) providers.push('Rule-based');
  return providers;
};

/**
 * Helper function to check if ML API is available
 */
export const isMLAPIAvailable = (): boolean => {
  return config.mlApi.enabled;
};

/**
 * Log configuration status (for debugging)
 */
export const logConfigStatus = (): void => {
  if (config.app.debug && import.meta.env.DEV) {
    if (import.meta.env.DEV) console.log('=== Cardiac Insight AI Configuration ===');
    if (import.meta.env.DEV) console.log(`Environment: ${config.app.environment}`);
    if (import.meta.env.DEV) console.log(`AI Providers: ${getAvailableAIProviders().join(', ')}`);
    if (import.meta.env.DEV) console.log(`ML API Available: ${isMLAPIAvailable()}`);
    if (import.meta.env.DEV) console.log(`Features Enabled:`, config.features);
    if (import.meta.env.DEV) console.log('========================================');
  }
};

export default config;