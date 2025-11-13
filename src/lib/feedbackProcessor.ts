/**
 * Feedback Processor for Model Improvement
 * Enables continuous learning from user feedback on prediction accuracy
 * Date: November 6, 2025
 */

import { supabase } from '@/lib/supabase';
import type { PredictionResult } from '@/lib/mockData';

// ============================================================================
// CONSTANTS & HELPERS (reduce magic numbers and code duplication)
// ============================================================================

const BASELINE_MODEL_ACCURACY = 85.7; // Baseline from UCI study

type FeedbackConfidence = number; // 1-10 scale

function average(values: FeedbackConfidence[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

function daysBetween(a: Date, b: Date): number {
  const diffTime = Math.abs(a.getTime() - b.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function hasTimeFields(
  x: unknown
): x is { timestamp?: string | Date; created_at?: string | Date } {
  return (
    typeof x === 'object' && x !== null && ('timestamp' in x || 'created_at' in x)
  );
}

// ============================================================================
// FEEDBACK DATA TYPES
// ============================================================================

export interface PredictionFeedback {
  id?: string;
  prediction_id: string;
  user_id: string;
  feedback_type: 'correct' | 'incorrect' | 'partially_correct' | 'uncertain';
  actual_outcome?: string;  // What actually happened
  confidence_rating?: number;  // 1-10 user confidence in prediction
  notes?: string;  // Additional user notes
  created_at?: string;
  updated_at?: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  accuracyRate: number;  // % of "correct" responses
  correctCount: number;
  incorrectCount: number;
  partiallyCorrectCount: number;
  uncertainCount: number;
  averageConfidence: number;
  lastUpdated?: Date;
}

export interface ModelPerformanceReport {
  period: 'weekly' | 'monthly' | 'all_time';
  totalPredictions: number;
  predictionsWithFeedback: number;
  feedbackRate: number;  // % of predictions that received feedback
  measuredAccuracy: number;  // Accuracy from feedback
  estimatedAccuracy: number;  // Baseline model accuracy
  improvementNeeded: string[];  // Areas to focus on
  confidenceDistribution: Record<string, number>;
  recommendations: string[];
  lastCalculated: Date;
}

// ============================================================================
// FEEDBACK COLLECTION & PROCESSING
// ============================================================================

export class FeedbackProcessor {
  /**
   * Submit feedback on a prediction
   */
  static async submitFeedback(feedback: PredictionFeedback): Promise<boolean> {
    try {
      if (!supabase) {
        if (import.meta.env.DEV) console.warn('Supabase not configured - feedback not saved');
        return false;
      }

      const { data, error } = await supabase
        .from('ml_prediction_feedback')
        .insert([{
          prediction_id: feedback.prediction_id,
          user_id: feedback.user_id,
          feedback_type: feedback.feedback_type,
          actual_outcome: feedback.actual_outcome,
          confidence_rating: feedback.confidence_rating,
          notes: feedback.notes,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        if (import.meta.env.DEV) console.error('Error submitting feedback:', error);
        return false;
      }

      if (import.meta.env.DEV) console.log('✅ Feedback submitted successfully', data);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Feedback submission error:', error);
      return false;
    }
  }

  /**
   * Get feedback statistics for a user
   */
  static async getFeedbackStats(userId: string): Promise<FeedbackStats> {
    try {
      if (!supabase) {
        return this.getDefaultStats();
      }

      const { data, error } = await supabase
        .from('ml_prediction_feedback')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) {
        if (import.meta.env.DEV) console.warn('Error fetching feedback stats:', error);
        return this.getDefaultStats();
      }

      const feedback = data as PredictionFeedback[];

      // Single-pass aggregation to reduce complexity and duplicate traversals
      let correctCount = 0;
      let incorrectCount = 0;
      let partiallyCorrectCount = 0;
      let uncertainCount = 0;
      const confidences: FeedbackConfidence[] = [];

      for (const f of feedback) {
        switch (f.feedback_type) {
          case 'correct':
            correctCount++;
            break;
          case 'incorrect':
            incorrectCount++;
            break;
          case 'partially_correct':
            partiallyCorrectCount++;
            break;
          case 'uncertain':
            uncertainCount++;
            break;
          default:
            break;
        }
        if (typeof f.confidence_rating === 'number') {
          confidences.push(f.confidence_rating);
        }
      }

      const totalFeedback = feedback.length;
      const accuracyRate = totalFeedback > 0 ? (correctCount / totalFeedback) * 100 : 0;
      const averageConfidence = average(confidences);

      return {
        totalFeedback,
        correctCount,
        incorrectCount,
        partiallyCorrectCount,
        uncertainCount,
        accuracyRate,
        averageConfidence,
        lastUpdated: new Date()
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting feedback stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get model performance report
   */
  static async getPerformanceReport(
    userId: string,
    period: 'weekly' | 'monthly' | 'all_time' = 'monthly'
  ): Promise<ModelPerformanceReport> {
    try {
      const stats = await this.getFeedbackStats(userId);

      // Get predictions from database
      const { data: predictions, error: predictionsError } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('user_id', userId);

      if (predictionsError) {
        if (import.meta.env.DEV) console.warn('Error fetching predictions:', predictionsError);
      }

      const totalPredictions = predictions?.length || 0;
      const feedbackRate = totalPredictions > 0 ? (stats.totalFeedback / totalPredictions) * 100 : 0;

      // Build confidence distribution
      const confidenceDistribution: Record<string, number> = {
        'Very Low (1-3)': 0,
        'Low (4-6)': 0,
        'Medium (7-8)': 0,
        'High (9-10)': 0
      };

      // Populate distribution from feedback confidence
      const { data: feedbackData } = await supabase
        .from('ml_prediction_feedback')
        .select('confidence_rating')
        .eq('user_id', userId)
        .not('confidence_rating', 'is', null);

      (feedbackData as Array<{ confidence_rating: number }> | null)?.forEach((r) => {
        const c = r.confidence_rating;
        if (c >= 9) confidenceDistribution['High (9-10)']++;
        else if (c >= 7) confidenceDistribution['Medium (7-8)']++;
        else if (c >= 4) confidenceDistribution['Low (4-6)']++;
        else confidenceDistribution['Very Low (1-3)']++;
      });

      // Analyze areas for improvement
      const improvementNeeded: string[] = [];

      if (stats.accuracyRate < 85) {
        improvementNeeded.push('Model accuracy below 85% - retraining recommended');
      }

      if (stats.incorrectCount > stats.correctCount) {
        improvementNeeded.push('More incorrect predictions than correct - review model coefficients');
      }

      if (feedbackRate < 20) {
        improvementNeeded.push('Low feedback rate (<20%) - encourage more user feedback');
      }

      const recommendations: string[] = [];

      if (stats.totalFeedback < 10) {
        recommendations.push('Collect more feedback (target: 50+ samples for reliable statistics)');
      }

      if (stats.accuracyRate > 85 && stats.totalFeedback > 30) {
        recommendations.push('Model performing well - consider deploying current version');
      }

      recommendations.push('Review top misclassified predictions for pattern identification');
      recommendations.push('Compare accuracy across different risk levels');
      recommendations.push('Analyze demographic variations in prediction accuracy');

      return {
        period,
        totalPredictions,
        predictionsWithFeedback: stats.totalFeedback,
        feedbackRate,
        measuredAccuracy: stats.accuracyRate,
  estimatedAccuracy: BASELINE_MODEL_ACCURACY,
        improvementNeeded,
        confidenceDistribution,
        recommendations,
        lastCalculated: new Date()
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Trigger monthly retraining analysis
   */
  static async analyzeForRetraining(userId: string): Promise<{
    shouldRetrain: boolean;
    reason: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }> {
    try {
      const report = await this.getPerformanceReport(userId, 'monthly');

      let shouldRetrain = false;
      let reason = '';
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';

      if (report.measuredAccuracy < 80) {
        shouldRetrain = true;
        reason = 'Model accuracy dropped significantly below baseline';
        priority = 'critical';
      } else if (report.measuredAccuracy < 85) {
        shouldRetrain = true;
        reason = 'Model accuracy below baseline performance';
        priority = 'high';
      } else if (report.measuredAccuracy < 87) {
        shouldRetrain = true;
        reason = 'Opportunity to improve model accuracy';
        priority = 'medium';
      } else if (report.predictionsWithFeedback > 100) {
        shouldRetrain = true;
        reason = 'Sufficient feedback collected for continuous improvement';
        priority = 'low';
      }

      return {
        shouldRetrain,
        reason,
        priority
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error analyzing for retraining:', error);
      return {
        shouldRetrain: false,
        reason: 'Error during analysis',
        priority: 'low'
      };
    }
  }

  /**
   * Get default stats when no data available
   */
  private static getDefaultStats(): FeedbackStats {
    return {
      totalFeedback: 0,
  accuracyRate: BASELINE_MODEL_ACCURACY,  // Baseline from UCI study
      correctCount: 0,
      incorrectCount: 0,
      partiallyCorrectCount: 0,
      uncertainCount: 0,
      averageConfidence: 85
    };
  }

  /**
   * Analyze prediction misclassifications
   */
  static async analyzeMisclassifications(userId: string, limit: number = 10): Promise<Array<{
    predictionId: string;
    riskLevel: string;
    actualOutcome: string;
    confidenceGap: number;
  }>> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('ml_prediction_feedback')
        .select('*')
        .eq('user_id', userId)
        .eq('feedback_type', 'incorrect')
        .limit(limit);

      if (error) {
        if (import.meta.env.DEV) console.error('Error analyzing misclassifications:', error);
        return [];
      }

      return (data || []).map((f: PredictionFeedback) => ({
        predictionId: f.prediction_id,
        riskLevel: 'Unknown',
        actualOutcome: f.actual_outcome || 'Not specified',
        confidenceGap: f.confidence_rating ? Math.abs(f.confidence_rating - 50) : 0
      }));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error in misclassification analysis:', error);
      return [];
    }
  }
}

// ============================================================================
// FRONTEND FEEDBACK COLLECTION UI HELPER
// ============================================================================

export interface FeedbackPromptProps {
  predictionId: string;
  riskLevel: string;
  riskScore: number;
  onSubmit: (feedback: PredictionFeedback) => void;
}

/**
 * Get friendly feedback prompt text
 */
export function getFeedbackPromptText(riskLevel: string): string {
  const prompts: Record<string, string> = {
    'low': 'We predicted low risk. Was this accurate?',
    'medium': 'We predicted medium risk. How did this assessment compare to your actual health outcomes?',
    'high': 'We predicted high risk. Are you taking appropriate preventive measures? Is your risk changing?',
  };

  return prompts[riskLevel.toLowerCase()] || 'Did this prediction help you understand your cardiac health?';
}

/**
 * Calculate days until feedback reminder
 */
export function getDaysSinceLastFeedback(predictions: unknown[]): number {
  if (predictions.length === 0) return 0;
  const candidate = predictions[0];
  if (!hasTimeFields(candidate)) return 0;
  const lastDate = toDate(candidate.timestamp || candidate.created_at);
  if (!lastDate) return 0;
  return daysBetween(new Date(), lastDate);
}

/**
 * Determine if feedback should be requested
 */
export function shouldRequestFeedback(lastFeedbackDate?: Date, minDaysBetween: number = 30): boolean {
  if (!lastFeedbackDate) return true;
  return daysBetween(new Date(), lastFeedbackDate) >= minDaysBetween;
}

export default FeedbackProcessor;


