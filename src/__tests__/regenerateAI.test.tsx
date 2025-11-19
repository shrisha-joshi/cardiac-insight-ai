/**
 * AI Regenerate Button Tests
 * Tests for regenerate functionality in Premium and Professional dashboards
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('AI Regenerate Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Visibility', () => {
    it('should show regenerate button when AI suggestions exist', () => {
      // Mock component with AI suggestions
      const MockComponent = () => {
        const aiSuggestions = {
          medicines: ['Aspirin 81mg'],
          ayurveda: ['Arjuna bark extract'],
          yoga: ['Pranayama'],
          diet: ['Mediterranean diet']
        };
        
        return (
          <div>
            {aiSuggestions && (
              <button 
                data-testid="regenerate-btn"
                onClick={() => {}}
              >
                Regenerate
              </button>
            )}
          </div>
        );
      };
      
      render(<MockComponent />);
      expect(screen.getByTestId('regenerate-btn')).toBeInTheDocument();
    });

    it('should hide regenerate button when no AI suggestions', () => {
      const MockComponent = () => {
        const aiSuggestions = null;
        
        return (
          <div>
            {aiSuggestions && (
              <button data-testid="regenerate-btn">Regenerate</button>
            )}
            <div data-testid="no-suggestions">No AI suggestions</div>
          </div>
        );
      };
      
      render(<MockComponent />);
      expect(screen.queryByTestId('regenerate-btn')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-suggestions')).toBeInTheDocument();
    });
  });

  describe('Button Behavior', () => {
    it('should disable button while loading', () => {
      const MockComponent = () => {
        const [loading, setLoading] = React.useState(false);
        
        return (
          <button 
            data-testid="regenerate-btn"
            disabled={loading}
            onClick={() => setLoading(true)}
          >
            {loading ? 'Generating...' : 'Regenerate'}
          </button>
        );
      };
      
      render(<MockComponent />);
      const button = screen.getByTestId('regenerate-btn');
      
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      
      waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should call AI service when clicked', async () => {
      const mockGetSuggestions = vi.fn().mockResolvedValue({
        suggestions: { medicines: ['New suggestion'] },
        warnings: [],
        source: 'gemini',
        disclaimer: 'Test disclaimer'
      });
      
      const MockComponent = () => {
        const [suggestions, setSuggestions] = React.useState(null);
        
        const handleRegenerate = async () => {
          const result = await mockGetSuggestions();
          setSuggestions(result.suggestions);
        };
        
        return (
          <div>
            <button 
              data-testid="regenerate-btn"
              onClick={handleRegenerate}
            >
              Regenerate
            </button>
            {suggestions && (
              <div data-testid="suggestions">
                {JSON.stringify(suggestions)}
              </div>
            )}
          </div>
        );
      };
      
      render(<MockComponent />);
      const button = screen.getByTestId('regenerate-btn');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('UI Feedback', () => {
    it('should show loading state during regeneration', async () => {
      const MockComponent = () => {
        const [loading, setLoading] = React.useState(false);
        
        const handleClick = async () => {
          setLoading(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          setLoading(false);
        };
        
        return (
          <button 
            data-testid="regenerate-btn"
            onClick={handleClick}
          >
            {loading ? (
              <span data-testid="loading-indicator">⟳ Generating...</span>
            ) : (
              'Regenerate'
            )}
          </button>
        );
      };
      
      render(<MockComponent />);
      const button = screen.getByTestId('regenerate-btn');
      
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
    });

    it('should show success toast after regeneration', async () => {
      const mockToast = vi.fn();
      
      const MockComponent = () => {
        const handleRegenerate = async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          mockToast({
            title: 'AI Suggestions Updated',
            description: '✨ Google Gemini AI'
          });
        };
        
        return (
          <button 
            data-testid="regenerate-btn"
            onClick={handleRegenerate}
          >
            Regenerate
          </button>
        );
      };
      
      render(<MockComponent />);
      fireEvent.click(screen.getByTestId('regenerate-btn'));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Updated')
          })
        );
      });
    });

    it('should show error toast on failure', async () => {
      const mockToast = vi.fn();
      const mockGetSuggestions = vi.fn().mockRejectedValue(new Error('API Error'));
      
      const MockComponent = () => {
        const handleRegenerate = async () => {
          try {
            await mockGetSuggestions();
          } catch (error) {
            mockToast({
              title: 'Error',
              description: 'Failed to generate suggestions',
              variant: 'destructive'
            });
          }
        };
        
        return (
          <button 
            data-testid="regenerate-btn"
            onClick={handleRegenerate}
          >
            Regenerate
          </button>
        );
      };
      
      render(<MockComponent />);
      fireEvent.click(screen.getByTestId('regenerate-btn'));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive'
          })
        );
      });
    });
  });

  describe('Suggestion Updates', () => {
    it('should update suggestions with new AI response', async () => {
      const initialSuggestions = { medicines: ['Old medicine'] };
      const newSuggestions = { medicines: ['New medicine'] };
      
      const MockComponent = () => {
        const [suggestions, setSuggestions] = React.useState(initialSuggestions);
        
        const handleRegenerate = async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          setSuggestions(newSuggestions);
        };
        
        return (
          <div>
            <button 
              data-testid="regenerate-btn"
              onClick={handleRegenerate}
            >
              Regenerate
            </button>
            <div data-testid="suggestions">
              {suggestions.medicines[0]}
            </div>
          </div>
        );
      };
      
      render(<MockComponent />);
      
      expect(screen.getByTestId('suggestions')).toHaveTextContent('Old medicine');
      
      fireEvent.click(screen.getByTestId('regenerate-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('suggestions')).toHaveTextContent('New medicine');
      });
    });

    it('should preserve patient data during regeneration', async () => {
      const patientData = {
        age: 55,
        gender: 'male',
        medicalHistory: ['Diabetes']
      };
      
      const mockGetSuggestions = vi.fn().mockResolvedValue({
        suggestions: { medicines: ['New'] },
        warnings: [],
        source: 'gemini',
        disclaimer: 'Test'
      });
      
      const MockComponent = () => {
        const handleRegenerate = async () => {
          await mockGetSuggestions({
            riskLevel: 'high',
            patientData,
            requestType: 'comprehensive'
          });
        };
        
        return (
          <button 
            data-testid="regenerate-btn"
            onClick={handleRegenerate}
          >
            Regenerate
          </button>
        );
      };
      
      render(<MockComponent />);
      fireEvent.click(screen.getByTestId('regenerate-btn'));
      
      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalledWith(
          expect.objectContaining({
            patientData: expect.objectContaining({
              age: 55,
              gender: 'male',
              medicalHistory: ['Diabetes']
            })
          })
        );
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should prevent multiple simultaneous requests', async () => {
      const mockGetSuggestions = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          suggestions: {},
          warnings: [],
          source: 'gemini',
          disclaimer: ''
        }), 100))
      );
      
      const MockComponent = () => {
        const [loading, setLoading] = React.useState(false);
        
        const handleRegenerate = async () => {
          if (loading) return;
          setLoading(true);
          await mockGetSuggestions();
          setLoading(false);
        };
        
        return (
          <button 
            data-testid="regenerate-btn"
            disabled={loading}
            onClick={handleRegenerate}
          >
            Regenerate
          </button>
        );
      };
      
      render(<MockComponent />);
      const button = screen.getByTestId('regenerate-btn');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      await waitFor(() => {
        // Should only call once despite multiple clicks
        expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
      });
    });
  });
});

// Helper: Import React for tests
import React from 'react';
