/**
 * Data Processing Utilities
 * 
 * Common patterns for data processing, validation, and transformation
 * Extracted to eliminate duplication across analysis services
 */

/**
 * Calculate percentage change between two values
 * 
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @returns Percentage change (positive for increase, negative for decrease)
 * 
 * @example
 * ```typescript
 * percentageChange(100, 110) // returns 10
 * percentageChange(100, 90)  // returns -10
 * ```
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate average of an array of numbers
 * 
 * @param values - Array of numbers
 * @returns Average value, or 0 if array is empty
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate median of an array of numbers
 * 
 * @param values - Array of numbers
 * @returns Median value
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate standard deviation of an array of numbers
 * 
 * @param values - Array of numbers
 * @returns Standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = average(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  
  return Math.sqrt(avgSquareDiff);
}

/**
 * Find minimum value in an array
 * 
 * @param values - Array of numbers
 * @returns Minimum value, or 0 if array is empty
 */
export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * Find maximum value in an array
 * 
 * @param values - Array of numbers
 * @returns Maximum value, or 0 if array is empty
 */
export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Calculate sum of an array of numbers
 * 
 * @param values - Array of numbers
 * @returns Sum of all values
 */
export function sum(values: number[]): number {
  return values.reduce((total, val) => total + val, 0);
}

/**
 * Normalize value to 0-100 range
 * 
 * @param value - Value to normalize
 * @param min - Minimum possible value
 * @param max - Maximum possible value
 * @returns Normalized value between 0 and 100
 */
export function normalizeToPercentage(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

/**
 * Check if a value is within a range (inclusive)
 * 
 * @param value - Value to check
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Round number to specified decimal places
 * 
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Check if a value is a valid number (not NaN or Infinity)
 * 
 * @param value - Value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(value: number): boolean {
  return !isNaN(value) && isFinite(value);
}

/**
 * Safe division that returns 0 if denominator is 0
 * 
 * @param numerator - Numerator
 * @param denominator - Denominator
 * @returns Result of division, or 0 if denominator is 0
 */
export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate variance of an array of numbers
 * 
 * @param values - Array of numbers
 * @returns Variance
 */
export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = average(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  
  return average(squareDiffs);
}

/**
 * Calculate coefficient of variation (CV)
 * Measure of relative variability
 * 
 * @param values - Array of numbers
 * @returns Coefficient of variation as percentage
 */
export function coefficientOfVariation(values: number[]): number {
  const avg = average(values);
  if (avg === 0) return 0;
  
  const stdDev = standardDeviation(values);
  return (stdDev / avg) * 100;
}

/**
 * Remove outliers from array using IQR method
 * 
 * @param values - Array of numbers
 * @param multiplier - IQR multiplier (default: 1.5)
 * @returns Array with outliers removed
 */
export function removeOutliers(values: number[], multiplier: number = 1.5): number[] {
  if (values.length < 4) return values;
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - (multiplier * iqr);
  const upperBound = q3 + (multiplier * iqr);
  
  return values.filter(v => v >= lowerBound && v <= upperBound);
}

/**
 * Calculate moving average over a window
 * 
 * @param values - Array of numbers
 * @param windowSize - Size of moving window
 * @returns Array of moving averages
 */
export function movingAverage(values: number[], windowSize: number): number[] {
  if (windowSize <= 0 || windowSize > values.length) {
    return values;
  }
  
  const result: number[] = [];
  
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    result.push(average(window));
  }
  
  return result;
}

/**
 * Interpolate missing values in an array
 * 
 * @param values - Array that may contain null/undefined
 * @returns Array with interpolated values
 */
export function interpolateMissing(values: (number | null | undefined)[]): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) {
      result.push(values[i] as number);
    } else {
      // Find previous and next valid values
      let prev: number | null = null;
      let next: number | null = null;
      
      for (let j = i - 1; j >= 0; j--) {
        if (values[j] != null) {
          prev = values[j] as number;
          break;
        }
      }
      
      for (let j = i + 1; j < values.length; j++) {
        if (values[j] != null) {
          next = values[j] as number;
          break;
        }
      }
      
      // Interpolate or use available value
      if (prev !== null && next !== null) {
        result.push((prev + next) / 2);
      } else if (prev !== null) {
        result.push(prev);
      } else if (next !== null) {
        result.push(next);
      } else {
        result.push(0);
      }
    }
  }
  
  return result;
}

/**
 * Group array elements into chunks of specified size
 * 
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
}

/**
 * Calculate z-score for a value
 * 
 * @param value - Value to calculate z-score for
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation
 * @returns Z-score
 */
export function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Check if value is an outlier using z-score method
 * 
 * @param value - Value to check
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation
 * @param threshold - Z-score threshold (default: 3)
 * @returns True if value is an outlier
 */
export function isOutlier(value: number, mean: number, stdDev: number, threshold: number = 3): boolean {
  const z = Math.abs(zScore(value, mean, stdDev));
  return z > threshold;
}
