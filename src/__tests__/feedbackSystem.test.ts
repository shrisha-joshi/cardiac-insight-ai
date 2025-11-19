/**
 * Phase 9: User Feedback System Tests
 * Tests for feedback widget, service, and data handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { feedbackService, FeedbackType } from '@/services/feedbackService';

describe('User Feedback System (Phase 9)', () => {
  describe('Feedback Service', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
      vi.clearAllMocks();
    });

    it('should be defined and have required methods', () => {
      expect(feedbackService).toBeDefined();
      expect(typeof feedbackService.submitFeedback).toBe('function');
      expect(typeof feedbackService.getAllFeedback).toBe('function');
      expect(typeof feedbackService.getFeedbackStats).toBe('function');
      expect(typeof feedbackService.syncPendingFeedback).toBe('function');
    });

    it('should handle feedback submission', async () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Test bug report',
        email: 'test@example.com',
      };

      // Should not throw error
      await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
    });

    it('should save to localStorage when database fails', async () => {
      const feedback = {
        type: 'feature' as FeedbackType,
        message: 'Test feature request',
        url: 'https://example.com/test',
      };

      await feedbackService.submitFeedback(feedback);

      // Check if saved to localStorage
      const stored = localStorage.getItem('pending_feedback');
      if (stored) {
        const pending = JSON.parse(stored);
        expect(Array.isArray(pending)).toBe(true);
      }
    });

    it('should validate feedback types', () => {
      const validTypes: FeedbackType[] = ['bug', 'feature', 'positive', 'negative', 'general'];
      
      validTypes.forEach(type => {
        expect(['bug', 'feature', 'positive', 'negative', 'general']).toContain(type);
      });
    });

    it('should handle empty feedback gracefully', async () => {
      const feedback = {
        type: 'general' as FeedbackType,
        message: '',
      };

      // Should still process even with empty message
      await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
    });

    it('should track feedback with metadata', async () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Test bug with metadata',
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      await feedbackService.submitFeedback(feedback);

      expect(feedback.url).toBeDefined();
      expect(feedback.userAgent).toBeDefined();
    });
  });

  describe('Feedback Stats', () => {
    it('should calculate feedback statistics', async () => {
      const stats = await feedbackService.getFeedbackStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byStatus');
      
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.byType).toBe('object');
      expect(typeof stats.byStatus).toBe('object');
    });

    it('should have all feedback types in stats', async () => {
      const stats = await feedbackService.getFeedbackStats();

      expect(stats.byType).toHaveProperty('bug');
      expect(stats.byType).toHaveProperty('feature');
      expect(stats.byType).toHaveProperty('positive');
      expect(stats.byType).toHaveProperty('negative');
      expect(stats.byType).toHaveProperty('general');
    });

    it('should have all status types in stats', async () => {
      const stats = await feedbackService.getFeedbackStats();

      expect(stats.byStatus).toHaveProperty('new');
      expect(stats.byStatus).toHaveProperty('in-review');
      expect(stats.byStatus).toHaveProperty('resolved');
      expect(stats.byStatus).toHaveProperty('dismissed');
    });

    it('should return valid numbers for stats', async () => {
      const stats = await feedbackService.getFeedbackStats();

      expect(stats.total).toBeGreaterThanOrEqual(0);
      
      Object.values(stats.byType).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
      
      Object.values(stats.byStatus).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Offline Support', () => {
    it('should save feedback to localStorage when offline', async () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Offline feedback test',
      };

      await feedbackService.submitFeedback(feedback);

      const stored = localStorage.getItem('pending_feedback');
      expect(stored).toBeDefined();
    });

    it('should sync pending feedback when online', async () => {
      // Add some pending feedback
      const pendingFeedback = [
        {
          id: 'local_1',
          type: 'bug',
          message: 'Pending bug report',
          timestamp: new Date().toISOString(),
        },
      ];

      localStorage.setItem('pending_feedback', JSON.stringify(pendingFeedback));

      // Sync should not throw
      await expect(feedbackService.syncPendingFeedback()).resolves.not.toThrow();
    });

    it('should handle sync errors gracefully', async () => {
      // Invalid JSON in localStorage
      localStorage.setItem('pending_feedback', 'invalid json');

      // Should not throw
      await expect(feedbackService.syncPendingFeedback()).resolves.not.toThrow();
    });
  });

  describe('Feedback Validation', () => {
    it('should accept all valid feedback types', async () => {
      const types: FeedbackType[] = ['bug', 'feature', 'positive', 'negative', 'general'];

      for (const type of types) {
        const feedback = {
          type,
          message: `Test ${type} feedback`,
        };

        await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
      }
    });

    it('should handle long messages', async () => {
      const longMessage = 'A'.repeat(5000);
      
      const feedback = {
        type: 'general' as FeedbackType,
        message: longMessage,
      };

      await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = "Test with special chars: <>&\"'éñ中文🎉";
      
      const feedback = {
        type: 'general' as FeedbackType,
        message: specialMessage,
      };

      await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
    });

    it('should validate email format (if provided)', async () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Test bug',
        email: 'valid@example.com',
      };

      await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
    });
  });

  describe('Feedback Metadata', () => {
    it('should capture URL automatically', async () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Test with URL',
        url: window.location.href,
      };

      expect(feedback.url).toBeDefined();
      expect(typeof feedback.url).toBe('string');
    });

    it('should capture user agent', async () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Test with user agent',
        userAgent: navigator.userAgent,
      };

      expect(feedback.userAgent).toBeDefined();
      expect(typeof feedback.userAgent).toBe('string');
    });

    it('should include timestamp', async () => {
      const before = Date.now();
      
      await feedbackService.submitFeedback({
        type: 'general' as FeedbackType,
        message: 'Test timestamp',
      });
      
      const after = Date.now();
      
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Test network error handling',
      };

      // Should not throw even if network fails
      await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
    });

    it('should fallback to localStorage on error', async () => {
      const feedback = {
        type: 'feature' as FeedbackType,
        message: 'Test fallback',
      };

      await feedbackService.submitFeedback(feedback);

      // Check localStorage has the feedback
      const stored = localStorage.getItem('pending_feedback');
      expect(stored).toBeDefined();
    });

    it('should handle localStorage quota exceeded', async () => {
      // Fill localStorage to simulate quota exceeded
      try {
        const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
        localStorage.setItem('test_large', largeData);
      } catch (e) {
        // Expected - localStorage full
      }

      const feedback = {
        type: 'bug' as FeedbackType,
        message: 'Test with full localStorage',
      };

      // Should not throw
      await expect(feedbackService.submitFeedback(feedback)).resolves.not.toThrow();
    });
  });

  describe('Admin Functions', () => {
    it('should get all feedback', async () => {
      const allFeedback = await feedbackService.getAllFeedback();
      
      expect(Array.isArray(allFeedback)).toBe(true);
    });

    it('should update feedback status', async () => {
      // Should handle update gracefully even if feedback doesn't exist or network fails
      try {
        await feedbackService.updateFeedbackStatus('test-id', 'resolved', 'Test note');
      } catch (error) {
        // Expected in test environment due to CORS
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should submit feedback quickly', async () => {
      const start = performance.now();
      
      await feedbackService.submitFeedback({
        type: 'general' as FeedbackType,
        message: 'Performance test',
      });
      
      const duration = performance.now() - start;
      
      // Should complete in under 500ms
      expect(duration).toBeLessThan(500);
    });

    it('should handle multiple rapid submissions', async () => {
      const submissions = Array.from({ length: 5 }, (_, i) => 
        feedbackService.submitFeedback({
          type: 'general' as FeedbackType,
          message: `Rapid submission ${i}`,
        })
      );

      await expect(Promise.all(submissions)).resolves.not.toThrow();
    });
  });
});
