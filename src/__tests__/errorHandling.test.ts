/**
 * Phase 7: Error Handling Tests
 * Tests for error categorization and error configuration retrieval
 */

import { describe, it, expect } from 'vitest';
import { 
  categorizeError, 
  getErrorConfig, 
  type EnhancedErrorType 
} from '@/lib/errorMessages';

describe('Error Categorization (Phase 7)', () => {
  describe('categorizeError - Gemini AI Errors', () => {
    it('should categorize quota exceeded errors', () => {
      const error = { message: 'quota exceeded', status: 429 };
      expect(categorizeError(error)).toBe('GEMINI_QUOTA_EXCEEDED');
    });

    it('should categorize network errors', () => {
      const error = { message: 'network timeout' };
      expect(categorizeError(error)).toBe('GEMINI_NETWORK_ERROR');
    });

    it('should categorize fetch errors as network errors', () => {
      const error = { message: 'fetch failed' };
      expect(categorizeError(error)).toBe('GEMINI_NETWORK_ERROR');
    });

    it('should categorize CORS errors as network errors', () => {
      const error = { message: 'CORS policy blocked' };
      expect(categorizeError(error)).toBe('GEMINI_NETWORK_ERROR');
    });

    it('should categorize invalid response errors', () => {
      const error = { message: 'invalid JSON response' };
      expect(categorizeError(error)).toBe('GEMINI_INVALID_RESPONSE');
    });

    it('should categorize parse JSON errors', () => {
      const error = { message: 'failed to parse json' };
      expect(categorizeError(error)).toBe('GEMINI_INVALID_RESPONSE');
    });

    it('should categorize generic Gemini errors', () => {
      const error = { message: 'gemini api failed' };
      expect(categorizeError(error)).toBe('GEMINI_API_ERROR');
    });
  });

  describe('categorizeError - PDF Errors', () => {
    it('should categorize PDF parse failures', () => {
      const error = { message: 'pdf parse failed' };
      expect(categorizeError(error)).toBe('PDF_PARSE_FAILED');
    });

    it('should categorize PDF extract failures', () => {
      const error = { message: 'failed to extract pdf data' };
      expect(categorizeError(error)).toBe('PDF_PARSE_FAILED');
    });

    it('should categorize PDF export failures', () => {
      const error = { message: 'pdf export error' };
      expect(categorizeError(error)).toBe('PDF_EXPORT_FAILED');
    });

    it('should categorize PDF generate failures', () => {
      const error = { message: 'failed to generate pdf' };
      expect(categorizeError(error)).toBe('PDF_EXPORT_FAILED');
    });

    it('should categorize PDF upload failures', () => {
      const error = { message: 'pdf upload failed' };
      expect(categorizeError(error)).toBe('PDF_UPLOAD_FAILED');
    });
  });

  describe('categorizeError - Network Errors', () => {
    it('should categorize offline errors', () => {
      const error = { message: 'user is offline' };
      expect(categorizeError(error)).toBe('NETWORK_OFFLINE');
    });

    it('should categorize timeout errors', () => {
      const error = { message: 'request timeout' };
      expect(categorizeError(error)).toBe('NETWORK_TIMEOUT');
    });
  });

  describe('categorizeError - Database Errors', () => {
    it('should categorize Supabase errors', () => {
      const error = { message: 'supabase connection failed' };
      expect(categorizeError(error)).toBe('DATABASE_ERROR');
    });

    it('should categorize database insert errors', () => {
      const error = { message: 'insert operation failed' };
      expect(categorizeError(error)).toBe('DATABASE_ERROR');
    });

    it('should categorize database update errors', () => {
      const error = { message: 'update query failed' };
      expect(categorizeError(error)).toBe('DATABASE_ERROR');
    });
  });

  describe('categorizeError - Auth Errors', () => {
    it('should categorize 401 status as auth required', () => {
      const error = { status: 401 };
      expect(categorizeError(error)).toBe('AUTH_REQUIRED');
    });

    it('should categorize unauthorized errors', () => {
      const error = { message: 'unauthorized access' };
      expect(categorizeError(error)).toBe('AUTH_REQUIRED');
    });

    it('should categorize not authenticated errors', () => {
      const error = { message: 'user not authenticated' };
      expect(categorizeError(error)).toBe('AUTH_REQUIRED');
    });
  });

  describe('categorizeError - Subscription Errors', () => {
    it('should categorize 403 status as subscription required', () => {
      const error = { status: 403 };
      expect(categorizeError(error)).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('should categorize subscription errors', () => {
      const error = { message: 'subscription required for this feature' };
      expect(categorizeError(error)).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('should categorize upgrade errors', () => {
      const error = { message: 'please upgrade to access this' };
      expect(categorizeError(error)).toBe('SUBSCRIPTION_REQUIRED');
    });
  });

  describe('categorizeError - Unknown Errors', () => {
    it('should categorize unknown errors', () => {
      const error = { message: 'something went wrong' };
      expect(categorizeError(error)).toBe('UNKNOWN_ERROR');
    });

    it('should handle empty error objects', () => {
      const error = {};
      expect(categorizeError(error)).toBe('UNKNOWN_ERROR');
    });

    it('should handle null/undefined errors', () => {
      expect(categorizeError(null)).toBe('UNKNOWN_ERROR');
      expect(categorizeError(undefined)).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('Error Configuration Retrieval (Phase 7)', () => {
  describe('getErrorConfig', () => {
    it('should return correct config for GEMINI_QUOTA_EXCEEDED', () => {
      const config = getErrorConfig('GEMINI_QUOTA_EXCEEDED');
      expect(config).toMatchObject({
        title: expect.stringContaining('Unavailable'),
        description: expect.any(String),
        action: expect.stringContaining('Professional'),
        variant: 'default'
      });
    });

    it('should return correct config for NETWORK_OFFLINE', () => {
      const config = getErrorConfig('NETWORK_OFFLINE');
      expect(config).toMatchObject({
        title: expect.stringContaining('No Internet'),
        description: expect.any(String),
        variant: 'destructive'
      });
    });

    it('should return correct config for PDF_EXPORT_FAILED', () => {
      const config = getErrorConfig('PDF_EXPORT_FAILED');
      expect(config).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        action: expect.any(String),
        variant: 'destructive'
      });
    });

    it('should return correct config for DATABASE_ERROR', () => {
      const config = getErrorConfig('DATABASE_ERROR');
      expect(config).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        action: expect.any(String)
      });
    });

    it('should return config with all required fields', () => {
      const errorTypes: EnhancedErrorType[] = [
        'GEMINI_QUOTA_EXCEEDED',
        'GEMINI_NETWORK_ERROR',
        'GEMINI_INVALID_RESPONSE',
        'GEMINI_API_ERROR',
        'PDF_PARSE_FAILED',
        'PDF_EXPORT_FAILED',
        'PDF_UPLOAD_FAILED',
        'NETWORK_OFFLINE',
        'NETWORK_TIMEOUT',
        'DATABASE_ERROR',
        'AUTH_REQUIRED',
        'SUBSCRIPTION_REQUIRED',
        'UNKNOWN_ERROR'
      ];

      errorTypes.forEach(type => {
        const config = getErrorConfig(type);
        expect(config).toHaveProperty('title');
        expect(config).toHaveProperty('description');
        expect(config.title).toBeTruthy();
        expect(config.description).toBeTruthy();
      });
    });
  });

  describe('Error Config Properties', () => {
    it('should have destructive variant for critical errors', () => {
      const criticalErrors: EnhancedErrorType[] = [
        'GEMINI_NETWORK_ERROR',
        'PDF_PARSE_FAILED',
        'PDF_EXPORT_FAILED',
        'PDF_UPLOAD_FAILED',
        'NETWORK_OFFLINE',
        'NETWORK_TIMEOUT'
      ];

      criticalErrors.forEach(type => {
        const config = getErrorConfig(type);
        expect(config.variant).toBe('destructive');
      });
    });

    it('should have action strings for recoverable errors', () => {
      const recoverableErrors: EnhancedErrorType[] = [
        'GEMINI_QUOTA_EXCEEDED',
        'PDF_PARSE_FAILED',
        'NETWORK_TIMEOUT'
      ];

      recoverableErrors.forEach(type => {
        const config = getErrorConfig(type);
        expect(config.action).toBeTruthy();
      });
    });
  });
});
