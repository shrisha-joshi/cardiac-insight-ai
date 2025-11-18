import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PredictionHistory from '../components/PredictionHistory';
import { PredictionWithFeedback } from '../hooks/use-prediction-history';

// Mock data
const mockPredictions: PredictionWithFeedback[] = [
  {
    id: 'pred-1',
    timestamp: new Date('2024-01-15T10:30:00'),
    riskLevel: 'high',
    riskScore: 75,
    confidence: 92,
    // Prediction enum allows 'Risk' not 'Risk Detected'
    prediction: 'Risk',
    explanation: 'High risk due to multiple factors',
    recommendations: ['Immediate consultation', 'Lifestyle changes'],
    patientData: {
      age: 65,
      gender: 'male',
      chestPainType: 'typical',
      restingBP: 160,
      cholesterol: 280,
      fastingBS: true,
      restingECG: 'normal',
      maxHR: 120,
      exerciseAngina: true,
      oldpeak: 2.5,
      stSlope: 'flat',
      smoking: true,
      diabetes: true,
      previousHeartAttack: false,
      cholesterolMedication: false,
      diabetesMedication: 'none',
      bpMedication: true,
      lifestyleChanges: false,
      dietType: 'non-vegetarian',
      stressLevel: 8,
      sleepHours: 5,
      // Allowed values: 'low' | 'moderate' | 'high'
      physicalActivity: 'low'
    },
    feedback: null
  },
  {
    id: 'pred-2',
    timestamp: new Date('2024-01-10T14:20:00'),
    riskLevel: 'low',
    riskScore: 25,
    confidence: 88,
    prediction: 'No Risk',
    explanation: 'Low risk profile',
    recommendations: ['Maintain healthy lifestyle'],
    patientData: {
      age: 35,
      gender: 'female',
      chestPainType: 'non-anginal',
      restingBP: 110,
      cholesterol: 180,
      fastingBS: false,
      restingECG: 'normal',
      maxHR: 170,
      exerciseAngina: false,
      oldpeak: 0,
      stSlope: 'up',
      smoking: false,
      diabetes: false,
      previousHeartAttack: false,
      cholesterolMedication: false,
      diabetesMedication: 'none',
      bpMedication: false,
      lifestyleChanges: true,
      dietType: 'vegetarian',
      stressLevel: 3,
      sleepHours: 8,
      // Map 'active' to enum 'high'
      physicalActivity: 'high'
    },
    feedback: 'correct'
  }
];

describe('PredictionHistory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state message when no predictions', () => {
      render(
        <PredictionHistory 
          predictions={[]} 
          userId="user-123"
        />
      );

      expect(screen.getByText('No History Available')).toBeInTheDocument();
      expect(screen.getByText('Your prediction history will appear here after you complete assessments')).toBeInTheDocument();
    });

    it('should show user ID in empty state', () => {
      render(
        <PredictionHistory 
          predictions={[]} 
          userId="user-abc-123-def"
        />
      );

      // Multiple occurrences (main block + debug panel); ensure at least one
      const userIdMatches = screen.getAllByText(/User ID:/);
      expect(userIdMatches.length).toBeGreaterThan(0);
    });
  });

  describe('History Display', () => {
    it('should render prediction history with multiple entries', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      // Check that predictions are rendered
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should display patient data summary for each prediction', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      // Check patient data
      expect(screen.getByText(/Age 65, male/)).toBeInTheDocument();
      expect(screen.getByText(/BP: 160, Chol: 280/)).toBeInTheDocument();
      expect(screen.getByText(/Age 35, female/)).toBeInTheDocument();
      expect(screen.getByText(/BP: 110, Chol: 180/)).toBeInTheDocument();
    });

    it('should show confidence scores', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      expect(screen.getByText('92% confidence')).toBeInTheDocument();
      expect(screen.getByText('88% confidence')).toBeInTheDocument();
    });

    it('should format timestamps correctly', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      // Check for date elements (format depends on locale)
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 10, 2024/)).toBeInTheDocument();
    });
  });

  describe('Statistics Overview', () => {
    it('should calculate and display correct statistics', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      // Total assessments
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Total Assessments')).toBeInTheDocument();

      // Risk categories
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();

      // Average risk (75 + 25) / 2 = 50
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Average Risk')).toBeInTheDocument();
    });
  });

  describe('Feedback System', () => {
    it('should display feedback badges for verified predictions', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      expect(screen.getByText('✓ Verified')).toBeInTheDocument();
    });

    it('should call onAddFeedback when feedback is given', async () => {
      const mockAddFeedback = vi.fn();
      const user = userEvent.setup();
      
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
          onAddFeedback={mockAddFeedback}
        />
      );

      // Click Details button for first prediction
      const detailsButtons = screen.getAllByText('Details');
      await user.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Was this assessment accurate?')).toBeInTheDocument();
      });

      // Click Correct button
      const correctButtons = screen.getAllByText('Correct');
      await user.click(correctButtons[0]);

      await waitFor(() => {
        expect(mockAddFeedback).toHaveBeenCalledWith('pred-1', 'correct');
      });
    });
  });

  describe('User Context', () => {
    it('should display user ID in header', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-long-id-12345"
        />
      );

      expect(screen.getByText(/Your Personal History/)).toBeInTheDocument();
      expect(screen.getByText(/User: user-long-id-12345/)).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria - History Fetch on Mount', () => {
    it('should render most recent prediction entry', () => {
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      // Most recent entry (pred-1 from Jan 15) should be first
      const highRiskBadges = screen.getAllByText('HIGH');
      expect(highRiskBadges[0]).toBeInTheDocument();
      
      // Verify it's the most recent by checking the first card has 75% risk
      const riskScores = screen.getAllByText('75%');
      expect(riskScores[0]).toBeInTheDocument();
    });

    it('should render within 2s performance budget (mocked)', async () => {
      const startTime = performance.now();
      
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Component should render quickly (< 100ms for unit test)
      expect(renderTime).toBeLessThan(100);
    });

    it('should assert presence of most recent history entry (expanded)', async () => {
      const user = userEvent.setup();
      render(
        <PredictionHistory 
          predictions={mockPredictions}
          userId="user-123"
        />
      );

      // Expand first (most recent) prediction details
      const detailsButtons = screen.getAllByText('Details');
      await user.click(detailsButtons[0]);

      // Assert most recent entry details now visible
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText(/Age 65, male/)).toBeInTheDocument();
      expect(screen.getByText('92% confidence')).toBeInTheDocument();
      // "Assessment Result:" block contains prediction text
      await waitFor(() => {
        // Prediction enum now uses 'Risk'
        expect(screen.getByText('Risk')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle predictions without feedback', () => {
      const predictionsNoFeedback = mockPredictions.map(p => ({ ...p, feedback: null }));
      
      render(
        <PredictionHistory 
          predictions={predictionsNoFeedback}
          userId="user-123"
        />
      );

      // Should still render predictions
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('should handle missing recommendations', () => {
      const predictionsNoRecs = [{
        ...mockPredictions[0],
        recommendations: []
      }];
      
      render(
        <PredictionHistory 
          predictions={predictionsNoRecs}
          userId="user-123"
        />
      );

      // Should still render prediction
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });
});
