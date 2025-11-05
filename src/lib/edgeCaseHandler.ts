/**
 * Comprehensive Edge Case Handler
 * Validates patient data for boundary conditions, conflicting values, and outliers
 * 
 * This module ensures data quality before ML predictions to prevent:
 * - Invalid age inputs (< 18 or > 120)
 * - Blood pressure inversions (systolic < diastolic)
 * - Cholesterol inconsistencies
 * - Extreme outlier values
 * - Missing critical fields
 */

import { PatientData } from './mockData';

export interface EdgeCaseCheck {
  field: string;
  valid: boolean;
  severity: 'error' | 'warning' | 'info'; // error = block, warning = alert, info = note
  message: string;
  suggestion?: string;
  autoFix?: any; // Suggestion for auto-fixing
}

export interface EdgeCaseValidationResult {
  isValid: boolean; // All checks passed
  isWarning: boolean; // Has warnings but can proceed
  hasError: boolean; // Has errors - should not proceed
  checks: EdgeCaseCheck[];
  summary: string;
}

/**
 * BOUNDARY VALIDATION RULES
 */
const BOUNDARIES = {
  age: { min: 18, max: 130, typical_max: 120 },
  bloodPressure: { min: 40, max: 300, systolic_min_ratio: 0.6 }, // systolic should be at least 60% of max
  cholesterol: { min: 0, max: 500, typical: { low: 100, high: 240 } },
  hdl: { min: 0, max: 300, optimal: 60 }, // Higher is better
  ldl: { min: 0, max: 300, optimal: 100 }, // Lower is better
  triglycerides: { min: 0, max: 600, optimal: 150 },
  heartRate: { min: 30, max: 220, resting_min: 40, resting_max: 100 },
  maxHeartRate: { min: 60, max: 250 },
  glucose: { min: 40, max: 600, normal: 100, diabetic: 126 },
  bmi: { min: 10, max: 60, overweight: 25, obese: 30 },
  stressLevel: { min: 1, max: 10 },
  sleepHours: { min: 0, max: 24, recommended: 7 },
};

/**
 * Check if a single value is within acceptable boundaries
 */
function checkBoundary(
  field: string,
  value: any,
  bounds: { min: number; max: number; [key: string]: any }
): EdgeCaseCheck | null {
  // Skip undefined/null values - they might be optional
  if (value === undefined || value === null) {
    return null;
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    return {
      field,
      valid: false,
      severity: 'error',
      message: `Invalid ${field}: expected a number, got "${value}"`,
      suggestion: `Ensure ${field} is a valid number`,
    };
  }

  if (numValue < bounds.min) {
    return {
      field,
      valid: false,
      severity: 'error',
      message: `${field} is too low: ${numValue} (minimum: ${bounds.min})`,
      suggestion: `${field} should be at least ${bounds.min}`,
      autoFix: bounds.min,
    };
  }

  if (numValue > bounds.max) {
    const isSevere = numValue > (bounds.max * 1.5); // More than 50% over max
    return {
      field,
      valid: false,
      severity: isSevere ? 'error' : 'warning',
      message: `${field} is too high: ${numValue} (maximum: ${bounds.max})`,
      suggestion: `${field} should be at most ${bounds.max}. Please verify the value.`,
      autoFix: bounds.max,
    };
  }

  return null;
}

/**
 * AGE VALIDATION
 */
export function validateAge(age: number | undefined): EdgeCaseCheck | null {
  if (age === undefined || age === null) return null;

  const checks: EdgeCaseCheck[] = [];
  const boundaryCheck = checkBoundary('age', age, BOUNDARIES.age);

  if (boundaryCheck) {
    checks.push(boundaryCheck);
  }

  if (age < 25) {
    checks.push({
      field: 'age',
      valid: true,
      severity: 'info',
      message: `Young patient: ${age} years. Heart attack risk is typically very low at this age.`,
    });
  }

  if (age > BOUNDARIES.age.typical_max) {
    checks.push({
      field: 'age',
      valid: true,
      severity: 'warning',
      message: `Age ${age} exceeds typical maximum. Please verify the value.`,
      suggestion: `Verify that age is entered correctly.`,
    });
  }

  return checks.length > 0 ? checks[0] : null;
}

/**
 * BLOOD PRESSURE VALIDATION
 */
export function validateBloodPressure(
  systolic: number | undefined,
  diastolic: number | undefined
): EdgeCaseCheck[] {
  const checks: EdgeCaseCheck[] = [];

  // Validate individual values
  if (systolic !== undefined && systolic !== null) {
    const sysCheck = checkBoundary('systolic BP', systolic, {
      min: BOUNDARIES.bloodPressure.min,
      max: BOUNDARIES.bloodPressure.max,
    });
    if (sysCheck) checks.push(sysCheck);
  }

  if (diastolic !== undefined && diastolic !== null) {
    const diaCheck = checkBoundary('diastolic BP', diastolic, {
      min: BOUNDARIES.bloodPressure.min,
      max: BOUNDARIES.bloodPressure.max,
    });
    if (diaCheck) checks.push(diaCheck);
  }

  // Check BP inversion (systolic < diastolic)
  if (
    systolic !== undefined &&
    diastolic !== undefined &&
    systolic !== null &&
    diastolic !== null
  ) {
    if (systolic < diastolic) {
      checks.push({
        field: 'bloodPressure',
        valid: false,
        severity: 'error',
        message: `Blood pressure inversion: systolic (${systolic}) should be ≥ diastolic (${diastolic})`,
        suggestion: `Verify BP values. Systolic should be higher than diastolic.`,
      });
    }

    // Check if values are suspiciously close (within 10 mmHg)
    if (Math.abs(systolic - diastolic) < 10 && Math.abs(systolic - diastolic) > 0) {
      checks.push({
        field: 'bloodPressure',
        valid: true,
        severity: 'warning',
        message: `Unusual BP: systolic and diastolic are very close (${systolic}/${diastolic}). Please verify.`,
        suggestion: `Confirm BP measurement is accurate.`,
      });
    }

    // Check pulse pressure (systolic - diastolic should be 30-60)
    const pulsePressure = systolic - diastolic;
    if (pulsePressure < 20 || pulsePressure > 100) {
      checks.push({
        field: 'bloodPressure',
        valid: true,
        severity: 'warning',
        message: `Unusual pulse pressure: ${pulsePressure} mmHg (typical: 30-60). Please verify BP.`,
        suggestion: `Confirm BP measurement is accurate.`,
      });
    }
  }

  return checks;
}

/**
 * CHOLESTEROL & LIPIDS VALIDATION
 */
export function validateCholesterol(
  totalCholesterol: number | undefined,
  hdl: number | undefined,
  ldl: number | undefined,
  triglycerides: number | undefined
): EdgeCaseCheck[] {
  const checks: EdgeCaseCheck[] = [];

  // Validate individual values
  if (totalCholesterol !== undefined && totalCholesterol !== null) {
    const check = checkBoundary('total cholesterol', totalCholesterol, BOUNDARIES.cholesterol);
    if (check) checks.push(check);
  }

  if (hdl !== undefined && hdl !== null) {
    const check = checkBoundary('HDL cholesterol', hdl, BOUNDARIES.hdl);
    if (check) checks.push(check);

    if (hdl < 40) {
      checks.push({
        field: 'hdl',
        valid: true,
        severity: 'warning',
        message: `Low HDL: ${hdl} mg/dL (should be ≥ 40, optimal ≥ 60)`,
        suggestion: `HDL is a protective factor. Consider lifestyle changes to increase it.`,
      });
    }
  }

  if (ldl !== undefined && ldl !== null) {
    const check = checkBoundary('LDL cholesterol', ldl, BOUNDARIES.ldl);
    if (check) checks.push(check);

    if (ldl > 160) {
      checks.push({
        field: 'ldl',
        valid: true,
        severity: 'warning',
        message: `High LDL: ${ldl} mg/dL (should be < 100, ideally < 70 for high risk)`,
        suggestion: `High LDL increases heart disease risk. Consider medication or diet changes.`,
      });
    }
  }

  if (triglycerides !== undefined && triglycerides !== null) {
    const check = checkBoundary('triglycerides', triglycerides, BOUNDARIES.triglycerides);
    if (check) checks.push(check);

    if (triglycerides > 200) {
      checks.push({
        field: 'triglycerides',
        valid: true,
        severity: 'warning',
        message: `High triglycerides: ${triglycerides} mg/dL (should be < 150)`,
        suggestion: `Elevated triglycerides increase heart disease risk.`,
      });
    }
  }

  // CHECK LIPID CONSISTENCY
  // Total cholesterol should approximately equal: HDL + LDL + (Triglycerides/5)
  if (totalCholesterol && hdl && ldl && triglycerides) {
    const calculated = hdl + ldl + triglycerides / 5;
    const diff = Math.abs(calculated - totalCholesterol);
    const percentDiff = (diff / totalCholesterol) * 100;

    if (percentDiff > 20) {
      // More than 20% difference is suspicious
      checks.push({
        field: 'cholesterolConsistency',
        valid: true,
        severity: 'warning',
        message: `Cholesterol components don't add up correctly (${percentDiff.toFixed(1)}% difference)`,
        suggestion: `Verify all cholesterol measurements. Formula: Total ≈ HDL + LDL + (Triglycerides/5)`,
      });
    }
  }

  return checks;
}

/**
 * HEART RATE VALIDATION
 */
export function validateHeartRate(
  restingHR: number | undefined,
  maxHR: number | undefined
): EdgeCaseCheck[] {
  const checks: EdgeCaseCheck[] = [];

  if (restingHR !== undefined && restingHR !== null) {
    const check = checkBoundary('resting heart rate', restingHR, {
      min: BOUNDARIES.heartRate.resting_min,
      max: BOUNDARIES.heartRate.resting_max,
    });
    if (check) checks.push(check);

    // Bradycardia check (< 60)
    if (restingHR < 60) {
      checks.push({
        field: 'restingHR',
        valid: true,
        severity: 'info',
        message: `Low resting heart rate: ${restingHR} bpm (bradycardia). Can be normal in athletes.`,
      });
    }

    // Tachycardia check (> 100)
    if (restingHR > 100) {
      checks.push({
        field: 'restingHR',
        valid: true,
        severity: 'warning',
        message: `Elevated resting heart rate: ${restingHR} bpm (tachycardia). Associated with higher CV risk.`,
        suggestion: `Consider stress management, exercise, and medical evaluation.`,
      });
    }
  }

  if (maxHR !== undefined && maxHR !== null) {
    const check = checkBoundary('max heart rate', maxHR, BOUNDARIES.maxHeartRate);
    if (check) checks.push(check);
  }

  // Check if max HR < resting HR (impossible)
  if (maxHR && restingHR && maxHR < restingHR) {
    checks.push({
      field: 'heartRate',
      valid: false,
      severity: 'error',
      message: `Maximum HR (${maxHR}) cannot be less than resting HR (${restingHR})`,
      suggestion: `Verify heart rate measurements.`,
    });
  }

  // Check if max HR is realistic for age (220 - age ± 10%)
  // This is optional since we might not have age, so we calculate rough bounds
  if (maxHR && maxHR > 250) {
    checks.push({
      field: 'maxHR',
      valid: true,
      severity: 'warning',
      message: `Max heart rate ${maxHR} seems unusually high. Please verify.`,
      suggestion: `Typical max HR for adults: 160-200 bpm.`,
    });
  }

  return checks;
}

/**
 * GLUCOSE VALIDATION
 */
export function validateGlucose(glucose: number | undefined): EdgeCaseCheck | null {
  if (glucose === undefined || glucose === null) return null;

  const check = checkBoundary('fasting glucose', glucose, BOUNDARIES.glucose);
  if (check) return check;

  if (glucose > BOUNDARIES.glucose.diabetic) {
    return {
      field: 'glucose',
      valid: true,
      severity: 'warning',
      message: `High fasting glucose: ${glucose} mg/dL (diabetic threshold: > ${BOUNDARIES.glucose.diabetic})`,
      suggestion: `May indicate diabetes or impaired glucose tolerance.`,
    };
  }

  return null;
}

/**
 * CONFLICTING DATA DETECTION
 */
export function detectConflictingData(data: PatientData): EdgeCaseCheck[] {
  const checks: EdgeCaseCheck[] = [];

  // Conflict 1: Diabetes medication without diabetes
  if (data.diabetesMedication && data.diabetesMedication !== 'none' && !data.diabetes) {
    checks.push({
      field: 'conflictingData',
      valid: true,
      severity: 'warning',
      message: `Patient reports diabetes medication but no diabetes diagnosis`,
      suggestion: `Verify diabetes status. Update health conditions if needed.`,
    });
  }

  // Conflict 2: BP medication without hypertension symptoms
  if (data.bpMedication && data.restingBP && data.restingBP < 130) {
    checks.push({
      field: 'conflictingData',
      valid: true,
      severity: 'warning',
      message: `Patient on BP medication but resting BP is ${data.restingBP} (well-controlled)`,
      suggestion: `Confirm if patient is currently on medication or if it was discontinued.`,
    });
  }

  // Conflict 3: Cholesterol medication without elevated cholesterol
  if (data.cholesterolMedication && data.cholesterol && data.cholesterol < 200) {
    checks.push({
      field: 'conflictingData',
      valid: true,
      severity: 'warning',
      message: `Patient on cholesterol medication but level is ${data.cholesterol} (normal)`,
      suggestion: `Confirm if medication is being taken or if it was discontinued.`,
    });
  }

  // Conflict 4: Exercise-induced angina without previous heart attack
  if (data.exerciseAngina && !data.previousHeartAttack && data.chestPainType === 'typical') {
    checks.push({
      field: 'conflictingData',
      valid: true,
      severity: 'warning',
      message: `Patient reports exercise-induced angina, which is a serious symptom`,
      suggestion: `Recommend urgent medical evaluation if not already done.`,
    });
  }

  // Conflict 5: Very young with multiple cardiac risk factors
  if (data.age && data.age < 35 && (data.smoking && data.diabetes && data.previousHeartAttack)) {
    checks.push({
      field: 'conflictingData',
      valid: true,
      severity: 'warning',
      message: `Young patient (${data.age}) with multiple serious risk factors is unusual`,
      suggestion: `Verify medical history is accurate.`,
    });
  }

  return checks;
}

/**
 * OUTLIER DETECTION
 */
export function detectOutliers(data: PatientData): EdgeCaseCheck[] {
  const checks: EdgeCaseCheck[] = [];

  // Outlier 1: Extreme weight (if height available - calculate BMI)
  if (data.height && data.weight) {
    const bmi = (data.weight / (data.height * data.height)) * 10000; // height in cm, weight in kg
    
    if (bmi > 50) {
      checks.push({
        field: 'weight',
        valid: true,
        severity: 'warning',
        message: `Severe obesity: BMI ${bmi.toFixed(1)} (> 40)`,
        suggestion: `Refer to weight management and healthcare specialist.`,
      });
    } else if (bmi > 30) {
      checks.push({
        field: 'weight',
        valid: true,
        severity: 'warning',
        message: `Overweight: BMI ${bmi.toFixed(1)} (> 25)`,
        suggestion: `Consider lifestyle modifications for weight management.`,
      });
    }
  }

  // Outlier 2: All health indicators are excellent (too good to be true)
  const positiveFactors = [
    data.restingBP && data.restingBP < 120,
    data.cholesterol && data.cholesterol < 150,
    data.maxHR && data.maxHR > 180,
    !data.smoking,
    !data.diabetes,
    !data.previousHeartAttack,
  ].filter(Boolean).length;

  if (positiveFactors >= 5) {
    checks.push({
      field: 'outliers',
      valid: true,
      severity: 'info',
      message: `Excellent health profile: Patient has ${positiveFactors}/6 ideal factors`,
      suggestion: `Very low cardiac risk profile.`,
    });
  }

  // Outlier 3: All health indicators are poor (high risk)
  const negativeFactors = [
    data.restingBP && data.restingBP > 160,
    data.cholesterol && data.cholesterol > 300,
    data.maxHR && data.maxHR < 120,
    data.smoking,
    data.diabetes,
    data.previousHeartAttack,
    data.exerciseAngina,
  ].filter(Boolean).length;

  if (negativeFactors >= 5) {
    checks.push({
      field: 'outliers',
      valid: true,
      severity: 'warning',
      message: `Multiple serious risk factors detected: ${negativeFactors}/7 negative indicators`,
      suggestion: `Recommend comprehensive medical evaluation and close monitoring.`,
    });
  }

  return checks;
}

/**
 * MISSING DATA CHECK
 */
export function checkMissingCriticalData(data: PatientData): EdgeCaseCheck[] {
  const checks: EdgeCaseCheck[] = [];

  const required = {
    age: { name: 'Age', value: data.age },
    gender: { name: 'Gender', value: data.gender },
    restingBP: { name: 'Resting BP', value: data.restingBP },
    cholesterol: { name: 'Cholesterol', value: data.cholesterol },
    maxHR: { name: 'Max Heart Rate', value: data.maxHR },
  };

  let missingCount = 0;
  for (const [key, field] of Object.entries(required)) {
    if (!field.value) {
      checks.push({
        field: key,
        valid: false,
        severity: 'error',
        message: `Missing critical field: ${field.name}`,
        suggestion: `This field is required for accurate risk assessment.`,
      });
      missingCount++;
    }
  }

  // If all vitals are zero (suspicious)
  const allZero = [
    !data.restingBP || data.restingBP === 0,
    !data.cholesterol || data.cholesterol === 0,
    !data.maxHR || data.maxHR === 0,
  ].every(Boolean);

  if (allZero && data.restingBP === 0 && data.cholesterol === 0) {
    checks.push({
      field: 'allZero',
      valid: false,
      severity: 'error',
      message: `No vital signs data provided (all zeros)`,
      suggestion: `Vital signs are required for risk assessment.`,
    });
  }

  return checks;
}

/**
 * MAIN VALIDATION FUNCTION
 */
export function validatePatientDataComprehensive(data: PatientData): EdgeCaseValidationResult {
  const checks: EdgeCaseCheck[] = [];

  // Run all validators
  const ageCheck = validateAge(data.age);
  if (ageCheck) checks.push(ageCheck);

  checks.push(...validateBloodPressure(data.restingBP, data.diastolicBP));
  checks.push(...validateCholesterol(data.cholesterol, data.hdlCholesterol, data.ldlCholesterol, data.bloodSugar));
  checks.push(...validateHeartRate(data.heartRate || data.maxHR, data.maxHR));

  const glucoseCheck = validateGlucose(data.fastingBS ? 126 : undefined);
  if (glucoseCheck) checks.push(glucoseCheck);

  checks.push(...detectConflictingData(data));
  checks.push(...detectOutliers(data));
  checks.push(...checkMissingCriticalData(data));

  // Calculate summary
  const errors = checks.filter(c => c.severity === 'error');
  const warnings = checks.filter(c => c.severity === 'warning');
  const infos = checks.filter(c => c.severity === 'info');

  const isValid = errors.length === 0;
  const isWarning = errors.length === 0 && warnings.length > 0;
  const hasError = errors.length > 0;

  let summary = '';
  if (errors.length > 0) {
    summary = `❌ ${errors.length} error(s) found - data validation failed`;
  } else if (warnings.length > 0) {
    summary = `⚠️ ${warnings.length} warning(s) - proceed with caution`;
  } else if (infos.length > 0) {
    summary = `ℹ️ ${infos.length} note(s) - data looks good`;
  } else {
    summary = `✅ All checks passed - data is valid`;
  }

  return {
    isValid,
    isWarning,
    hasError,
    checks,
    summary,
  };
}

/**
 * Get severity-based checks
 */
export function getChecksBySeverity(result: EdgeCaseValidationResult, severity: 'error' | 'warning' | 'info') {
  return result.checks.filter(c => c.severity === severity);
}

/**
 * Get human-readable report
 */
export function getValidationReport(result: EdgeCaseValidationResult): string {
  let report = `DATA VALIDATION REPORT\n`;
  report += `${'='.repeat(50)}\n`;
  report += `Status: ${result.summary}\n\n`;

  if (result.checks.length === 0) {
    report += `No issues found. All data is valid.\n`;
    return report;
  }

  // Group by severity
  const errors = result.checks.filter(c => c.severity === 'error');
  const warnings = result.checks.filter(c => c.severity === 'warning');
  const infos = result.checks.filter(c => c.severity === 'info');

  if (errors.length > 0) {
    report += `❌ ERRORS (${errors.length}):\n`;
    report += `-`.repeat(50) + `\n`;
    errors.forEach((check, idx) => {
      report += `${idx + 1}. [${check.field}] ${check.message}\n`;
      if (check.suggestion) report += `   💡 ${check.suggestion}\n`;
    });
    report += `\n`;
  }

  if (warnings.length > 0) {
    report += `⚠️ WARNINGS (${warnings.length}):\n`;
    report += `-`.repeat(50) + `\n`;
    warnings.forEach((check, idx) => {
      report += `${idx + 1}. [${check.field}] ${check.message}\n`;
      if (check.suggestion) report += `   💡 ${check.suggestion}\n`;
    });
    report += `\n`;
  }

  if (infos.length > 0) {
    report += `ℹ️ NOTES (${infos.length}):\n`;
    report += `-`.repeat(50) + `\n`;
    infos.forEach((check, idx) => {
      report += `${idx + 1}. [${check.field}] ${check.message}\n`;
    });
  }

  return report;
}
