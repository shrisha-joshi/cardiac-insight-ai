/**
 * API Error Handler Middleware
 * 
 * Comprehensive error handling for API responses with retry logic,
 * error classification, and user-friendly message generation.
 * 
 * Created: November 4, 2025
 */

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  userMessage: string;
  details?: Record<string, unknown>;
  timestamp: string;
  retryable: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * API error types
 */
export enum ApiErrorType {
  // Network errors
  NetworkError = 'NETWORK_ERROR',
  Timeout = 'TIMEOUT',
  ConnectionRefused = 'CONNECTION_REFUSED',

  // Client errors
  BadRequest = 'BAD_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  ValidationError = 'VALIDATION_ERROR',

  // Server errors
  InternalServer = 'INTERNAL_SERVER',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
  BadGateway = 'BAD_GATEWAY',

  // Application errors
  RateLimited = 'RATE_LIMITED',
  Unknown = 'UNKNOWN',
}

/**
 * Get error type from status code
 */
function getErrorType(statusCode?: number): ApiErrorType {
  switch (statusCode) {
    case 400:
      return ApiErrorType.BadRequest;
    case 401:
      return ApiErrorType.Unauthorized;
    case 403:
      return ApiErrorType.Forbidden;
    case 404:
      return ApiErrorType.NotFound;
    case 429:
      return ApiErrorType.RateLimited;
    case 500:
      return ApiErrorType.InternalServer;
    case 502:
      return ApiErrorType.BadGateway;
    case 503:
      return ApiErrorType.ServiceUnavailable;
    default:
      return ApiErrorType.Unknown;
  }
}

/**
 * User-friendly error messages
 */
const USER_FRIENDLY_MESSAGES: Record<ApiErrorType, string> = {
  [ApiErrorType.NetworkError]:
    'Unable to connect to the server. Please check your internet connection.',
  [ApiErrorType.Timeout]:
    'The request took too long. Please try again.',
  [ApiErrorType.ConnectionRefused]:
    'The server is not responding. Please try again later.',
  [ApiErrorType.BadRequest]:
    'Invalid request. Please check your input and try again.',
  [ApiErrorType.Unauthorized]:
    'You need to log in to perform this action.',
  [ApiErrorType.Forbidden]:
    'You do not have permission to perform this action.',
  [ApiErrorType.NotFound]:
    'The requested resource was not found.',
  [ApiErrorType.ValidationError]:
    'Please check your input and try again.',
  [ApiErrorType.InternalServer]:
    'An unexpected error occurred. Please try again later.',
  [ApiErrorType.ServiceUnavailable]:
    'The service is temporarily unavailable. Please try again later.',
  [ApiErrorType.BadGateway]:
    'The service is temporarily unavailable. Please try again later.',
  [ApiErrorType.RateLimited]:
    'Too many requests. Please wait a moment before trying again.',
  [ApiErrorType.Unknown]:
    'An unexpected error occurred. Please try again.',
};

/**
 * Check if error is retryable
 */
export function isErrorRetryable(error: unknown): boolean {
  if (!error) return false;

  // Network errors are retryable
  const errorObj = error as Record<string, unknown>;
  if (errorObj.code === 'ECONNABORTED' || errorObj.code === 'ENOTFOUND') {
    return true;
  }

  // Timeout errors are retryable
  const errorMsg = errorObj.message;
  if (typeof errorMsg === 'string' && errorMsg.includes('timeout')) {
    return true;
  }

  // Check status code
  const response = errorObj.response as Record<string, unknown> | undefined;
  const status = (response?.status as number) || (errorObj.statusCode as number);
  if (status) {
    // Retryable status codes: 408, 429, 500, 502, 503, 504
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  retryCount: number,
  config: RetryConfig
): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, retryCount),
    config.maxDelay
  );

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.round(delay + jitter);
}

/**
 * Format API error response
 */
export function formatApiError(error: unknown): ApiErrorResponse {
  const errorObj = error as Record<string, unknown>;
  const response = errorObj.response as Record<string, unknown> | undefined;
  const statusCode = (response?.status as number) || (errorObj.statusCode as number) || 0;
  const errorType = getErrorType(statusCode);

  // Extract error details from response
  const responseData = (response?.data as Record<string, unknown>) || {};
  const errorCode = (responseData.code as string) || errorType;
  const errorMessage = (responseData.message as string) || (errorObj.message as string) || 'Unknown error';

  return {
    code: errorCode,
    message: errorMessage,
    statusCode,
    userMessage: USER_FRIENDLY_MESSAGES[errorType],
    details: (responseData.details as Record<string, unknown>) || {},
    timestamp: new Date().toISOString(),
    retryable: isErrorRetryable(error),
  };
}

/**
 * API error handler with retry logic
 */
export async function apiErrorHandler<T>(
  operation: () => Promise<T>,
  retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isErrorRetryable(error) || attempt === retryConfig.maxRetries) {
        throw formatApiError(error);
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, retryConfig);
      if (import.meta.env.DEV) console.warn(
        `API request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}). ` +
        `Retrying in ${delay}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw formatApiError(lastError);
}

/**
 * Validate API response
 */
export function validateApiResponse<T>(
  response: unknown,
  expectedFields?: string[]
): response is T {
  if (!response || typeof response !== 'object') return false;

  if (expectedFields) {
    return expectedFields.every(field => field in (response as object));
  }

  return true;
}

/**
 * Safe API call wrapper
 */
export async function safeApiCall<T>(
  operation: () => Promise<T>,
  onError?: (error: ApiErrorResponse) => void
): Promise<T | null> {
  try {
    return await apiErrorHandler(operation);
  } catch (error) {
    const formattedError = formatApiError(error);
    if (import.meta.env.DEV) console.error('API Error:', formattedError);
    onError?.(formattedError);
    return null;
  }
}

/**
 * API request interceptor
 */
export function createApiInterceptor(baseURL?: string) {
  return {
    onRequest: (config: unknown) => {
      // Add request timestamp for timeout tracking
      const configObj = config as Record<string, unknown>;
      configObj.metadata = { startTime: Date.now() };
      return config;
    },

    onResponse: (response: unknown) => {
      // Track response time
      const responseObj = response as Record<string, unknown>;
      const configObj = responseObj.config as Record<string, unknown> | undefined;
      const metadata = configObj?.metadata as Record<string, unknown> | undefined;
      const duration = Date.now() - ((metadata?.startTime as number) || 0);
      if (import.meta.env.DEV) console.debug(`API Response: ${String(configObj?.method).toUpperCase()} ${configObj?.url} (${duration}ms)`);
      return response;
    },

    onError: (error: unknown) => {
      const errorObj = error as Record<string, unknown>;
      const configObj = errorObj.config as Record<string, unknown> | undefined;
      const responseObj = errorObj.response as Record<string, unknown> | undefined;
      const metadata = configObj?.metadata as Record<string, unknown> | undefined;
      const duration = Date.now() - ((metadata?.startTime as number) || 0);
      if (import.meta.env.DEV) console.error(
        `API Error: ${String(configObj?.method).toUpperCase()} ${configObj?.url} ` +
        `(${responseObj?.status || 'network error'}, ${duration}ms)`
      );
      return Promise.reject(formatApiError(error));
    },
  };
}

/**
 * Batch API requests handler
 */
export async function batchApiCalls<T>(
  operations: Array<() => Promise<T>>,
  concurrency: number = 3
): Promise<Array<T | ApiErrorResponse>> {
  const results: Array<T | ApiErrorResponse> = [];
  const executing: Promise<unknown>[] = [];

  for (const operation of operations) {
    const promise = Promise.resolve()
      .then(() => safeApiCall(operation))
      .then(result => {
        if (result) {
          results.push(result);
        } else {
          results.push({
            code: 'UNKNOWN',
            message: 'Failed',
            statusCode: 0,
            userMessage: 'Operation failed',
            timestamp: new Date().toISOString(),
            retryable: true,
          } as ApiErrorResponse);
        }
      })
      .catch(error => {
        results.push(formatApiError(error));
      });

    executing.push(promise);

    // Maintain concurrency limit
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
        this.failureCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

export default {
  ApiErrorType,
  formatApiError,
  apiErrorHandler,
  isErrorRetryable,
  calculateBackoffDelay,
  validateApiResponse,
  safeApiCall,
  createApiInterceptor,
  batchApiCalls,
  CircuitBreaker,
};
