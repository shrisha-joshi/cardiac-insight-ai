/**
 * CENTRALIZED API CLIENT
 * Single point for all API calls across the application
 * Provides consistent error handling, logging, and request management
 * 
 * This replaces scattered API calls throughout the codebase with
 * a unified interface that ensures:
 * - Consistent error handling
 * - Request/response logging
 * - Retry logic
 * - Timeout management
 * - Rate limiting awareness
 */

import { ErrorMessages, createErrorResponse, logErrorForDebugging } from '@/lib/errorMessages';

export interface APIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  status: number;
  timestamp: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;

/**
 * Main API client class
 */
class APIClient {
  private baseURL: string = '';
  private timeout: number = DEFAULT_TIMEOUT;
  private retries: number = DEFAULT_RETRIES;
  private requestLog: Array<{
    url: string;
    method: string;
    timestamp: string;
    status?: number;
    duration?: number;
  }> = [];

  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || '';
  }

  /**
   * SET configuration
   */
  configure(options: { baseURL?: string; timeout?: number; retries?: number }): void {
    if (options.baseURL) this.baseURL = options.baseURL;
    if (options.timeout) this.timeout = options.timeout;
    if (options.retries) this.retries = options.retries;
  }

  /**
   * Make API request with built-in error handling
   */
  async request<T = any>(
    endpoint: string,
    options: APIOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.retries,
    } = options;

    const url = this.buildURL(endpoint);
    const startTime = Date.now();

    // Log outgoing request
    console.log(`[API] ${method} ${endpoint}`);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.performRequest<T>(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          timeout,
        });

        // Log successful request
        const duration = Date.now() - startTime;
        this.logRequest(url, method, response.status, duration);
        console.log(`[API] ✅ ${method} ${endpoint} (${response.status}) - ${duration}ms`);

        return response;
      } catch (error) {
        const isLastAttempt = attempt === retries;

        if (isLastAttempt) {
          // Final attempt failed, return error
          const duration = Date.now() - startTime;
          this.logRequest(url, method, undefined, duration);

          const errorMessage = this.getErrorMessage(error);
          console.error(`[API] ❌ ${method} ${endpoint} - ${errorMessage}`);

          return this.createErrorResponse<T>(error, endpoint);
        } else {
          // Retry after delay
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`[API] ⚠️ Retrying ${method} ${endpoint} in ${delay}ms (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Should not reach here
    return {
      success: false,
      error: {
        message: 'Unknown error',
        code: 'UNKNOWN_ERROR',
      },
      status: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Perform actual fetch request with timeout
   */
  private async performRequest<T>(
    url: string,
    options: RequestInit & { timeout?: number }
  ): Promise<APIResponse<T>> {
    const { timeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = timeout
      ? setTimeout(() => controller.abort(), timeout)
      : null;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();

      return {
        success: true,
        data,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Build full URL
   */
  private buildURL(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint; // Already a full URL
    }

    if (this.baseURL) {
      return `${this.baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    }

    return endpoint;
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        return 'Network error - unable to reach server';
      }
      if (error.message.includes('Aborted')) {
        return 'Request timeout';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error occurred';
  }

  /**
   * Create error response
   */
  private createErrorResponse<T>(error: any, endpoint: string): APIResponse<T> {
    const message = this.getErrorMessage(error);
    const code = this.getErrorCode(error);

    logErrorForDebugging('API Request Failed', message, {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: {
        message,
        code,
        details: error instanceof Error ? { stack: error.stack } : undefined,
      },
      status: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Map error to code
   */
  private getErrorCode(error: any): string {
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        return 'NETWORK_ERROR';
      }
      if (error.message.includes('Aborted')) {
        return 'REQUEST_TIMEOUT';
      }
    }

    return 'API_ERROR';
  }

  /**
   * Log request for debugging
   */
  private logRequest(url: string, method: string, status?: number, duration?: number): void {
    this.requestLog.push({
      url,
      method,
      status,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 requests
    if (this.requestLog.length > 100) {
      this.requestLog.shift();
    }
  }

  /**
   * Get request history
   */
  getRequestHistory(limit: number = 20) {
    return this.requestLog.slice(-limit);
  }

  /**
   * Clear request history
   */
  clearRequestHistory(): void {
    this.requestLog = [];
  }

  // ============================================================================
  // Convenience methods
  // ============================================================================

  async GET<T = any>(endpoint: string, options?: APIOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async POST<T = any>(
    endpoint: string,
    body?: any,
    options?: APIOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async PUT<T = any>(
    endpoint: string,
    body?: any,
    options?: APIOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async DELETE<T = any>(endpoint: string, options?: APIOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async PATCH<T = any>(
    endpoint: string,
    body?: any,
    options?: APIOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Export for use throughout the application
export default apiClient;
