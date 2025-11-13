/**
 * CENTRALIZED ERROR MESSAGES & STANDARDIZATION
 * Single source of truth for user-facing messages across the application
 * 
 * This consolidates error messages from multiple locations:
 * - Standardized error messages for validation
 * - Consistent formatting and tone
 * - Easy to update all messages in one place
 */

export const ErrorMessages = {
  // REQUIRED FIELD ERRORS
  REQUIRED: {
    age: 'Age is required',
    gender: 'Gender is required',
    restingBP: 'Resting blood pressure is required',
    cholesterol: 'Cholesterol level is required',
    maxHR: 'Maximum heart rate is required',
  },

  // BOUNDARY ERRORS
  BOUNDARY: {
    age: (value: number) => `Age must be between 18 and 130 (got ${value})`,
    restingBP: (value: number) => `Blood pressure must be between 40 and 300 mmHg (got ${value})`,
    cholesterol: (value: number) => `Cholesterol must be between 0 and 500 mg/dL (got ${value})`,
    maxHR: (value: number) => `Heart rate must be between 60 and 250 bpm (got ${value})`,
    stressLevel: (value: number) => `Stress level must be between 1 and 10 (got ${value})`,
    sleepHours: (value: number) => `Sleep hours must be between 0 and 24 (got ${value})`,
  },

  // LOGIC ERRORS
  LOGIC: {
    bpInversion: 'Systolic BP must be greater than or equal to diastolic BP',
    hrInversion: 'Maximum HR must be greater than resting HR',
    cholesterolInconsistency: 'Cholesterol components don\'t add up correctly',
    conflictingData: 'Conflicting or suspicious data detected',
  },

  // API ERRORS
  API: {
    timeout: 'Request took too long. Please try again.',
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unauthorized: 'You are not authorized to perform this action.',
    forbidden: 'You do not have permission to access this resource.',
    notFound: 'Resource not found.',
    conflictError: 'Resource already exists.',
    rateLimited: 'Too many requests. Please wait a moment and try again.',
    badRequest: 'Invalid request. Please check your input.',
  },

  // DATABASE ERRORS
  DATABASE: {
    saveError: 'Failed to save data to database.',
    loadError: 'Failed to load data from database.',
    updateError: 'Failed to update data in database.',
    deleteError: 'Failed to delete data from database.',
    connectionError: 'Cannot connect to database. Please try again.',
  },

  // AUTHENTICATION ERRORS
  AUTH: {
    invalidCredentials: 'Invalid email or password.',
    userNotFound: 'User not found.',
    userExists: 'User already exists with this email.',
    sessionExpired: 'Your session has expired. Please log in again.',
    signupFailed: 'Failed to create account. Please try again.',
    signinFailed: 'Failed to sign in. Please try again.',
  },

  // ML/PREDICTION ERRORS
  PREDICTION: {
    insufficientData: 'Insufficient data for accurate prediction.',
    modelError: 'Error in prediction model. Please try again.',
    invalidInput: 'Invalid input data for prediction.',
  },

  // CLINICAL WARNINGS
  CLINICAL: {
    highRisk: 'High cardiac risk detected. Urgent medical evaluation recommended.',
    severeHypertension: 'Severe hypertension detected. Immediate medical attention needed.',
    exerciseAngina: 'Exercise-induced chest pain reported. Cardiology evaluation essential.',
    previousMI: 'Previous heart attack history. Close follow-up required.',
  },
};

export const SuccessMessages = {
  predictionCreated: 'Prediction successfully created and saved.',
  dataSaved: 'Your data has been successfully saved.',
  accountCreated: 'Account created successfully. Welcome!',
  signinSuccess: 'Signed in successfully.',
  signoutSuccess: 'Signed out successfully.',
  profileUpdated: 'Profile updated successfully.',
  historyCleared: 'Prediction history cleared.',
  feedbackSubmitted: 'Thank you for your feedback.',
};

export const WarningMessages = {
  largeAge: (age: number) => `Age ${age} is unusually high. Please verify.`,
  unusualBP: (bp: number) => `Blood pressure ${bp} is unusual. Please verify.`,
  lowHDL: 'Low HDL cholesterol increases cardiovascular risk.',
  highLDL: 'High LDL cholesterol increases cardiovascular risk.',
  smokingRisk: 'Smoking significantly increases cardiovascular risk.',
  diabetesRisk: 'Diabetes is a major risk factor for heart disease.',
  sedentaryLifestyle: 'Lack of physical activity increases cardiovascular risk.',
  poorSleep: 'Insufficient sleep can negatively impact cardiovascular health.',
  highStress: 'High stress levels may increase cardiovascular risk.',
};

export const InfoMessages = {
  youngAge: 'Young patients typically have lower cardiovascular risk.',
  excellentProfile: 'Excellent health profile detected.',
  lowRisk: 'Low cardiovascular risk based on current assessment.',
  dataProcessing: 'Processing your data...',
  loadingHistory: 'Loading your prediction history...',
  savingToDatabase: 'Saving your prediction to database...',
};

/**
 * Get appropriate error message with context
 */
export function getErrorMessage(
  errorType: string,
  context?: Record<string, unknown>
): string {
  // Simple lookup for generic errors
  const parts = errorType.split('.');
  let message = (ErrorMessages as unknown);

  for (const part of parts) {
    if (message[part]) {
      message = message[part];
    } else {
      return `An error occurred: ${errorType}`;
    }
  }

  // If it's a function, call it with context
  if (typeof message === 'function') {
    return String(message(context?.value || context));
  }

  return String(message) || 'An unexpected error occurred.';
}

/**
 * Format error for display to user
 */
export function formatErrorForDisplay(error: Error | string): string {
  if (typeof error === 'string') {
    return error;
  }

  // Extract meaningful message from error
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Format multiple errors for display
 */
export function formatMultipleErrors(errors: (string | Error)[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return formatErrorForDisplay(errors[0]);

  return errors
    .map((err, idx) => `${idx + 1}. ${formatErrorForDisplay(err)}`)
    .join('\n');
}

/**
 * Log error for debugging (server-side)
 */
export function logErrorForDebugging(
  context: string,
  error: Error | string,
  additionalData?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) console.error(`[${context}]`, {
    error: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    ...additionalData,
  });
}

/**
 * Create consistent error response object
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: Record<string, unknown>
) {
  return {
    success: false,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      ...details,
    },
  };
}

/**
 * Create consistent success response object
 */
export function createSuccessResponse(
  data?: unknown,
  message?: string
) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}
