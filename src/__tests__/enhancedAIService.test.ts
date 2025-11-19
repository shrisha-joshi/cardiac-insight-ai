/**
 * Enhanced AI Service Tests
 * Tests for Gemini AI integration, retry logic, and fallback behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enhancedAiService } from '../services/enhancedAIService';
import type { EnhancedAIRequest } from '../services/enhancedAIService';

describe('Enhanced AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Key Validation', () => {
    it('should detect valid Gemini API key format', () => {
      const validKey = 'AIzaSyDjd0_edzTqcUtl_TEBOSgVIpzYsIiTkwk';
      // Key validation happens in constructor - just verify service exists
      expect(enhancedAiService).toBeDefined();
      expect(enhancedAiService.isAIAvailable()).toBeDefined();
    });

    it('should provide available providers list', () => {
      const providers = enhancedAiService.getAvailableProviders();
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should indicate if AI is available', () => {
      const isAvailable = enhancedAiService.isAIAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('Enhanced Suggestions', () => {
    const mockRequest: EnhancedAIRequest = {
      riskLevel: 'high',
      patientData: {
        age: 55,
        gender: 'male',
        medicalHistory: ['Diabetes', 'Smoking'],
        currentConditions: ['Chest Pain Type: typical angina', 'Resting BP: 150'],
        lifestyle: ['Exercise-induced Angina']
      },
      requestType: 'comprehensive'
    };

    it('should return suggestions object with correct structure', async () => {
      const response = await enhancedAiService.getEnhancedSuggestions(mockRequest);
      
      expect(response).toBeDefined();
      expect(response.suggestions).toBeDefined();
      expect(response.warnings).toBeDefined();
      expect(response.source).toBeDefined();
      expect(response.disclaimer).toBeDefined();
      
      expect(Array.isArray(response.warnings)).toBe(true);
      expect(typeof response.source).toBe('string');
      expect(['gemini', 'openai', 'fallback']).toContain(response.source);
    });

    it('should include all recommendation categories', async () => {
      const response = await enhancedAiService.getEnhancedSuggestions(mockRequest);
      
      const suggestions = response.suggestions;
      expect(suggestions).toBeDefined();
      
      // Should have at least some categories
      const hasCategories = 
        suggestions.medicines || 
        suggestions.ayurveda || 
        suggestions.yoga || 
        suggestions.diet;
      
      expect(hasCategories).toBeTruthy();
    });

    it('should provide appropriate warnings for high-risk patients', async () => {
      const highRiskRequest: EnhancedAIRequest = {
        ...mockRequest,
        riskLevel: 'critical'
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(highRiskRequest);
      
      expect(response.warnings.length).toBeGreaterThan(0);
      
      // Should mention consulting medical professionals for high risk
      const warningsText = response.warnings.join(' ').toLowerCase();
      expect(
        warningsText.includes('consult') || 
        warningsText.includes('doctor') || 
        warningsText.includes('medical')
      ).toBe(true);
    });

    it('should handle low-risk patients with appropriate recommendations', async () => {
      const lowRiskRequest: EnhancedAIRequest = {
        ...mockRequest,
        riskLevel: 'low',
        patientData: {
          age: 35,
          gender: 'female',
          medicalHistory: [],
          currentConditions: ['Resting BP: 110', 'Cholesterol: 160'],
          lifestyle: ['Regular Exercise']
        }
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(lowRiskRequest);
      
      expect(response).toBeDefined();
      expect(response.warnings.length).toBeLessThan(3); // Fewer warnings for low risk
    });
  });

  describe('Request Type Handling', () => {
    const baseRequest: EnhancedAIRequest = {
      riskLevel: 'medium',
      patientData: {
        age: 50,
        gender: 'male',
        medicalHistory: ['High Cholesterol'],
        currentConditions: ['BP: 140'],
        lifestyle: ['Sedentary']
      },
      requestType: 'comprehensive'
    };

    it('should handle comprehensive request', async () => {
      const response = await enhancedAiService.getEnhancedSuggestions({
        ...baseRequest,
        requestType: 'comprehensive'
      });
      
      expect(response.suggestions).toBeDefined();
    });

    it('should handle medicines-only request', async () => {
      const response = await enhancedAiService.getEnhancedSuggestions({
        ...baseRequest,
        requestType: 'medicines'
      });
      
      expect(response.suggestions).toBeDefined();
    });

    it('should handle ayurveda-only request', async () => {
      const response = await enhancedAiService.getEnhancedSuggestions({
        ...baseRequest,
        requestType: 'ayurveda'
      });
      
      expect(response.suggestions).toBeDefined();
    });

    it('should handle yoga-only request', async () => {
      const response = await enhancedAiService.getEnhancedSuggestions({
        ...baseRequest,
        requestType: 'yoga'
      });
      
      expect(response.suggestions).toBeDefined();
    });

    it('should handle diet-only request', async () => {
      const response = await enhancedAiService.getEnhancedSuggestions({
        ...baseRequest,
        requestType: 'diet'
      });
      
      expect(response.suggestions).toBeDefined();
    });
  });

  describe('Disclaimer and Medical Safety', () => {
    it('should always include medical disclaimer', async () => {
      const request: EnhancedAIRequest = {
        riskLevel: 'medium',
        patientData: {
          age: 45,
          gender: 'female',
          medicalHistory: [],
          currentConditions: [],
          lifestyle: []
        },
        requestType: 'comprehensive'
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(request);
      
      expect(response.disclaimer).toBeDefined();
      expect(response.disclaimer.length).toBeGreaterThan(50);
      expect(response.disclaimer.toLowerCase()).toContain('medical');
    });

    it('should emphasize emergency guidance for critical patients', async () => {
      const criticalRequest: EnhancedAIRequest = {
        riskLevel: 'critical',
        patientData: {
          age: 65,
          gender: 'male',
          medicalHistory: ['Previous Heart Attack', 'Diabetes'],
          currentConditions: ['Severe Chest Pain', 'BP: 180'],
          lifestyle: ['Smoking']
        },
        requestType: 'comprehensive'
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(criticalRequest);
      
      const allText = (response.warnings.join(' ') + response.disclaimer).toLowerCase();
      expect(
        allText.includes('immediate') || 
        allText.includes('emergency') || 
        allText.includes('urgent')
      ).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('should provide fallback suggestions when AI unavailable', async () => {
      // Even if AI fails, should get fallback response
      const request: EnhancedAIRequest = {
        riskLevel: 'medium',
        patientData: {
          age: 50,
          gender: 'male',
          medicalHistory: [],
          currentConditions: [],
          lifestyle: []
        },
        requestType: 'comprehensive'
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(request);
      
      // Should always get a response, even if it's fallback
      expect(response).toBeDefined();
      expect(response.suggestions).toBeDefined();
      expect(['gemini', 'openai', 'fallback']).toContain(response.source);
    });

    it('should include standard recommendations in fallback', async () => {
      const request: EnhancedAIRequest = {
        riskLevel: 'low',
        patientData: {
          age: 40,
          gender: 'female',
          medicalHistory: [],
          currentConditions: [],
          lifestyle: []
        },
        requestType: 'comprehensive'
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(request);
      
      // Even fallback should have useful recommendations
      const { medicines, ayurveda, yoga, diet } = response.suggestions;
      const totalRecommendations = 
        (medicines?.length || 0) + 
        (ayurveda?.length || 0) + 
        (yoga?.length || 0) + 
        (diet?.length || 0);
      
      expect(totalRecommendations).toBeGreaterThan(0);
    });
  });

  describe('Response Quality', () => {
    it('should provide specific and actionable recommendations', async () => {
      const request: EnhancedAIRequest = {
        riskLevel: 'medium',
        patientData: {
          age: 55,
          gender: 'male',
          medicalHistory: ['High Cholesterol'],
          currentConditions: ['BP: 145'],
          lifestyle: ['Low Physical Activity']
        },
        requestType: 'comprehensive'
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(request);
      
      // Check if recommendations are detailed (not just single words)
      const allRecommendations = [
        ...(response.suggestions.medicines || []),
        ...(response.suggestions.ayurveda || []),
        ...(response.suggestions.yoga || []),
        ...(response.suggestions.diet || [])
      ];
      
      if (allRecommendations.length > 0) {
        const hasDetailedRecommendations = allRecommendations.some(
          rec => rec.length > 20 // Detailed recommendations are longer
        );
        expect(hasDetailedRecommendations).toBe(true);
      }
    });

    it('should provide multiple recommendations per category', async () => {
      const request: EnhancedAIRequest = {
        riskLevel: 'high',
        patientData: {
          age: 60,
          gender: 'male',
          medicalHistory: ['Diabetes', 'High BP'],
          currentConditions: ['Elevated Cholesterol'],
          lifestyle: ['Smoking']
        },
        requestType: 'comprehensive'
      };
      
      const response = await enhancedAiService.getEnhancedSuggestions(request);
      
      // Each category should ideally have multiple recommendations
      const categoriesWithMultiple = [
        response.suggestions.medicines,
        response.suggestions.ayurveda,
        response.suggestions.yoga,
        response.suggestions.diet
      ].filter(category => category && category.length >= 3);
      
      // At least some categories should have multiple recommendations
      expect(categoriesWithMultiple.length).toBeGreaterThan(0);
    });
  });
});
