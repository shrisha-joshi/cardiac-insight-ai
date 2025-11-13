/**
 * Performance Profiling Utility
 * Measures execution time of critical functions for optimization
 * 
 * @module performance
 */

/**
 * Performance measurement result
 */
export interface PerformanceResult {
  functionName: string;
  executionTime: number; // milliseconds
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  timestamp: Date;
}

/**
 * Performance metrics collector
 */
class PerformanceProfiler {
  private measurements: Map<string, number[]> = new Map();

  /**
   * Measures execution time of a function
   * 
   * @param name - Function identifier
   * @param fn - Function to measure
   * @param iterations - Number of times to run (default: 1)
   * @returns Function result and performance metrics
   * 
   * @example
   * ```ts
   * const profiler = new PerformanceProfiler();
   * const { result, metrics } = profiler.measure('myFunction', () => {
   *   return expensiveCalculation();
   * }, 100);
   * console.log(`Average time: ${metrics.averageTime}ms`);
   * ```
   */
  measure<T>(name: string, fn: () => T, iterations: number = 1): {
    result: T;
    metrics: PerformanceResult;
  } {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = fn();
      const end = performance.now();
      times.push(end - start);
    }

    // Store measurements
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(...times);

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const metrics: PerformanceResult = {
      functionName: name,
      executionTime: totalTime,
      iterations,
      averageTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      timestamp: new Date()
    };

    return { result: result!, metrics };
  }

  /**
   * Measures async function execution time
   * 
   * @param name - Function identifier
   * @param fn - Async function to measure
   * @param iterations - Number of times to run
   * @returns Promise with result and metrics
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    iterations: number = 1
  ): Promise<{
    result: T;
    metrics: PerformanceResult;
  }> {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = await fn();
      const end = performance.now();
      times.push(end - start);
    }

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(...times);

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const metrics: PerformanceResult = {
      functionName: name,
      executionTime: totalTime,
      iterations,
      averageTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      timestamp: new Date()
    };

    return { result: result!, metrics };
  }

  /**
   * Gets all measurements for a function
   * 
   * @param name - Function identifier
   * @returns Array of execution times
   */
  getMeasurements(name: string): number[] {
    return this.measurements.get(name) || [];
  }

  /**
   * Gets summary statistics for all measured functions
   * 
   * @returns Array of performance results
   */
  getSummary(): PerformanceResult[] {
    const summary: PerformanceResult[] = [];

    this.measurements.forEach((times, name) => {
      const totalTime = times.reduce((sum, t) => sum + t, 0);
      summary.push({
        functionName: name,
        executionTime: totalTime,
        iterations: times.length,
        averageTime: totalTime / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        timestamp: new Date()
      });
    });

    return summary.sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * Clears all measurements
   */
  reset(): void {
    this.measurements.clear();
  }

  /**
   * Logs performance summary to console (DEV only)
   */
  logSummary(): void {
    if (!import.meta.env.DEV) return;

    const summary = this.getSummary();
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         PERFORMANCE PROFILING SUMMARY                     ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    summary.forEach((result, index) => {
      console.log(`║ ${index + 1}. ${result.functionName.padEnd(35)} ║`);
      console.log(`║    Avg: ${result.averageTime.toFixed(3)}ms | Min: ${result.minTime.toFixed(3)}ms | Max: ${result.maxTime.toFixed(3)}ms    ║`);
      console.log(`║    Iterations: ${result.iterations}                           ║`);
      console.log('╠════════════════════════════════════════════════════════════╣');
    });
    
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }
}

// Singleton instance
export const profiler = new PerformanceProfiler();

/**
 * Decorator for measuring function performance (TypeScript experimental)
 * 
 * @param target - Target object
 * @param propertyKey - Function name
 * @param descriptor - Property descriptor
 * 
 * @example
 * ```ts
 * class MyClass {
 *   @measurePerformance
 *   expensiveMethod() {
 *     // ... complex logic
 *   }
 * }
 * ```
 */
export function measurePerformance(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();

    if (import.meta.env.DEV) {
      console.log(`⏱️ ${propertyKey}: ${(end - start).toFixed(3)}ms`);
    }

    return result;
  };

  return descriptor;
}

/**
 * Simple performance marker for quick measurements
 * 
 * @param label - Marker label
 * @returns Function to call when measurement complete
 * 
 * @example
 * ```ts
 * const endMeasure = mark('Data Processing');
 * // ... do work
 * endMeasure(); // Logs: "⏱️ Data Processing: 45.234ms"
 * ```
 */
export function mark(label: string): () => void {
  const start = performance.now();
  
  return () => {
    const end = performance.now();
    if (import.meta.env.DEV) {
      console.log(`⏱️ ${label}: ${(end - start).toFixed(3)}ms`);
    }
  };
}

/**
 * Identifies performance bottlenecks
 * 
 * @param threshold - Time threshold in ms (default: 100ms)
 * @returns Array of slow operations
 */
export function identifyBottlenecks(threshold: number = 100): PerformanceResult[] {
  return profiler.getSummary().filter(result => result.averageTime > threshold);
}

/**
 * Compares performance between two implementations
 * 
 * @param name1 - First implementation name
 * @param fn1 - First implementation
 * @param name2 - Second implementation name
 * @param fn2 - Second implementation
 * @param iterations - Number of iterations (default: 100)
 * @returns Comparison result
 */
export function compareImplementations<T>(
  name1: string,
  fn1: () => T,
  name2: string,
  fn2: () => T,
  iterations: number = 100
): {
  faster: string;
  improvement: number;
  results1: PerformanceResult;
  results2: PerformanceResult;
} {
  const { metrics: results1 } = profiler.measure(name1, fn1, iterations);
  const { metrics: results2 } = profiler.measure(name2, fn2, iterations);

  const faster = results1.averageTime < results2.averageTime ? name1 : name2;
  const slower = faster === name1 ? results2.averageTime : results1.averageTime;
  const fasterTime = faster === name1 ? results1.averageTime : results2.averageTime;
  const improvement = ((slower - fasterTime) / slower) * 100;

  if (import.meta.env.DEV) {
    console.log(`\n🏁 Performance Comparison:`);
    console.log(`   ${name1}: ${results1.averageTime.toFixed(3)}ms`);
    console.log(`   ${name2}: ${results2.averageTime.toFixed(3)}ms`);
    console.log(`   Winner: ${faster} (${improvement.toFixed(1)}% faster)\n`);
  }

  return { faster, improvement, results1, results2 };
}
