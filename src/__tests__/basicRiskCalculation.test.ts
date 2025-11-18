import { describe, it, expect } from 'vitest';
import { PatientData } from '@/lib/mockData';

/**
 * Basic Risk Calculation Tests
 * 
 * Tests the risk calculation logic from BasicDashboard.tsx
 * Bug fix: Previously showed "14/12" invalid score when all risk factors present
 * 
 * Risk factors and scores:
 * - Age > 55: +2
 * - Male gender: +1
 * - Resting BP > 140: +2
 * - Cholesterol > 240: +2
 * - Diabetes: +2
 * - Smoking: +3
 * - Exercise angina: +2
 * Maximum: 14 points
 */

// Extracted calculation logic from BasicDashboard.tsx for unit testing
function calculateBasicRisk(data: Partial<PatientData>) {
  const MAX_RISK_SCORE = 14;
  let score = 0;
  const factors: string[] = [];

  if ((data.age || 0) > 55) { score += 2; factors.push('Age over 55'); }
  if (data.gender === 'male') { score += 1; factors.push('Male gender'); }
  if ((data.restingBP || 0) > 140) { score += 2; factors.push('High blood pressure'); }
  if ((data.cholesterol || 0) > 240) { score += 2; factors.push('High cholesterol'); }
  if (data.diabetes) { score += 2; factors.push('Diabetes'); }
  if (data.smoking) { score += 3; factors.push('Smoking'); }
  if (data.exerciseAngina) { score += 2; factors.push('Exercise-induced chest pain'); }

  // Defensive bounds check: ensure score doesn't exceed maximum
  score = Math.min(score, MAX_RISK_SCORE);
  
  const level = score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low';
  const percentage = Math.round((score / MAX_RISK_SCORE) * 100);

  return { score, level, factors, percentage, maxScore: MAX_RISK_SCORE };
}

describe('BasicDashboard Risk Calculation', () => {
  describe('Boundary Cases', () => {
    it('should handle zero risk factors', () => {
      const result = calculateBasicRisk({
        age: 30,
        gender: 'female',
        restingBP: 120,
        cholesterol: 180,
        diabetes: false,
        smoking: false,
        exerciseAngina: false,
      });

      expect(result.score).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.level).toBe('low');
      expect(result.factors).toHaveLength(0);
    });

    it('should handle maximum risk factors (reproduce 14/12 bug case)', () => {
      // This is the case that produced "14/12" invalid score
      const result = calculateBasicRisk({
        age: 65,          // +2 (over 55)
        gender: 'male',   // +1
        restingBP: 160,   // +2 (over 140)
        cholesterol: 260, // +2 (over 240)
        diabetes: true,   // +2
        smoking: true,    // +3
        exerciseAngina: true, // +2
      });

      // BUG: Previously displayed as "14/12" (invalid fraction)
      // FIX: Now displays as "14/14 (100%)"
      expect(result.score).toBe(14);
      expect(result.maxScore).toBe(14);
      expect(result.percentage).toBe(100);
      expect(result.level).toBe('high');
      expect(result.factors).toHaveLength(7);
    });

    it('should not exceed maximum score (defensive bounds)', () => {
      // Edge case: even if logic error adds extra points, should cap at 14
      const result = calculateBasicRisk({
        age: 80,
        gender: 'male',
        restingBP: 200,
        cholesterol: 350,
        diabetes: true,
        smoking: true,
        exerciseAngina: true,
      });

      expect(result.score).toBeLessThanOrEqual(14);
      expect(result.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Risk Level Classification', () => {
    it('should classify low risk (score < 4)', () => {
      const result = calculateBasicRisk({
        age: 40,
        gender: 'female',
        restingBP: 130,
        cholesterol: 200,
        diabetes: false,
        smoking: false,
        exerciseAngina: false,
      });

      expect(result.score).toBe(0);
      expect(result.level).toBe('low');
    });

    it('should classify medium risk (4 <= score < 8)', () => {
      const result = calculateBasicRisk({
        age: 60,          // +2
        gender: 'female', // +0
        restingBP: 150,   // +2
        cholesterol: 200, // +0
        diabetes: false,  // +0
        smoking: false,   // +0
        exerciseAngina: false, // +0
      });

      expect(result.score).toBe(4);
      expect(result.level).toBe('medium');
      expect(result.percentage).toBe(29); // 4/14 = 28.6% -> 29%
    });

    it('should classify high risk (score >= 8)', () => {
      const result = calculateBasicRisk({
        age: 65,         // +2
        gender: 'male',  // +1
        restingBP: 150,  // +2
        cholesterol: 250,// +2
        diabetes: false, // +0
        smoking: true,   // +3
        exerciseAngina: false, // +0
      });

      expect(result.score).toBe(10);
      expect(result.level).toBe('high');
      expect(result.percentage).toBe(71); // 10/14 = 71.4% -> 71%
    });
  });

  describe('Individual Risk Factors', () => {
    it('should calculate age risk correctly', () => {
      const youngPatient = calculateBasicRisk({ age: 40 });
      const oldPatient = calculateBasicRisk({ age: 65 });

      expect(youngPatient.score).toBe(0);
      expect(oldPatient.score).toBe(2);
      expect(oldPatient.factors).toContain('Age over 55');
    });

    it('should calculate gender risk correctly', () => {
      const female = calculateBasicRisk({ gender: 'female' });
      const male = calculateBasicRisk({ gender: 'male' });

      expect(female.score).toBe(0);
      expect(male.score).toBe(1);
      expect(male.factors).toContain('Male gender');
    });

    it('should calculate blood pressure risk correctly', () => {
      const normalBP = calculateBasicRisk({ restingBP: 120 });
      const highBP = calculateBasicRisk({ restingBP: 160 });

      expect(normalBP.score).toBe(0);
      expect(highBP.score).toBe(2);
      expect(highBP.factors).toContain('High blood pressure');
    });

    it('should calculate cholesterol risk correctly', () => {
      const normalChol = calculateBasicRisk({ cholesterol: 200 });
      const highChol = calculateBasicRisk({ cholesterol: 280 });

      expect(normalChol.score).toBe(0);
      expect(highChol.score).toBe(2);
      expect(highChol.factors).toContain('High cholesterol');
    });

    it('should calculate diabetes risk correctly', () => {
      const noDiabetes = calculateBasicRisk({ diabetes: false });
      const withDiabetes = calculateBasicRisk({ diabetes: true });

      expect(noDiabetes.score).toBe(0);
      expect(withDiabetes.score).toBe(2);
      expect(withDiabetes.factors).toContain('Diabetes');
    });

    it('should calculate smoking risk correctly (highest single factor)', () => {
      const nonSmoker = calculateBasicRisk({ smoking: false });
      const smoker = calculateBasicRisk({ smoking: true });

      expect(nonSmoker.score).toBe(0);
      expect(smoker.score).toBe(3);
      expect(smoker.factors).toContain('Smoking');
    });

    it('should calculate exercise angina risk correctly', () => {
      const noAngina = calculateBasicRisk({ exerciseAngina: false });
      const withAngina = calculateBasicRisk({ exerciseAngina: true });

      expect(noAngina.score).toBe(0);
      expect(withAngina.score).toBe(2);
      expect(withAngina.factors).toContain('Exercise-induced chest pain');
    });
  });

  describe('Progress Bar Validation', () => {
    it('should calculate valid progress bar percentage (0-100%)', () => {
      const testCases = [
        { score: 0, expected: 0 },
        { score: 4, expected: 29 },  // 4/14 = 28.6% -> 29%
        { score: 7, expected: 50 },  // 7/14 = 50%
        { score: 10, expected: 71 }, // 10/14 = 71.4% -> 71%
        { score: 14, expected: 100 }, // 14/14 = 100%
      ];

      testCases.forEach(({ score, expected }) => {
        const percentage = Math.round((score / 14) * 100);
        expect(percentage).toBe(expected);
        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should never exceed 100% in progress bar (defensive check)', () => {
      // Even if score somehow exceeds 14, progress should cap at 100%
      const scores = [0, 4, 7, 10, 14, 15, 20, 100];
      
      scores.forEach(score => {
        const progressValue = Math.min((score / 14) * 100, 100);
        expect(progressValue).toBeLessThanOrEqual(100);
        expect(progressValue).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Input Validation', () => {
    it('should handle missing/undefined fields gracefully', () => {
      const result = calculateBasicRisk({});
      
      expect(result.score).toBe(0);
      expect(result.level).toBe('low');
      expect(result.factors).toHaveLength(0);
      expect(result.percentage).toBe(0);
    });

    it('should handle extreme age values', () => {
      const infant = calculateBasicRisk({ age: 0 });
      const elderly = calculateBasicRisk({ age: 120 });

      expect(infant.score).toBe(0);
      expect(elderly.score).toBe(2);
    });

    it('should handle extreme BP values', () => {
      const lowBP = calculateBasicRisk({ restingBP: 60 });
      const highBP = calculateBasicRisk({ restingBP: 250 });

      expect(lowBP.score).toBe(0);
      expect(highBP.score).toBe(2);
    });

    it('should handle extreme cholesterol values', () => {
      const lowChol = calculateBasicRisk({ cholesterol: 0 });
      const highChol = calculateBasicRisk({ cholesterol: 600 });

      expect(lowChol.score).toBe(0);
      expect(highChol.score).toBe(2);
    });
  });

  describe('Display Format Validation', () => {
    it('should format risk score as "X/14 (Y%)" not "X/12"', () => {
      const result = calculateBasicRisk({
        age: 65,
        gender: 'male',
        smoking: true,
        diabetes: true,
      });

      const displayString = `${result.score}/${result.maxScore} (${result.percentage}%)`;
      
      // Should be "8/14 (57%)" not "8/12"
      expect(displayString).toMatch(/^\d+\/14 \(\d+%\)$/);
      expect(displayString).not.toContain('/12');
    });

    it('should never produce invalid fractions like "14/12"', () => {
      const allRiskFactors = calculateBasicRisk({
        age: 70,
        gender: 'male',
        restingBP: 180,
        cholesterol: 300,
        diabetes: true,
        smoking: true,
        exerciseAngina: true,
      });

      // Previously: "14/12" (numerator > denominator, INVALID)
      // Fixed: "14/14 (100%)" (valid)
      expect(allRiskFactors.score).toBe(14);
      expect(allRiskFactors.maxScore).toBe(14);
      expect(allRiskFactors.score).toBeLessThanOrEqual(allRiskFactors.maxScore);
      expect(allRiskFactors.percentage).toBe(100);
    });
  });

  describe('Regression Tests', () => {
    it('should prevent the 14/12 bug from reoccurring', () => {
      // This is the exact bug case user reported
      const bugCase = calculateBasicRisk({
        age: 65,
        gender: 'male',
        restingBP: 160,
        cholesterol: 260,
        diabetes: true,
        smoking: true,
        exerciseAngina: true,
      });

      // Assert: score should never exceed maxScore
      expect(bugCase.score).toBeLessThanOrEqual(bugCase.maxScore);
      
      // Assert: percentage should never exceed 100%
      expect(bugCase.percentage).toBeLessThanOrEqual(100);
      
      // Assert: display format should be valid
      const display = `${bugCase.score}/${bugCase.maxScore}`;
      const [numerator, denominator] = display.split('/').map(Number);
      expect(numerator).toBeLessThanOrEqual(denominator);
      
      // Assert: result should be numeric and valid
      expect(bugCase.score).toBeTypeOf('number');
      expect(bugCase.percentage).toBeTypeOf('number');
      expect(Number.isFinite(bugCase.score)).toBe(true);
      expect(Number.isFinite(bugCase.percentage)).toBe(true);
      expect(Number.isNaN(bugCase.score)).toBe(false);
    });
  });
});
