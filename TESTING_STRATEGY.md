# TESTING STRATEGY & IMPLEMENTATION GUIDE

## Overview
This document outlines the testing strategy to achieve 80%+ code coverage for the Cardiac Insight AI application.

## Current Status
- **Unit Test Coverage:** ~30%
- **Integration Test Coverage:** ~10%
- **E2E Test Coverage:** 0%
- **Target:** 80%+ coverage

## Testing Pyramid

```
        ┌────────┐
        │   E2E  │   5-10% of tests
        │ Tests  │   (Real user workflows)
        ├────────┤
        │  Inte- │   20-30% of tests
        │ gration│   (Component interactions)
        │ Tests  │
        ├────────┤
        │ Unit   │   60-75% of tests
        │ Tests  │   (Individual functions)
        └────────┘
```

## 1. UNIT TESTS

### Target Files & Coverage

#### A. Utility Functions (PRIORITY 1)

**File:** `src/lib/edgeCaseHandler.ts`
**Coverage:** All functions
**Test Cases:**

```typescript
// __tests__/edgeCaseHandler.test.ts

import { describe, it, expect } from 'vitest';
import {
  validateAge,
  validateBloodPressure,
  validateCholesterol,
  validateHeartRate,
  validatePatientDataComprehensive,
  detectConflictingData,
  detectOutliers,
} from '@/lib/edgeCaseHandler';
import { defaultPatientData } from '@/lib/mockData';

describe('Edge Case Handler', () => {
  describe('validateAge', () => {
    it('should pass for valid age', () => {
      const result = validateAge(45);
      expect(result).toBeNull();
    });

    it('should fail for age < 18', () => {
      const result = validateAge(15);
      expect(result?.severity).toBe('error');
      expect(result?.valid).toBe(false);
    });

    it('should fail for age > 130', () => {
      const result = validateAge(150);
      expect(result?.severity).toBe('error');
    });

    it('should warn for age > 120', () => {
      const result = validateAge(125);
      expect(result?.severity).toBe('warning');
    });

    it('should warn for young age < 25', () => {
      const result = validateAge(22);
      expect(result?.severity).toBe('info');
    });

    it('should return null for undefined', () => {
      const result = validateAge(undefined);
      expect(result).toBeNull();
    });
  });

  describe('validateBloodPressure', () => {
    it('should pass for valid BP', () => {
      const result = validateBloodPressure(120, 80);
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0);
    });

    it('should detect BP inversion', () => {
      const result = validateBloodPressure(80, 120);
      expect(result.some(r => r.field === 'bloodPressure' && r.severity === 'error')).toBe(true);
    });

    it('should warn for very close systolic/diastolic', () => {
      const result = validateBloodPressure(125, 120);
      expect(result.some(r => r.severity === 'warning')).toBe(true);
    });

    it('should validate out-of-range values', () => {
      const result = validateBloodPressure(350, 250);
      expect(result.some(r => r.severity === 'error')).toBe(true);
    });
  });

  describe('validateCholesterol', () => {
    it('should pass for valid lipid levels', () => {
      const result = validateCholesterol(200, 60, 100, 100);
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0);
    });

    it('should warn for low HDL', () => {
      const result = validateCholesterol(200, 35, 100, 100);
      expect(result.some(r => r.field === 'hdl' && r.severity === 'warning')).toBe(true);
    });

    it('should warn for high LDL', () => {
      const result = validateCholesterol(200, 60, 200, 100);
      expect(result.some(r => r.field === 'ldl' && r.severity === 'warning')).toBe(true);
    });

    it('should detect lipid inconsistency', () => {
      const result = validateCholesterol(200, 50, 120, 20); // Very inconsistent
      expect(result.some(r => r.field === 'cholesterolConsistency')).toBe(true);
    });
  });

  describe('validatePatientDataComprehensive', () => {
    it('should pass for valid patient data', () => {
      const data = {
        ...defaultPatientData,
        age: 45,
        restingBP: 120,
        cholesterol: 200,
        maxHR: 150,
      };
      const result = validatePatientDataComprehensive(data);
      expect(result.hasError).toBe(false);
    });

    it('should return errors for invalid data', () => {
      const data = {
        ...defaultPatientData,
        age: 10, // Invalid
        restingBP: 0,
        cholesterol: -50,
      };
      const result = validatePatientDataComprehensive(data);
      expect(result.hasError).toBe(true);
      expect(result.checks.some(c => c.severity === 'error')).toBe(true);
    });

    it('should include warnings', () => {
      const data = {
        ...defaultPatientData,
        age: 125, // Warning
        restingBP: 120,
        cholesterol: 200,
      };
      const result = validatePatientDataComprehensive(data);
      expect(result.checks.some(c => c.severity === 'warning')).toBe(true);
    });

    it('should generate human-readable report', () => {
      const data = defaultPatientData;
      const result = validatePatientDataComprehensive(data);
      const report = result.summary;
      expect(typeof report).toBe('string');
      expect(report.length > 0).toBe(true);
    });
  });
});
```

#### B. Advanced ML Models (PRIORITY 1)

**File:** `src/services/advancedMLModels.ts`
**Test Coverage:**

```typescript
// __tests__/advancedMLModels.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  framinghamRiskScore,
  accAhaRiskScore,
  scoreRiskModel,
  mlEnsembleModel,
  ensemblePredict,
} from '@/services/advancedMLModels';
import { defaultPatientData } from '@/lib/mockData';

describe('Advanced ML Models', () => {
  describe('Framingham Risk Score', () => {
    it('should calculate risk score for healthy patient', () => {
      const healthyPatient = {
        ...defaultPatientData,
        age: 40,
        cholesterol: 180,
        hdlCholesterol: 60,
        restingBP: 110,
        smoking: false,
        diabetes: false,
      };
      const result = framinghamRiskScore(healthyPatient);
      expect(result.riskScore).toBeLessThan(10);
      expect(result.riskLevel).toBe('low');
    });

    it('should calculate risk score for high-risk patient', () => {
      const highRiskPatient = {
        ...defaultPatientData,
        age: 65,
        cholesterol: 280,
        hdlCholesterol: 35,
        restingBP: 160,
        smoking: true,
        diabetes: true,
        previousHeartAttack: true,
      };
      const result = framinghamRiskScore(highRiskPatient);
      expect(result.riskScore).toBeGreaterThan(20);
      expect(result.riskLevel).toBe('high');
    });

    it('should return confidence > 0', () => {
      const result = framinghamRiskScore(defaultPatientData);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should include key factors', () => {
      const result = framinghamRiskScore(defaultPatientData);
      expect(result.keyFactors.length).toBeGreaterThan(0);
      expect(result.keyFactors[0]).toContain('Age');
    });
  });

  describe('ACC/AHA Risk Score', () => {
    it('should calculate valid risk score', () => {
      const result = accAhaRiskScore(defaultPatientData);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should handle missing data gracefully', () => {
      const incomplete = { age: 45 };
      const result = accAhaRiskScore(incomplete as any);
      expect(result.riskScore).toBe(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Ensemble Prediction', () => {
    it('should combine all models', () => {
      const result = ensemblePredict(defaultPatientData);
      expect(result.models.length).toBe(4);
      expect(result.models.map(m => m.modelName)).toContain('Framingham Risk Score');
      expect(result.models.map(m => m.modelName)).toContain('ACC/AHA Pooled Cohort Equations');
    });

    it('should calculate weighted average', () => {
      const result = ensemblePredict(defaultPatientData);
      expect(result.ensembleScore).toBeGreaterThanOrEqual(0);
      expect(result.ensembleScore).toBeLessThanOrEqual(100);
    });

    it('should measure model agreement', () => {
      const result = ensemblePredict(defaultPatientData);
      expect(result.modelAgreement).toBeGreaterThanOrEqual(0);
      expect(result.modelAgreement).toBeLessThanOrEqual(100);
    });

    it('should provide confidence bounds', () => {
      const result = ensemblePredict(defaultPatientData);
      expect(result.confidenceBounds.lower).toBeLessThanOrEqual(result.ensembleScore);
      expect(result.confidenceBounds.upper).toBeGreaterThanOrEqual(result.ensembleScore);
    });

    it('should generate recommendations', () => {
      const result = ensemblePredict(defaultPatientData);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(typeof result.recommendations[0]).toBe('string');
    });

    it('should summarize risk factors', () => {
      const result = ensemblePredict(defaultPatientData);
      expect(Array.isArray(result.riskFactorSummary.modifiable)).toBe(true);
      expect(Array.isArray(result.riskFactorSummary.nonModifiable)).toBe(true);
    });
  });
});
```

#### C. Validation Functions (PRIORITY 1)

**File:** `src/lib/validation.ts`
**Test Coverage:**

```typescript
// __tests__/validation.test.ts

import { describe, it, expect } from 'vitest';
import {
  BasicFieldsSchema,
  CardiovascularMetricsSchema,
  PatientDataSchema,
} from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('BasicFieldsSchema', () => {
    it('should validate correct age', () => {
      const result = BasicFieldsSchema.safeParse({
        age: 45,
        gender: 'male',
      });
      expect(result.success).toBe(true);
    });

    it('should reject age < 18', () => {
      const result = BasicFieldsSchema.safeParse({
        age: 15,
        gender: 'male',
      });
      expect(result.success).toBe(false);
    });

    it('should reject age > 120', () => {
      const result = BasicFieldsSchema.safeParse({
        age: 150,
        gender: 'male',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CardiovascularMetricsSchema', () => {
    it('should validate correct metrics', () => {
      const result = CardiovascularMetricsSchema.safeParse({
        restingBP: 120,
        cholesterol: 200,
        maxHR: 150,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative cholesterol', () => {
      const result = CardiovascularMetricsSchema.safeParse({
        restingBP: 120,
        cholesterol: -50,
        maxHR: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PatientDataSchema', () => {
    it('should validate complete patient data', () => {
      const patientData = {
        age: 45,
        gender: 'male',
        restingBP: 120,
        cholesterol: 200,
        maxHR: 150,
        // ... other required fields
      };
      const result = PatientDataSchema.safeParse(patientData);
      expect(result.success).toBe(true);
    });

    it('should provide detailed error messages', () => {
      const result = PatientDataSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        expect(result.error.errors[0].message).toBeTruthy();
      }
    });
  });
});
```

### 2. INTEGRATION TESTS

**Focus:** Component interactions, API integration, Database integration

```typescript
// __tests__/integration/PatientForm.integration.test.tsx

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';
import PatientForm from '@/components/PatientForm';

describe('PatientForm Integration', () => {
  it('should validate and submit form with valid data', async () => {
    const handleSubmit = vi.fn();
    render(<PatientForm onSubmit={handleSubmit} />);

    // Fill in form
    await userEvent.type(screen.getByLabelText(/age/i), '45');
    await userEvent.selectOption(screen.getByLabelText(/gender/i), 'male');
    // ... fill other fields

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /predict/i }));

    // Verify submission
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should show validation errors', async () => {
    render(<PatientForm onSubmit={vi.fn()} />);

    // Submit empty form
    await userEvent.click(screen.getByRole('button', { name: /predict/i }));

    // Verify errors shown
    expect(screen.getByText(/age is required/i)).toBeInTheDocument();
  });

  it('should warn for edge cases', async () => {
    render(<PatientForm onSubmit={vi.fn()} />);

    // Enter edge case values
    await userEvent.type(screen.getByLabelText(/age/i), '125'); // High but valid

    // Check warning
    expect(screen.getByText(/age.*unusual/i)).toBeInTheDocument();
  });
});
```

### 3. E2E TESTS

**Focus:** Complete user workflows

```typescript
// __tests__/e2e/prediction.e2e.test.ts

import { describe, it, expect } from 'vitest';
import { Browser, Page } from 'puppeteer';

describe('End-to-End: Risk Assessment Workflow', () => {
  let page: Page;
  let browser: Browser;

  beforeEach(async () => {
    // Setup browser
    browser = await launch();
    page = await browser.newPage();
    await page.goto('http://localhost:5173');
  });

  afterEach(async () => {
    await browser.close();
  });

  it('should complete full assessment workflow', async () => {
    // 1. Fill patient form
    await page.type('#age', '45');
    await page.select('#gender', 'male');
    await page.type('#restingBP', '120');
    await page.type('#cholesterol', '200');
    await page.type('#maxHR', '150');

    // 2. Submit form
    await page.click('button[type="submit"]');

    // 3. Wait for results
    await page.waitForSelector('[data-testid="risk-result"]', { timeout: 5000 });

    // 4. Verify results displayed
    const riskScore = await page.$text('[data-testid="risk-score"]');
    expect(parseInt(riskScore)).toBeGreaterThanOrEqual(0);
    expect(parseInt(riskScore)).toBeLessThanOrEqual(100);

    // 5. Verify recommendations shown
    const recommendations = await page.$$('[data-testid="recommendation"]');
    expect(recommendations.length).toBeGreaterThan(0);

    // 6. Verify ability to save
    await page.click('button[data-testid="save-prediction"]');
    expect(page.url()).toContain('/history');
  });

  it('should handle data validation errors', async () => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Check for errors
    const errors = await page.$$('[role="alert"]');
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

## Testing Tools Setup

### Install Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/ui
npm install -D @testing-library/user-event
npm install -D puppeteer @puppeteer/test-runner
npm install -D  @chromatic-com/storybook
```

### Configure Vitest (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File (src/__tests__/setup.ts)

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Coverage Targets by File

| File | Current | Target | Priority |
|------|---------|--------|----------|
| edgeCaseHandler.ts | 0% | 95% | CRITICAL |
| advancedMLModels.ts | 0% | 90% | CRITICAL |
| validation.ts | 40% | 85% | HIGH |
| apiClient.ts | 0% | 80% | HIGH |
| errorMessages.ts | 0% | 100% | MEDIUM |
| Dashboard.tsx | 30% | 75% | HIGH |
| PatientForm.tsx | 25% | 70% | HIGH |
| mlService.ts | 20% | 80% | HIGH |

## Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run UI
npm run test:ui

# Watch mode
npm run test:watch

# Run specific file
npm run test src/lib/edgeCaseHandler.test.ts
```

## Expected Output

```
✓ src/__tests__/edgeCaseHandler.test.ts (48 tests)
✓ src/__tests__/advancedMLModels.test.ts (32 tests)
✓ src/__tests__/integration/PatientForm.integration.test.tsx (15 tests)
✓ src/__tests__/e2e/prediction.e2e.test.ts (8 tests)

Test Files  4 passed (4)
Tests      103 passed (103)
Coverage:  82.3% statements | 78.9% branches | 85.1% functions | 81.2% lines
```

---

## Next Steps

1. **This Week:** Unit tests for edge case handler & ML models
2. **Next Week:** Integration tests for form & components
3. **Following Week:** E2E tests for user workflows
4. **Ongoing:** Maintain 80%+ coverage with new code
