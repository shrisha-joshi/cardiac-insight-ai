/**
 * Common utility functions for calculations across the application
 * Extracted to reduce code duplication and improve maintainability
 */

/**
 * Clamps a value between min and max bounds
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Constrains a percentage value between 0 and 100
 * @param value - The percentage value to constrain
 * @returns Value constrained to 0-100 range
 */
export function constrainPercentage(value: number): number {
  return clamp(value, 0, 100);
}

/**
 * Converts a decimal to percentage (0.75 -> 75)
 * @param decimal - Decimal value (0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage value
 */
export function toPercentage(decimal: number, decimals: number = 1): number {
  return Number((decimal * 100).toFixed(decimals));
}

/**
 * Converts percentage to decimal (75 -> 0.75)
 * @param percentage - Percentage value (0-100)
 * @returns Decimal value (0-1)
 */
export function toDecimal(percentage: number): number {
  return percentage / 100;
}

/**
 * Calculates percentage change between two values
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change (can be negative)
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculates weighted average of values
 * @param values - Array of values
 * @param weights - Array of weights (must sum to 1.0 or will be normalized)
 * @returns Weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length) {
    throw new Error('Values and weights arrays must have same length');
  }
  
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / weightSum);
  
  return values.reduce((sum, val, idx) => sum + val * normalizedWeights[idx], 0);
}

/**
 * Rounds a number to specified decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

/**
 * Calculates risk score adjustment based on age
 * @param age - Patient age in years
 * @param baseAgeThreshold - Base age for risk calculation (default: 45)
 * @param riskPerYear - Risk increase per year above threshold (default: 0.5)
 * @returns Risk adjustment value
 */
export function calculateAgeRiskAdjustment(
  age: number,
  baseAgeThreshold: number = 45,
  riskPerYear: number = 0.5
): number {
  if (age <= baseAgeThreshold) return 0;
  return (age - baseAgeThreshold) * riskPerYear;
}

/**
 * Normalizes a value to 0-1 range using min-max normalization
 * @param value - Value to normalize
 * @param min - Minimum value in range
 * @param max - Maximum value in range
 * @returns Normalized value (0-1)
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/**
 * Calculates standard deviation of an array of numbers
 * @param values - Array of numbers
 * @returns Standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculates mean (average) of an array of numbers
 * @param values - Array of numbers
 * @returns Mean value
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculates median of an array of numbers
 * @param values - Array of numbers
 * @returns Median value
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Interpolates between two values based on a factor
 * @param start - Start value
 * @param end - End value
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * clamp(factor, 0, 1);
}

/**
 * Applies sigmoid function for smooth transitions
 * @param x - Input value
 * @param steepness - Controls curve steepness (default: 1)
 * @returns Sigmoid output (0-1)
 */
export function sigmoid(x: number, steepness: number = 1): number {
  return 1 / (1 + Math.exp(-steepness * x));
}
