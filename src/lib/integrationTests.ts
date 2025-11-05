/**
 * Integration Test Suite
 * 
 * Comprehensive integration tests for the cardiac assessment system.
 * Tests API integration, data flow, and end-to-end workflows.
 * 
 * Created: November 4, 2025
 */

import {
  generateMockPatient,
  generateMockPatientBatch,
  generateMockPrediction,
  MockApiService,
  TestDataValidator,
  PerformanceTester,
} from '../lib/testingUtils';
import type { PatientData, PredictionResult } from '../lib/mockData';

/**
 * Integration Test Suite
 */
export class IntegrationTestSuite {
  private mockApi: MockApiService;
  private performanceTester: PerformanceTester;

  constructor() {
    this.mockApi = new MockApiService(100);
    this.performanceTester = new PerformanceTester();
  }

  /**
   * Test: Patient data submission workflow
   */
  async testPatientDataSubmission(): Promise<boolean> {
    console.log('Testing patient data submission workflow...');
    this.performanceTester.start();

    try {
      const patientData = generateMockPatient({
        age: 55,
        gender: 'male',
        restingBP: 140,
        cholesterol: 280,
        smoking: true,
      });

      // Validate patient data
      const validationErrors = TestDataValidator.validatePatientData(patientData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      this.performanceTester.mark('validation_complete');

      // Get prediction
      const prediction = await this.mockApi.getPrediction(patientData);
      this.performanceTester.mark('prediction_complete');

      // Validate prediction
      const predictionErrors = TestDataValidator.validatePredictionResult(prediction);
      if (predictionErrors.length > 0) {
        throw new Error(`Prediction validation failed: ${predictionErrors.join(', ')}`);
      }

      // Save prediction
      const savedId = await this.mockApi.savePrediction(prediction);
      this.performanceTester.mark('save_complete');

      console.log('✓ Patient data submission workflow passed');
      console.log('Performance metrics:', this.performanceTester.getMetrics());
      return true;
    } catch (error) {
      console.error('✗ Patient data submission workflow failed:', error);
      return false;
    }
  }

  /**
   * Test: Batch processing workflow
   */
  async testBatchProcessing(): Promise<boolean> {
    console.log('Testing batch processing workflow...');
    this.performanceTester.start();

    try {
      const patients = generateMockPatientBatch(10);
      this.performanceTester.mark('batch_generated');

      const predictions: PredictionResult[] = [];
      for (const patient of patients) {
        const prediction = await this.mockApi.getPrediction(patient);
        predictions.push(prediction);
      }

      this.performanceTester.mark('predictions_complete');

      // Validate all predictions
      const allValid = predictions.every(pred => {
        const errors = TestDataValidator.validatePredictionResult(pred);
        return errors.length === 0;
      });

      if (!allValid) {
        throw new Error('Some predictions failed validation');
      }

      this.performanceTester.mark('validation_complete');

      console.log(`✓ Batch processing passed (${predictions.length} predictions)`);
      console.log('Performance metrics:', this.performanceTester.getMetrics());
      return true;
    } catch (error) {
      console.error('✗ Batch processing failed:', error);
      return false;
    }
  }

  /**
   * Test: Error handling and recovery
   */
  async testErrorHandling(): Promise<boolean> {
    console.log('Testing error handling and recovery...');

    try {
      // Simulate API failure
      this.mockApi.setShouldFail(true);

      const patientData = generateMockPatient();

      try {
        await this.mockApi.getPrediction(patientData);
        throw new Error('Should have failed but did not');
      } catch (error) {
        if ((error as Error).message !== 'Should have failed but did not') {
          // Expected failure
        } else {
          throw error;
        }
      }

      // Restore API functionality
      this.mockApi.setShouldFail(false);

      // Retry should succeed
      const prediction = await this.mockApi.getPrediction(patientData);
      if (!prediction || !prediction.id) {
        throw new Error('Retry failed');
      }

      console.log('✓ Error handling and recovery passed');
      return true;
    } catch (error) {
      console.error('✗ Error handling failed:', error);
      return false;
    }
  }

  /**
   * Test: Report generation workflow
   */
  async testReportGeneration(): Promise<boolean> {
    console.log('Testing report generation workflow...');
    this.performanceTester.start();

    try {
      const patientData = generateMockPatient();
      const prediction = await this.mockApi.getPrediction(patientData);

      this.performanceTester.mark('prediction_created');

      const report = await this.mockApi.generateReport(prediction.id);

      this.performanceTester.mark('report_generated');

      if (!report || report.length === 0) {
        throw new Error('Report generation failed');
      }

      console.log('✓ Report generation workflow passed');
      console.log('Performance metrics:', this.performanceTester.getMetrics());
      return true;
    } catch (error) {
      console.error('✗ Report generation failed:', error);
      return false;
    }
  }

  /**
   * Test: Data persistence workflow
   */
  async testDataPersistence(): Promise<boolean> {
    console.log('Testing data persistence workflow...');

    try {
      const patientData = generateMockPatient();
      const prediction = await this.mockApi.getPrediction(patientData);

      // Save prediction
      const savedId = await this.mockApi.savePrediction(prediction);
      if (savedId !== prediction.id) {
        throw new Error('Save failed');
      }

      // Update prediction
      const updated = await this.mockApi.updatePrediction(savedId, {
        ...prediction,
        riskLevel: 'high',
      });

      if (!updated) {
        throw new Error('Update failed');
      }

      // Retrieve prediction
      const [retrieved] = await this.mockApi.getPredictions([savedId]);
      if (!retrieved || retrieved.id !== savedId) {
        throw new Error('Retrieve failed');
      }

      // Delete prediction
      const deleted = await this.mockApi.deletePrediction(savedId);
      if (!deleted) {
        throw new Error('Delete failed');
      }

      console.log('✓ Data persistence workflow passed');
      return true;
    } catch (error) {
      console.error('✗ Data persistence failed:', error);
      return false;
    }
  }

  /**
   * Test: Performance under load
   */
  async testPerformanceUnderLoad(): Promise<boolean> {
    console.log('Testing performance under load...');
    this.performanceTester.start();

    try {
      const concurrentRequests = 20;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const patientData = generateMockPatient();
        promises.push(this.mockApi.getPrediction(patientData));
      }

      const results = await Promise.all(promises);
      this.performanceTester.mark('all_requests_complete');

      if (results.length !== concurrentRequests) {
        throw new Error('Not all requests completed');
      }

      const metrics = this.performanceTester.getMetrics();
      const totalTime = metrics.all_requests_complete;

      console.log(`✓ Performance test passed (${concurrentRequests} concurrent requests in ${totalTime}ms)`);
      return true;
    } catch (error) {
      console.error('✗ Performance test failed:', error);
      return false;
    }
  }

  /**
   * Test: Data validation edge cases
   */
  async testValidationEdgeCases(): Promise<boolean> {
    console.log('Testing validation edge cases...');

    try {
      const testCases = [
        // Very young patient
        generateMockPatient({ age: 20 }),
        // Very old patient
        generateMockPatient({ age: 100 }),
        // Extreme BP
        generateMockPatient({ restingBP: 250 }),
        // Extreme cholesterol
        generateMockPatient({ cholesterol: 500 }),
        // All risk factors present
        generateMockPatient({
          age: 70,
          smoking: true,
          diabetes: true,
          exerciseAngina: true,
          stressLevel: 10,
          sleepHours: 4,
        }),
      ];

      let passed = 0;
      for (const patient of testCases) {
        const errors = TestDataValidator.validatePatientData(patient);
        if (errors.length === 0) {
          passed++;
        } else {
          console.warn(`Validation errors for patient:`, errors);
        }
      }

      console.log(`✓ Validation edge cases passed (${passed}/${testCases.length})`);
      return passed === testCases.length;
    } catch (error) {
      console.error('✗ Validation edge cases failed:', error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResults> {
    console.log('\n========================================');
    console.log('Running Integration Test Suite');
    console.log('========================================\n');

    const results: TestResults = {
      patientDataSubmission: await this.testPatientDataSubmission(),
      batchProcessing: await this.testBatchProcessing(),
      errorHandling: await this.testErrorHandling(),
      reportGeneration: await this.testReportGeneration(),
      dataPersistence: await this.testDataPersistence(),
      performanceUnderLoad: await this.testPerformanceUnderLoad(),
      validationEdgeCases: await this.testValidationEdgeCases(),
    };

    // Print summary
    console.log('\n========================================');
    console.log('Test Results Summary');
    console.log('========================================\n');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.values(results).length;

    Object.entries(results).forEach(([name, passed]) => {
      console.log(`${passed ? '✓' : '✗'} ${name}`);
    });

    console.log(`\nTotal: ${passed}/${total} tests passed`);
    console.log('========================================\n');

    return results;
  }
}

/**
 * Test results interface
 */
export interface TestResults {
  patientDataSubmission: boolean;
  batchProcessing: boolean;
  errorHandling: boolean;
  reportGeneration: boolean;
  dataPersistence: boolean;
  performanceUnderLoad: boolean;
  validationEdgeCases: boolean;
}

/**
 * Run tests
 */
export async function runIntegrationTests(): Promise<void> {
  const suite = new IntegrationTestSuite();
  const results = await suite.runAllTests();

  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).length;

  if (passedCount === totalCount) {
    console.log('🎉 All integration tests passed!');
  } else {
    console.log(`⚠️  ${totalCount - passedCount} test(s) failed`);
    process.exit(1);
  }
}

// Export for use in test runners
export default {
  IntegrationTestSuite,
  runIntegrationTests,
};
