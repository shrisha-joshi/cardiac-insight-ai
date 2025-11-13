/**
 * Custom Error Types and Error Handling System
 * 
 * Provides comprehensive error typing, consistent error handling,
 * and user-friendly error messages across the entire application.
 * 
 * Created: November 4, 2025
 */

// ============================================================================
// ERROR TYPE HIERARCHY
// ============================================================================

/**
 * Base class for all application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public context: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return `Error: ${this.message}`;
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      true,
      context
    );
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  getUserMessage(): string {
    return `Invalid input: ${this.message}`;
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      401,
      true,
      context
    );
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }

  getUserMessage(): string {
    return 'Please sign in to continue';
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'You do not have permission',
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      true,
      context
    );
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }

  getUserMessage(): string {
    return 'You do not have permission to perform this action';
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    context?: Record<string, unknown>
  ) {
    super(
      `${resource} not found`,
      'NOT_FOUND_ERROR',
      404,
      true,
      context
    );
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  getUserMessage(): string {
    return this.message;
  }
}

/**
 * AI/ML Service errors
 */
export class AIServiceError extends AppError {
  constructor(
    message: string,
    provider: 'gemini' | 'openai' | 'fallback',
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'AI_SERVICE_ERROR',
      503,
      true,
      { provider, ...context }
    );
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }

  getUserMessage(): string {
    const provider = this.context.provider as string;
    return `Unable to get AI recommendations from ${provider}. Using fallback recommendations instead.`;
  }
}

/**
 * ML Model errors
 */
export class MLError extends AppError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'ML_ERROR',
      500,
      true,
      context
    );
    Object.setPrototypeOf(this, MLError.prototype);
  }

  getUserMessage(): string {
    return 'Unable to calculate risk assessment. Please try again or contact support.';
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    operation: string = 'database operation',
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'DATABASE_ERROR',
      503,
      true,
      { operation, ...context }
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  getUserMessage(): string {
    return 'Database operation failed. Please try again later.';
  }
}

/**
 * API/Network errors
 */
export class APIError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'API_ERROR',
      statusCode,
      true,
      context
    );
    Object.setPrototypeOf(this, APIError.prototype);
  }

  getUserMessage(): string {
    if (this.statusCode === 408 || this.statusCode === 504) {
      return 'Request timeout. Please check your internet connection and try again.';
    }
    if (this.statusCode === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (this.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    return this.message;
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  constructor(
    operation: string = 'Operation',
    timeout: number = 0,
    context?: Record<string, unknown>
  ) {
    super(
      `${operation} timed out after ${timeout}ms`,
      'TIMEOUT_ERROR',
      504,
      true,
      { operation, timeout, ...context }
    );
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }

  getUserMessage(): string {
    return 'Request took too long. Please check your connection and try again.';
  }
}

/**
 * File/PDF generation errors
 */
export class FileError extends AppError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'FILE_ERROR',
      500,
      true,
      context
    );
    Object.setPrototypeOf(this, FileError.prototype);
  }

  getUserMessage(): string {
    return 'Failed to generate file. Please try again.';
  }
}

/**
 * Configuration errors (non-operational)
 */
export class ConfigError extends AppError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'CONFIG_ERROR',
      500,
      false, // Not operational - should not continue
      context
    );
    Object.setPrototypeOf(this, ConfigError.prototype);
  }

  getUserMessage(): string {
    return 'Application configuration error. Please contact support.';
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  logError?: boolean;
  notifyUser?: boolean;
  sendToMonitoring?: boolean;
  fallback?: (error: unknown) => void;
}

/**
 * Create a timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(operation, timeoutMs)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: unknown;
  let delayMs = initialDelayMs;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        onRetry?.(attempt + 1, error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): error is AppError {
  return isAppError(error) && error.isOperational;
}

/**
 * Log error with context
 */
export interface ErrorLogger {
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

export const defaultLogger: ErrorLogger = {
  error: (message, context) => {
    if (import.meta.env.DEV) console.error(`[ERROR] ${message}`, context ? JSON.stringify(context, null, 2) : '');
  },
  warn: (message, context) => {
    if (import.meta.env.DEV) console.warn(`[WARN] ${message}`, context ? JSON.stringify(context, null, 2) : '');
  },
  info: (message, context) => {
    if (import.meta.env.DEV) console.info(`[INFO] ${message}`, context ? JSON.stringify(context, null, 2) : '');
  },
  debug: (message, context) => {
    if (process.env.NODE_ENV === 'development') {
      if (import.meta.env.DEV) console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  },
};

/**
 * Global error handler
 */
export class ErrorHandler {
  private static logger: ErrorLogger = defaultLogger;
  private static errorCallbacks: Array<(error: AppError) => void> = [];

  /**
   * Set custom logger
   */
  static setLogger(logger: ErrorLogger): void {
    this.logger = logger;
  }

  /**
   * Register error callback
   */
  static onError(callback: (error: AppError) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Handle error with logging and callbacks
   */
  static handle(
    error: unknown,
    context: string = 'Unknown context',
    options: ErrorHandlerOptions = {}
  ): AppError {
    // Convert unknown errors to AppError
    const appError = isAppError(error) ? error : this.normalizeError(error, context);

    // Add context
    appError.context = { ...appError.context, sourceContext: context };

    // Log error
    if (options.logError !== false) {
      this.logger.error(`[${appError.code}] ${appError.message}`, appError.context);
    }

    // Execute callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(appError);
      } catch (callbackError) {
        this.logger.error('Error in error callback', { error: callbackError });
      }
    });

    // Execute fallback handler
    if (options.fallback) {
      try {
        options.fallback(appError);
      } catch (fallbackError) {
        this.logger.error('Error in fallback handler', { error: fallbackError });
      }
    }

    return appError;
  }

  /**
   * Normalize unknown errors to AppError
   */
  private static normalizeError(error: unknown, context: string): AppError {
    if (error instanceof Error) {
      return new AppError(
        error.message,
        'UNKNOWN_ERROR',
        500,
        true,
        { originalError: error.name, originalStack: error.stack }
      );
    }

    if (typeof error === 'string') {
      return new AppError(error, 'UNKNOWN_ERROR', 500, true, {});
    }

    if (typeof error === 'object' && error !== null) {
      return new AppError(
        JSON.stringify(error),
        'UNKNOWN_ERROR',
        500,
        true,
        error as Record<string, unknown>
      );
    }

    return new AppError('Unknown error occurred', 'UNKNOWN_ERROR', 500, true, {} as Record<string, unknown>);
  }
}

// ============================================================================
// ERROR MESSAGE TEMPLATES
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication
  SIGNIN_REQUIRED: 'Please sign in to access this feature',
  SIGNUP_REQUIRED: 'Please create an account to continue',
  INVALID_CREDENTIALS: 'Invalid username or password',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',

  // Validation
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_AGE: 'Age must be between 18 and 120',
  MISSING_REQUIRED_FIELD: 'Please fill in all required fields',
  INVALID_DATA_TYPE: 'Invalid data type',
  VALUE_OUT_OF_RANGE: 'Value is out of acceptable range',

  // AI/ML
  AI_SERVICE_UNAVAILABLE: 'AI service is currently unavailable',
  ML_PREDICTION_FAILED: 'Unable to calculate risk prediction',
  RECOMMENDATION_FAILED: 'Failed to generate recommendations',

  // Database
  DB_CONNECTION_FAILED: 'Database connection failed',
  DB_QUERY_FAILED: 'Database query failed',
  DB_TRANSACTION_FAILED: 'Database transaction failed',

  // Network
  NETWORK_ERROR: 'Network connection error',
  REQUEST_TIMEOUT: 'Request timed out',
  API_ERROR: 'API error occurred',

  // File
  PDF_GENERATION_FAILED: 'Failed to generate PDF report',
  FILE_DOWNLOAD_FAILED: 'Failed to download file',
  FILE_UPLOAD_FAILED: 'Failed to upload file',

  // Generic
  UNEXPECTED_ERROR: 'An unexpected error occurred',
  TRY_AGAIN_LATER: 'Please try again later',
  CONTACT_SUPPORT: 'Please contact support for assistance',
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  AIServiceError,
  MLError,
  DatabaseError,
  APIError,
  TimeoutError,
  FileError,
  ConfigError,
  withTimeout,
  withRetry,
  isAppError,
  isOperationalError,
  ErrorHandler,
  ERROR_MESSAGES,
};
