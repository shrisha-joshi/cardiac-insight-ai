/**
 * Risk calculation and scoring utilities
 * Centralized risk assessment logic
 */

import { constrainPercentage, clamp, weightedAverage } from './calculationUtils';

/**
 * Risk level categories
 */
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';

/**
 * Risk category thresholds
 */
export const RISK_THRESHOLDS = {
  LOW: 20,
  MODERATE: 40,
  HIGH: 60,
  VERY_HIGH: 80
} as const;

/**
 * Determines risk level based on risk score
 * @param riskScore - Risk score (0-100)
 * @returns Risk level category
 */
export function getRiskLevel(riskScore: number): RiskLevel {
  const score = constrainPercentage(riskScore);
  
  if (score < RISK_THRESHOLDS.LOW) return 'low';
  if (score < RISK_THRESHOLDS.MODERATE) return 'moderate';
  if (score < RISK_THRESHOLDS.HIGH) return 'high';
  return 'very-high';
}

/**
 * Gets risk level color for UI display
 * @param riskLevel - Risk level
 * @returns Tailwind color class
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    'low': 'text-green-600',
    'moderate': 'text-yellow-600',
    'high': 'text-orange-600',
    'very-high': 'text-red-600'
  };
  return colors[riskLevel];
}

/**
 * Gets risk level background color for UI display
 * @param riskLevel - Risk level
 * @returns Tailwind background color class
 */
export function getRiskBgColor(riskLevel: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    'low': 'bg-green-100',
    'moderate': 'bg-yellow-100',
    'high': 'bg-orange-100',
    'very-high': 'bg-red-100'
  };
  return colors[riskLevel];
}

/**
 * Calculates composite risk score from multiple factors
 * @param factors - Object with risk factor names and scores
 * @param weights - Object with risk factor names and weights
 * @returns Composite risk score (0-100)
 */
export function calculateCompositeRisk(
  factors: Record<string, number>,
  weights: Record<string, number>
): number {
  const factorNames = Object.keys(factors);
  const values = factorNames.map(name => factors[name]);
  const weightValues = factorNames.map(name => weights[name] || 0);
  
  const compositeScore = weightedAverage(values, weightValues);
  return constrainPercentage(compositeScore);
}

/**
 * Applies risk adjustment multiplier
 * @param baseRisk - Base risk score (0-100)
 * @param multiplier - Risk multiplier (e.g., 1.5 for 50% increase)
 * @returns Adjusted risk score (0-100)
 */
export function applyRiskMultiplier(baseRisk: number, multiplier: number): number {
  return constrainPercentage(baseRisk * multiplier);
}

/**
 * Adds risk adjustment value
 * @param baseRisk - Base risk score (0-100)
 * @param adjustment - Risk adjustment value (can be negative)
 * @returns Adjusted risk score (0-100)
 */
export function addRiskAdjustment(baseRisk: number, adjustment: number): number {
  return constrainPercentage(baseRisk + adjustment);
}

/**
 * Calculates confidence interval for risk score
 * @param riskScore - Risk score (0-100)
 * @param confidence - Confidence level (0-1, typically 0.95)
 * @param standardError - Standard error of measurement
 * @returns Object with lower and upper bounds
 */
export function calculateConfidenceInterval(
  riskScore: number,
  confidence: number = 0.95,
  standardError: number = 5
): { lower: number; upper: number } {
  // Z-score for confidence level (1.96 for 95%)
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
  const margin = zScore * standardError;
  
  return {
    lower: constrainPercentage(riskScore - margin),
    upper: constrainPercentage(riskScore + margin)
  };
}

/**
 * Assesses risk trend from historical scores
 * @param scores - Array of historical risk scores (chronological order)
 * @returns Trend direction and rate of change
 */
export function assessRiskTrend(scores: number[]): {
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  significance: 'significant' | 'moderate' | 'minimal';
} {
  if (scores.length < 2) {
    return { trend: 'stable', changeRate: 0, significance: 'minimal' };
  }
  
  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];
  const changeRate = ((lastScore - firstScore) / firstScore) * 100;
  
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(changeRate) < 5) {
    trend = 'stable';
  } else if (changeRate > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }
  
  let significance: 'significant' | 'moderate' | 'minimal';
  const absChange = Math.abs(changeRate);
  if (absChange >= 20) {
    significance = 'significant';
  } else if (absChange >= 10) {
    significance = 'moderate';
  } else {
    significance = 'minimal';
  }
  
  return { trend, changeRate, significance };
}

/**
 * Normalizes risk scores from different scales to 0-100
 * @param score - Original score
 * @param minScore - Minimum possible score in original scale
 * @param maxScore - Maximum possible score in original scale
 * @returns Normalized score (0-100)
 */
export function normalizeRiskScore(
  score: number,
  minScore: number,
  maxScore: number
): number {
  if (maxScore === minScore) return 50; // Default to moderate risk
  const normalized = ((score - minScore) / (maxScore - minScore)) * 100;
  return constrainPercentage(normalized);
}

/**
 * Combines multiple risk scores using maximum operator (worst-case)
 * @param scores - Array of risk scores
 * @returns Maximum risk score
 */
export function maxRiskScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return constrainPercentage(Math.max(...scores));
}

/**
 * Combines multiple risk scores using average
 * @param scores - Array of risk scores
 * @returns Average risk score
 */
export function avgRiskScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return constrainPercentage(sum / scores.length);
}

/**
 * Calculates risk reduction percentage from intervention
 * @param baselineRisk - Risk before intervention (0-100)
 * @param currentRisk - Risk after intervention (0-100)
 * @returns Percentage reduction (positive = improvement)
 */
export function calculateRiskReduction(
  baselineRisk: number,
  currentRisk: number
): number {
  if (baselineRisk === 0) return 0;
  return ((baselineRisk - currentRisk) / baselineRisk) * 100;
}
