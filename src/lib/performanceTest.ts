/**
 * Performance Testing Script
 * Tests execution time of critical prediction functions
 * 
 * Run this in browser console after app loads:
 * import('./src/lib/performanceTest.ts').then(m => m.runPerformanceTests())
 */

import { profiler, mark, compareImplementations, identifyBottlenecks } from './utils/performanceProfiler';
import { generateMockPrediction, generateEnsemblePredictionResult, type PatientData } from './mockData';
import { generateEnsemblePrediction } from './ensembleModel';

/**
 * Sample patient data for testing
 */
const samplePatient: PatientData = {
  age: 55,
  gender: 'male',
  chestPainType: 'typical',
  restingBP: 145,
  cholesterol: 250,
  fastingBS: true,
  restingECG: 'normal',
  maxHR: 150,
  exerciseAngina: true,
  oldpeak: 1.5,
  stSlope: 'flat',
  smoking: true,
  diabetes: true,
  previousHeartAttack: false,
  cholesterolMedication: true,
  bpMedication: true,
  lifestyleChanges: false,
  dietType: 'non-vegetarian',
  stressLevel: 7,
  sleepHours: 6,
  physicalActivity: 'low',
  hasPositiveFamilyHistory: true,
  hasHypertension: true,
  hasMentalHealthIssues: false,
  lipoproteinA: 45,
  hscrp: 2.5,
  homocysteine: 18
};

/**
 * Runs comprehensive performance tests
 * 
 * @returns Performance summary
 */
export async function runPerformanceTests(): Promise<void> {
  console.log('🚀 Starting Performance Tests...\n');
  
  // Reset profiler
  profiler.reset();
  
  // Test 1: Basic prediction performance
  console.log('📊 Test 1: Basic Prediction Generation');
  const test1 = profiler.measure(
    'generateMockPrediction',
    () => generateMockPrediction(samplePatient),
    100
  );
  console.log(`   Average: ${test1.metrics.averageTime.toFixed(3)}ms`);
  console.log(`   Min: ${test1.metrics.minTime.toFixed(3)}ms | Max: ${test1.metrics.maxTime.toFixed(3)}ms\n`);
  
  // Test 2: Ensemble prediction performance
  console.log('📊 Test 2: Ensemble Prediction Generation');
  const test2 = profiler.measure(
    'generateEnsemblePredictionResult',
    () => generateEnsemblePredictionResult(samplePatient),
    100
  );
  console.log(`   Average: ${test2.metrics.averageTime.toFixed(3)}ms`);
  console.log(`   Min: ${test2.metrics.minTime.toFixed(3)}ms | Max: ${test2.metrics.maxTime.toFixed(3)}ms\n`);
  
  // Test 3: Pure ensemble model
  console.log('📊 Test 3: Ensemble Model (Core Algorithm)');
  const test3 = profiler.measure(
    'generateEnsemblePrediction',
    () => generateEnsemblePrediction(samplePatient),
    100
  );
  console.log(`   Average: ${test3.metrics.averageTime.toFixed(3)}ms`);
  console.log(`   Min: ${test3.metrics.minTime.toFixed(3)}ms | Max: ${test3.metrics.maxTime.toFixed(3)}ms\n`);
  
  // Test 4: Batch processing
  console.log('📊 Test 4: Batch Processing (10 patients)');
  const endBatch = mark('Batch Processing');
  for (let i = 0; i < 10; i++) {
    generateMockPrediction({ ...samplePatient, age: 45 + i });
  }
  endBatch();
  console.log('');
  
  // Test 5: Different patient profiles
  console.log('📊 Test 5: Low Risk Patient');
  const lowRiskPatient: PatientData = {
    ...samplePatient,
    age: 35,
    cholesterol: 180,
    smoking: false,
    diabetes: false,
    exerciseAngina: false,
    physicalActivity: 'high',
    stressLevel: 3,
    sleepHours: 8
  };
  const test5 = profiler.measure(
    'generateMockPrediction (Low Risk)',
    () => generateMockPrediction(lowRiskPatient),
    100
  );
  console.log(`   Average: ${test5.metrics.averageTime.toFixed(3)}ms\n`);
  
  console.log('📊 Test 6: High Risk Patient');
  const highRiskPatient: PatientData = {
    ...samplePatient,
    age: 70,
    cholesterol: 300,
    previousHeartAttack: true,
    cholesterolMedication: false,
    physicalActivity: 'low',
    stressLevel: 9
  };
  const test6 = profiler.measure(
    'generateMockPrediction (High Risk)',
    () => generateMockPrediction(highRiskPatient),
    100
  );
  console.log(`   Average: ${test6.metrics.averageTime.toFixed(3)}ms\n`);
  
  // Identify bottlenecks
  console.log('🔍 Identifying Bottlenecks (>10ms):');
  const bottlenecks = identifyBottlenecks(10);
  if (bottlenecks.length > 0) {
    bottlenecks.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.functionName}: ${b.averageTime.toFixed(3)}ms`);
    });
  } else {
    console.log('   ✅ No bottlenecks found! All functions < 10ms');
  }
  console.log('');
  
  // Performance summary
  profiler.logSummary();
  
  // Recommendations
  console.log('💡 Performance Recommendations:');
  const avgEnsemble = test2.metrics.averageTime;
  const avgBasic = test1.metrics.averageTime;
  
  if (avgEnsemble < 50) {
    console.log('   ✅ Excellent performance (<50ms)');
  } else if (avgEnsemble < 100) {
    console.log('   ⚠️  Good performance, consider optimization for mobile');
  } else {
    console.log('   ❌ Performance needs improvement (>100ms)');
    console.log('   Suggestions:');
    console.log('   - Cache frequently used calculations');
    console.log('   - Memoize pure functions');
    console.log('   - Consider Web Workers for heavy computations');
  }
  
  console.log(`\n   Ensemble vs Basic: ${((avgEnsemble / avgBasic) * 100 - 100).toFixed(1)}% slower`);
  console.log(`   (This is expected due to 3-model analysis)\n`);
  
  console.log('✅ Performance Tests Complete!\n');
}

/**
 * Tests memory usage
 */
export function testMemoryUsage(): void {
  if (!('memory' in performance)) {
    console.log('⚠️  Memory API not available in this browser');
    return;
  }
  
  console.log('💾 Memory Usage Test:\n');
  
  const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
  if (!memory) {
    console.log('⚠️  Memory API not available in this browser');
    return;
  }
  
  const before = memory.usedJSHeapSize;
  
  // Generate 1000 predictions
  for (let i = 0; i < 1000; i++) {
    generateMockPrediction(samplePatient);
  }
  
  const after = memory.usedJSHeapSize;
  const increase = (after - before) / 1024 / 1024;
  
  console.log(`   Heap before: ${(before / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap after: ${(after / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Increase: ${increase.toFixed(2)} MB for 1000 predictions`);
  console.log(`   Per prediction: ${(increase / 1000 * 1024).toFixed(2)} KB\n`);
  
  if (increase > 10) {
    console.log('   ⚠️  High memory usage - check for memory leaks');
  } else {
    console.log('   ✅ Memory usage is acceptable');
  }
}

// Auto-run in development
if (import.meta.env.DEV) {
  console.log('🔬 Performance profiler loaded. Run: runPerformanceTests()');
}
