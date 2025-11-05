/**
 * Testing Utilities & Mock Data
 * 
 * Complete testing infrastructure with mock services, data generators,
 * and test helpers for unit and integration testing.
 * 
 * Created: November 4, 2025
 */

import type { PatientData, PredictionResult } from '../lib/mockData';

/**
 * Mock patient data generator
 */
export function generateMockPatient(overrides?: Partial<PatientData>): PatientData {
  const basePatient: PatientData = {
    age: 45,
    gender: 'male',
    chestPainType: 'typical',
    restingBP: 130,
    cholesterol: 240,
    fastingBS: false,
    restingECG: 'normal',
    maxHR: 150,
    exerciseAngina: false,
    oldpeak: 1.2,
    stSlope: 'flat',
    smoking: false,
    diabetes: false,
    previousHeartAttack: false,
    cholesterolMedication: false,
    bpMedication: false,
    lifestyleChanges: false,
    dietType: 'non-vegetarian',
    stressLevel: 5,
    sleepHours: 7,
    physicalActivity: 'moderate',
  };

  return { ...basePatient, ...overrides };
}

/**
 * Generate multiple mock patients with variations
 */
export function generateMockPatientBatch(count: number): PatientData[] {
  const patients: PatientData[] = [];
  const genders: Array<'male' | 'female'> = ['male', 'female'];
  const chestPainTypes: Array<PatientData['chestPainType']> = ['typical', 'atypical', 'non-anginal', 'asymptomatic'];
  const diets: Array<PatientData['dietType']> = ['vegetarian', 'non-vegetarian', 'vegan'];
  const activities: Array<PatientData['physicalActivity']> = ['low', 'moderate', 'high'];

  for (let i = 0; i < count; i++) {
    patients.push(
      generateMockPatient({
        age: Math.floor(Math.random() * 80) + 20,
        gender: genders[Math.floor(Math.random() * genders.length)],
        chestPainType: chestPainTypes[Math.floor(Math.random() * chestPainTypes.length)],
        restingBP: Math.floor(Math.random() * 100) + 90,
        cholesterol: Math.floor(Math.random() * 200) + 100,
        fastingBS: Math.random() > 0.7,
        maxHR: Math.floor(Math.random() * 100) + 100,
        exerciseAngina: Math.random() > 0.7,
        stressLevel: Math.floor(Math.random() * 9) + 1,
        sleepHours: Math.random() * 8 + 4,
        smoking: Math.random() > 0.7,
        diabetes: Math.random() > 0.8,
        dietType: diets[Math.floor(Math.random() * diets.length)],
        physicalActivity: activities[Math.floor(Math.random() * activities.length)],
      })
    );
  }

  return patients;
}

/**
 * Generate mock prediction result
 */
export function generateMockPrediction(
  patientData?: PatientData,
  overrides?: Partial<PredictionResult>
): PredictionResult {
  const patient = patientData || generateMockPatient();
  const riskScore = Math.floor(Math.random() * 100);
  const riskLevel: 'low' | 'medium' | 'high' =
    riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high';

  return {
    id: `pred-${Date.now()}-${Math.random()}`,
    patientData: patient,
    riskScore,
    riskLevel,
    prediction: riskScore > 50 ? 'Risk' : 'No Risk',
    confidence: Math.random() * 0.3 + 0.7,
    timestamp: new Date(),
    explanation: `Based on analysis of patient data, the risk score is ${riskScore}%.`,
    recommendations: [
      'Regular cardiac monitoring',
      'Maintain healthy lifestyle',
      'Follow prescribed medications',
    ],
    ...overrides,
  };
}

/**
 * Mock API response handler
 */
export class MockApiService {
  private delay: number;
  private shouldFail: boolean = false;

  constructor(delayMs: number = 500) {
    this.delay = delayMs;
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  async getPrediction(patientData: PatientData): Promise<PredictionResult> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error('Mock API Error: Prediction failed');
    }

    return generateMockPrediction(patientData);
  }

  async getPredictions(ids: string[]): Promise<PredictionResult[]> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error('Mock API Error: Failed to fetch predictions');
    }

    return ids.map(id => ({
      ...generateMockPrediction(),
      id,
    }));
  }

  async savePrediction(prediction: PredictionResult): Promise<string> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error('Mock API Error: Failed to save prediction');
    }

    return prediction.id;
  }

  async updatePrediction(id: string, updates: Partial<PredictionResult>): Promise<boolean> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error('Mock API Error: Failed to update prediction');
    }

    return true;
  }

  async deletePrediction(id: string): Promise<boolean> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error('Mock API Error: Failed to delete prediction');
    }

    return true;
  }

  async generateReport(patientId: string): Promise<string> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error('Mock API Error: Failed to generate report');
    }

    return `Report for patient ${patientId}`;
  }
}

/**
 * Test data validators
 */
export class TestDataValidator {
  static validatePatientData(patient: PatientData): string[] {
    const errors: string[] = [];

    if (patient.age < 18 || patient.age > 120) {
      errors.push('Invalid age');
    }

    if (!['male', 'female'].includes(patient.gender)) {
      errors.push('Invalid gender');
    }

    if (patient.restingBP < 60 || patient.restingBP > 250) {
      errors.push('Invalid blood pressure');
    }

    if (patient.cholesterol < 0 || patient.cholesterol > 500) {
      errors.push('Invalid cholesterol');
    }

    if (patient.maxHR < 20 || patient.maxHR > 250) {
      errors.push('Invalid max heart rate');
    }

    return errors;
  }

  static validatePredictionResult(prediction: PredictionResult): string[] {
    const errors: string[] = [];

    if (prediction.riskScore < 0 || prediction.riskScore > 100) {
      errors.push('Invalid risk score');
    }

    if (!['low', 'medium', 'high'].includes(prediction.riskLevel)) {
      errors.push('Invalid risk level');
    }

    if (prediction.confidence < 0 || prediction.confidence > 1) {
      errors.push('Invalid confidence');
    }

    return errors;
  }
}

/**
 * Test helpers for React components
 */
export class ComponentTestHelper {
  static createMockProps(overrides?: Record<string, any>) {
    return {
      onSubmit: () => {},
      onCancel: () => {},
      isLoading: false,
      ...overrides,
    };
  }

  static waitForAsync(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  static mockLocalStorage() {
    const store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key]);
      },
    };
  }

  static mockFetch(responses: Record<string, any>) {
    return (url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[url] || {}),
      });
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  private startTime: number = 0;
  private marks: Map<string, number> = new Map();

  start(): void {
    this.startTime = performance.now();
  }

  mark(label: string): void {
    this.marks.set(label, performance.now() - this.startTime);
  }

  measure(label: string): number {
    return (this.marks.get(label) || 0);
  }

  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.marks.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }

  reset(): void {
    this.startTime = 0;
    this.marks.clear();
  }

  printReport(): void {
    console.table(this.getMetrics());
  }
}

/**
 * Test timeout helper
 */
export function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry test function
 */
export async function retryTest(
  testFn: () => Promise<void>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<void> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await testFn();
      return;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await timeout(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Create mock response
 */
export function createMockResponse<T>(data: T, statusCode: number = 200) {
  return {
    status: statusCode,
    statusText: statusCode === 200 ? 'OK' : 'Error',
    data,
    headers: { 'content-type': 'application/json' },
    config: {},
  };
}

/**
 * Create mock error
 */
export function createMockError(message: string, statusCode: number = 500) {
  const error = new Error(message);
  (error as any).response = {
    status: statusCode,
    data: { message },
  };
  return error;
}

export default {
  generateMockPatient,
  generateMockPatientBatch,
  generateMockPrediction,
  MockApiService,
  TestDataValidator,
  ComponentTestHelper,
  PerformanceTester,
  timeout,
  retryTest,
  createMockResponse,
  createMockError,
};
