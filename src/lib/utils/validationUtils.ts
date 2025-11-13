/**
 * Validation Utilities
 * 
 * Common validation patterns for patient data, clinical values, and risk assessments
 * Extracted to eliminate duplication across validation services
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Blood pressure validation ranges
 */
export const BP_RANGES = {
  MIN_SYSTOLIC: 70,
  MAX_SYSTOLIC: 250,
  MIN_DIASTOLIC: 40,
  MAX_DIASTOLIC: 150,
  NORMAL_SYSTOLIC: 120,
  NORMAL_DIASTOLIC: 80,
  ELEVATED_SYSTOLIC: 130,
  HYPERTENSION_STAGE1_SYSTOLIC: 140,
  HYPERTENSION_STAGE2_SYSTOLIC: 180
} as const;

/**
 * Cholesterol validation ranges (mg/dL)
 */
export const CHOLESTEROL_RANGES = {
  MIN: 100,
  MAX: 500,
  DESIRABLE: 200,
  BORDERLINE_HIGH: 240,
  HIGH: 280
} as const;

/**
 * Heart rate validation ranges (bpm)
 */
export const HEART_RATE_RANGES = {
  MIN_RESTING: 40,
  MAX_RESTING: 120,
  MIN_MAX: 60,
  MAX_MAX: 220,
  NORMAL_RESTING_LOW: 60,
  NORMAL_RESTING_HIGH: 100
} as const;

/**
 * Age validation ranges
 */
export const AGE_RANGES = {
  MIN: 18,
  MAX: 120,
  YOUNG_ADULT: 35,
  MIDDLE_AGE: 55,
  SENIOR: 65
} as const;

/**
 * BMI validation ranges
 */
export const BMI_RANGES = {
  MIN: 10,
  MAX: 60,
  UNDERWEIGHT: 18.5,
  NORMAL: 25,
  OVERWEIGHT: 30,
  OBESE: 35
} as const;

/**
 * Validate blood pressure values
 * 
 * @param systolic - Systolic blood pressure
 * @param diastolic - Diastolic blood pressure (optional)
 * @returns Validation result
 */
export function validateBloodPressure(systolic: number, diastolic?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Systolic validation
  if (systolic < BP_RANGES.MIN_SYSTOLIC) {
    errors.push(`Systolic BP ${systolic} is dangerously low (minimum: ${BP_RANGES.MIN_SYSTOLIC})`);
  } else if (systolic > BP_RANGES.MAX_SYSTOLIC) {
    errors.push(`Systolic BP ${systolic} is critically high (maximum: ${BP_RANGES.MAX_SYSTOLIC})`);
  } else if (systolic >= BP_RANGES.HYPERTENSION_STAGE2_SYSTOLIC) {
    warnings.push('Stage 2 Hypertension detected - urgent medical attention needed');
  } else if (systolic >= BP_RANGES.HYPERTENSION_STAGE1_SYSTOLIC) {
    warnings.push('Stage 1 Hypertension detected - medical consultation recommended');
  } else if (systolic >= BP_RANGES.ELEVATED_SYSTOLIC) {
    warnings.push('Elevated blood pressure - lifestyle changes recommended');
  }
  
  // Diastolic validation
  if (diastolic !== undefined) {
    if (diastolic < BP_RANGES.MIN_DIASTOLIC) {
      errors.push(`Diastolic BP ${diastolic} is dangerously low (minimum: ${BP_RANGES.MIN_DIASTOLIC})`);
    } else if (diastolic > BP_RANGES.MAX_DIASTOLIC) {
      errors.push(`Diastolic BP ${diastolic} is critically high (maximum: ${BP_RANGES.MAX_DIASTOLIC})`);
    }
    
    // Check pulse pressure
    const pulsePressure = systolic - diastolic;
    if (pulsePressure < 30) {
      warnings.push('Narrow pulse pressure detected - may indicate cardiac issues');
    } else if (pulsePressure > 60) {
      warnings.push('Wide pulse pressure detected - may indicate arterial stiffness');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate cholesterol level
 * 
 * @param cholesterol - Total cholesterol in mg/dL
 * @returns Validation result
 */
export function validateCholesterol(cholesterol: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (cholesterol < CHOLESTEROL_RANGES.MIN) {
    errors.push(`Cholesterol ${cholesterol} is abnormally low (minimum: ${CHOLESTEROL_RANGES.MIN})`);
  } else if (cholesterol > CHOLESTEROL_RANGES.MAX) {
    errors.push(`Cholesterol ${cholesterol} is critically high (maximum: ${CHOLESTEROL_RANGES.MAX})`);
  } else if (cholesterol >= CHOLESTEROL_RANGES.HIGH) {
    warnings.push('Very high cholesterol - immediate medical intervention recommended');
  } else if (cholesterol >= CHOLESTEROL_RANGES.BORDERLINE_HIGH) {
    warnings.push('High cholesterol - medical consultation and lifestyle changes needed');
  } else if (cholesterol >= CHOLESTEROL_RANGES.DESIRABLE) {
    warnings.push('Borderline high cholesterol - lifestyle modifications recommended');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate heart rate
 * 
 * @param heartRate - Heart rate in bpm
 * @param isResting - Whether this is resting heart rate
 * @param age - Patient age (for max HR calculation)
 * @returns Validation result
 */
export function validateHeartRate(heartRate: number, isResting: boolean, age?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (isResting) {
    if (heartRate < HEART_RATE_RANGES.MIN_RESTING) {
      warnings.push('Bradycardia detected - resting heart rate is unusually low');
    } else if (heartRate > HEART_RATE_RANGES.MAX_RESTING) {
      warnings.push('Tachycardia detected - resting heart rate is elevated');
    }
  } else {
    // Maximum heart rate validation
    if (age !== undefined) {
      const expectedMaxHR = 220 - age;
      if (heartRate > expectedMaxHR) {
        warnings.push(`Maximum heart rate exceeds age-predicted maximum (${expectedMaxHR} bpm)`);
      }
    }
    
    if (heartRate < HEART_RATE_RANGES.MIN_MAX) {
      errors.push('Maximum heart rate is abnormally low - may indicate cardiac limitations');
    } else if (heartRate > HEART_RATE_RANGES.MAX_MAX) {
      errors.push('Maximum heart rate exceeds safe limits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate age
 * 
 * @param age - Patient age in years
 * @returns Validation result
 */
export function validateAge(age: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (age < AGE_RANGES.MIN) {
    errors.push(`Age ${age} is below minimum (${AGE_RANGES.MIN})`);
  } else if (age > AGE_RANGES.MAX) {
    errors.push(`Age ${age} exceeds maximum (${AGE_RANGES.MAX})`);
  } else if (age >= AGE_RANGES.SENIOR) {
    warnings.push('Senior age group - increased cardiovascular monitoring recommended');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate BMI
 * 
 * @param bmi - Body Mass Index
 * @returns Validation result
 */
export function validateBMI(bmi: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (bmi < BMI_RANGES.MIN) {
    errors.push('BMI is critically low - severe underweight');
  } else if (bmi > BMI_RANGES.MAX) {
    errors.push('BMI is critically high - severe obesity');
  } else if (bmi >= BMI_RANGES.OBESE) {
    warnings.push('Obesity class II or higher - significant health risks');
  } else if (bmi >= BMI_RANGES.OVERWEIGHT) {
    warnings.push('Obesity class I - weight management recommended');
  } else if (bmi >= BMI_RANGES.NORMAL) {
    warnings.push('Overweight - lifestyle modifications suggested');
  } else if (bmi < BMI_RANGES.UNDERWEIGHT) {
    warnings.push('Underweight - nutritional assessment recommended');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate blood sugar level
 * 
 * @param bloodSugar - Blood sugar in mg/dL
 * @param isFasting - Whether this is a fasting measurement
 * @returns Validation result
 */
export function validateBloodSugar(bloodSugar: number, isFasting: boolean): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (isFasting) {
    if (bloodSugar < 70) {
      warnings.push('Hypoglycemia - blood sugar is too low');
    } else if (bloodSugar >= 126) {
      warnings.push('Diabetes range - medical evaluation required');
    } else if (bloodSugar >= 100) {
      warnings.push('Prediabetes range - lifestyle changes recommended');
    }
  } else {
    if (bloodSugar < 70) {
      warnings.push('Hypoglycemia - blood sugar is too low');
    } else if (bloodSugar >= 200) {
      warnings.push('Diabetes range - medical evaluation required');
    } else if (bloodSugar >= 140) {
      warnings.push('Elevated blood sugar - further testing recommended');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate required fields are present
 * 
 * @param data - Data object to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result
 */
export function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): ValidationResult {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Required field '${field}' is missing`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * Combine multiple validation results
 * 
 * @param results - Array of validation results
 * @returns Combined validation result
 */
export function combineValidationResults(results: ValidationResult[]): ValidationResult {
  return {
    isValid: results.every(r => r.isValid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings)
  };
}

/**
 * Check if a value is within normal physiological ranges
 * 
 * @param value - Value to check
 * @param min - Minimum normal value
 * @param max - Maximum normal value
 * @param fieldName - Name of the field (for error messages)
 * @returns Validation result
 */
export function validatePhysiologicalRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  
  if (value < min || value > max) {
    errors.push(`${fieldName} value ${value} is outside physiological range (${min}-${max})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}
