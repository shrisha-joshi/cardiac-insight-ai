/**
 * Input Validation Schemas
 * 
 * Comprehensive validation using Zod for all application inputs.
 * Provides frontend and backend validation with user-friendly error messages.
 * 
 * Created: November 4, 2025
 */

import { z } from 'zod';
import type { PatientData } from './mockData';

// ============================================================================
// PATIENT DATA VALIDATION
// ============================================================================

/**
 * Basic fields validation
 */
const BasicFieldsSchema = z.object({
  age: z.number()
    .int('Age must be a whole number')
    .min(18, 'Age must be at least 18 years')
    .max(120, 'Age must be 120 years or less'),
  
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Gender must be male or female' })
  }),
  
  height: z.number().positive('Height must be a positive number').optional(),
  weight: z.number().positive('Weight must be a positive number').optional(),
});

/**
 * Cardiovascular metrics validation
 */
const CardiovascularMetricsSchema = z.object({
  restingBP: z.number()
    .min(60, 'Resting blood pressure must be at least 60 mmHg')
    .max(250, 'Resting blood pressure must be 250 mmHg or less'),
  
  cholesterol: z.number()
    .min(0, 'Cholesterol must be non-negative')
    .max(500, 'Cholesterol must be 500 mg/dL or less'),
  
  maxHR: z.number()
    .int('Maximum heart rate must be a whole number')
    .min(20, 'Maximum heart rate must be at least 20 bpm')
    .max(250, 'Maximum heart rate must be 250 bpm or less'),
  
  oldpeak: z.number()
    .min(0, 'ST depression must be non-negative')
    .max(10, 'ST depression must be 10 mm or less'),
});

/**
 * Chest pain classification
 */
const ChestPainTypeSchema = z.enum(['typical', 'atypical', 'non-anginal', 'asymptomatic'], {
  errorMap: () => ({ message: 'Invalid chest pain type' })
});

/**
 * ECG results classification
 */
const RestingECGSchema = z.enum(['normal', 'st-t', 'lvh'], {
  errorMap: () => ({ message: 'Invalid ECG result type' })
});

/**
 * ST slope classification
 */
const STSlopeSchema = z.enum(['up', 'flat', 'down'], {
  errorMap: () => ({ message: 'Invalid ST slope type' })
});

/**
 * Lifestyle data validation
 */
const LifestyleDataSchema = z.object({
  stressLevel: z.number()
    .int('Stress level must be a whole number')
    .min(1, 'Stress level must be between 1 and 10')
    .max(10, 'Stress level must be between 1 and 10'),
  
  sleepHours: z.number()
    .min(0, 'Sleep hours must be non-negative')
    .max(24, 'Sleep hours must be 24 or less'),
  
  sleepQuality: z.number()
    .int('Sleep quality must be a whole number')
    .min(1, 'Sleep quality must be between 1 and 10')
    .max(10, 'Sleep quality must be between 1 and 10')
    .optional(),
  
  physicalActivity: z.enum(['low', 'moderate', 'high'], {
    errorMap: () => ({ message: 'Physical activity must be low, moderate, or high' })
  }),
  
  exerciseFrequency: z.number()
    .int('Exercise frequency must be a whole number')
    .min(0, 'Exercise frequency must be non-negative')
    .max(7, 'Exercise frequency must be 7 days or less')
    .optional(),
});

/**
 * Medical history validation
 */
const MedicalHistorySchema = z.object({
  smoking: z.boolean(),
  diabetes: z.boolean(),
  previousHeartAttack: z.boolean(),
  cholesterolMedication: z.boolean(),
  bpMedication: z.boolean(),
  lifestyleChanges: z.boolean(),
  
  diabetesMedication: z.enum(['insulin', 'tablets', 'both', 'none']).optional(),
  diabetesTreatment: z.string().max(500).optional(),
  currentMedications: z.string().max(1000).optional(),
  familyHistory: z.array(z.string()).optional(),
  supplements: z.array(z.string()).optional(),
});

/**
 * Diet and habits validation
 */
const DietHabitsSchema = z.object({
  dietType: z.enum(['vegetarian', 'non-vegetarian', 'vegan'], {
    errorMap: () => ({ message: 'Invalid diet type' })
  }),
  
  dietHabits: z.string().max(500).optional(),
  workStress: z.string().max(500).optional(),
  supplementsDescription: z.string().max(500).optional(),
});

/**
 * Complete Patient Data Schema
 */
export const PatientDataSchema = z.object({
  // Basic fields
  age: z.number().int().min(18).max(120),
  gender: z.enum(['male', 'female']),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  
  // Cardiovascular metrics
  restingBP: z.number().min(60).max(250),
  cholesterol: z.number().min(0).max(500),
  maxHR: z.number().int().min(20).max(250),
  oldpeak: z.number().min(0).max(10),
  
  // Clinical classification
  chestPainType: ChestPainTypeSchema,
  restingECG: RestingECGSchema,
  stSlope: STSlopeSchema,
  
  // Symptoms and conditions
  fastingBS: z.boolean(),
  exerciseAngina: z.boolean(),
  
  // Medical history
  smoking: z.boolean(),
  diabetes: z.boolean(),
  previousHeartAttack: z.boolean(),
  cholesterolMedication: z.boolean(),
  bpMedication: z.boolean(),
  lifestyleChanges: z.boolean(),
  
  diabetesMedication: z.enum(['insulin', 'tablets', 'both', 'none']).optional(),
  diabetesTreatment: z.string().max(500).optional(),
  currentMedications: z.string().max(1000).optional(),
  
  // Lifestyle
  stressLevel: z.number().int().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  physicalActivity: z.enum(['low', 'moderate', 'high']),
  exerciseFrequency: z.number().int().min(0).max(7).optional(),
  
  // Diet and habits
  dietType: z.enum(['vegetarian', 'non-vegetarian', 'vegan']),
  dietHabits: z.string().max(500).optional(),
  workStress: z.string().max(500).optional(),
  supplementsDescription: z.string().max(500).optional(),
  
  // Optional fields
  heartRate: z.number().min(30).max(250).optional(),
  ldlCholesterol: z.number().min(0).max(500).optional(),
  hdlCholesterol: z.number().min(0).max(500).optional(),
  bloodSugar: z.number().min(0).max(500).optional(),
  systolicBP: z.number().min(60).max(250).optional(),
  diastolicBP: z.number().min(20).max(200).optional(),
  ecgResults: z.string().max(500).optional(),
  exerciseTestResults: z.string().max(500).optional(),
  familyHistory: z.array(z.string()).optional(),
  supplements: z.array(z.string()).optional(),
});

export type PatientDataInput = z.infer<typeof PatientDataSchema>;

// ============================================================================
// RISK ASSESSMENT VALIDATION
// ============================================================================

/**
 * Risk assessment request validation
 */
export const RiskAssessmentRequestSchema = z.object({
  patientData: PatientDataSchema,
  riskScore: z.number().min(0).max(100).optional(),
  riskLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  types: z.array(z.enum(['medicines', 'ayurveda', 'yoga', 'diet', 'comprehensive'])).optional(),
});

export type RiskAssessmentRequest = z.infer<typeof RiskAssessmentRequestSchema>;

// ============================================================================
// PDF REPORT VALIDATION
// ============================================================================

/**
 * PDF report data validation
 */
export const PDFReportDataSchema = z.object({
  patientInfo: z.object({
    name: z.string().min(1).max(200),
    age: z.number().int().min(18).max(120),
    gender: z.string().min(1),
    assessmentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  }),
  riskAssessment: z.object({
    overallRisk: z.number().min(0).max(100),
    riskLevel: z.string().min(1),
    factors: z.array(z.string()),
    confidence: z.number().min(0).max(1).optional(),
    confidenceInterval: z.object({
      lower: z.number().min(0).max(100),
      upper: z.number().min(0).max(100),
    }).optional(),
  }),
  recommendations: z.object({
    medicines: z.array(z.string()),
    ayurveda: z.array(z.string()),
    yoga: z.array(z.string()),
    diet: z.array(z.string()),
  }),
  reportType: z.enum(['premium', 'professional']),
  reportId: z.string().min(1),
});

export type PDFReportDataInput = z.infer<typeof PDFReportDataSchema>;

// ============================================================================
// RECOMMENDATION VALIDATION
// ============================================================================

/**
 * Recommendation item validation
 */
export const RecommendationItemSchema = z.object({
  category: z.string().min(1).max(100),
  recommendation: z.string().min(1).max(1000),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  evidence: z.string().max(500).optional(),
});

/**
 * Recommendations response validation
 */
export const RecommendationsResponseSchema = z.object({
  medicines: z.array(RecommendationItemSchema),
  ayurveda: z.array(RecommendationItemSchema),
  yoga: z.array(RecommendationItemSchema),
  diet: z.array(RecommendationItemSchema),
  provider: z.enum(['gemini', 'openai', 'fallback']),
  disclaimer: z.string(),
  timestamp: z.string().datetime(),
  confidence: z.number().min(0).max(1),
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate patient data with detailed error reporting
 */
export function validatePatientData(data: unknown): {
  success: boolean;
  data?: PatientDataInput;
  errors?: Record<string, string>;
} {
  try {
    const validated = PatientDataSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { _general: 'Validation error occurred' }
    };
  }
}

/**
 * Validate risk assessment request
 */
export function validateRiskAssessmentRequest(data: unknown): {
  success: boolean;
  data?: RiskAssessmentRequest;
  errors?: Record<string, string>;
} {
  try {
    const validated = RiskAssessmentRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { _general: 'Validation error occurred' }
    };
  }
}

/**
 * Validate PDF report data
 */
export function validatePDFReportData(data: unknown): {
  success: boolean;
  data?: PDFReportDataInput;
  errors?: Record<string, string>;
} {
  try {
    const validated = PDFReportDataSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { _general: 'Validation error occurred' }
    };
  }
}

/**
 * Get user-friendly validation error messages
 */
export function getUserFriendlyValidationErrors(errors: Record<string, string>): string[] {
  return Object.entries(errors).map(([field, message]) => {
    // Improve message readability
    const fieldName = field
      .replace(/_/g, ' ')
      .split('.')
      .pop()
      ?.replace(/([A-Z])/g, ' $1')
      .toLowerCase() || 'field';
    
    return `${fieldName}: ${message}`;
  });
}

// ============================================================================
// EDGE CASE VALIDATORS
// ============================================================================

/**
 * Validate patient age with context
 */
export function validatePatientAge(age: number, context?: string): {
  valid: boolean;
  warning?: string;
} {
  if (age < 18) {
    return { valid: false };
  }
  
  if (age < 30) {
    return {
      valid: true,
      warning: 'Young patient - ensure lifestyle risk factors are assessed thoroughly'
    };
  }
  
  if (age > 100) {
    return {
      valid: true,
      warning: 'Very advanced age - recommend close medical supervision'
    };
  }
  
  return { valid: true };
}

/**
 * Validate blood pressure readings
 */
export function validateBloodPressure(systolic: number, diastolic?: number): {
  valid: boolean;
  category?: string;
  warning?: string;
} {
  if (systolic < 60 || systolic > 250) {
    return { valid: false };
  }
  
  if (diastolic && (diastolic < 20 || diastolic > 200)) {
    return { valid: false };
  }
  
  if (systolic < 90) {
    return {
      valid: true,
      category: 'Low',
      warning: 'Blood pressure is low - monitor for dizziness or weakness'
    };
  }
  
  if (systolic < 120) {
    return { valid: true, category: 'Normal' };
  }
  
  if (systolic < 140) {
    return {
      valid: true,
      category: 'Elevated',
      warning: 'Blood pressure is elevated - lifestyle modifications recommended'
    };
  }
  
  if (systolic >= 180) {
    return {
      valid: true,
      category: 'Hypertensive Crisis',
      warning: 'Blood pressure is critically high - immediate medical attention recommended'
    };
  }
  
  return { valid: true, category: 'Stage 2 Hypertension' };
}

/**
 * Validate cholesterol levels
 */
export function validateCholesterol(totalCholesterol: number): {
  valid: boolean;
  category?: string;
  recommendation?: string;
} {
  if (totalCholesterol < 0 || totalCholesterol > 500) {
    return { valid: false };
  }
  
  if (totalCholesterol < 200) {
    return {
      valid: true,
      category: 'Desirable',
      recommendation: 'Continue current healthy lifestyle'
    };
  }
  
  if (totalCholesterol < 240) {
    return {
      valid: true,
      category: 'Borderline High',
      recommendation: 'Increase physical activity and improve diet'
    };
  }
  
  return {
    valid: true,
    category: 'High',
    recommendation: 'Consult with healthcare provider about medications'
  };
}

/**
 * Validate heart rate
 */
export function validateHeartRate(heartRate: number, context?: 'resting' | 'exercise'): {
  valid: boolean;
  category?: string;
  warning?: string;
} {
  if (heartRate < 20 || heartRate > 250) {
    return { valid: false };
  }
  
  if (context === 'resting') {
    if (heartRate < 60) {
      return {
        valid: true,
        category: 'Bradycardia',
        warning: 'Resting heart rate is low - may indicate good fitness or medical condition'
      };
    }
    
    if (heartRate < 100) {
      return { valid: true, category: 'Normal Resting' };
    }
    
    return {
      valid: true,
      category: 'Tachycardia',
      warning: 'Resting heart rate is high - monitor for stress and health conditions'
    };
  }
  
  return { valid: true };
}

/**
 * Cross-field validation for related metrics
 */
export function validateMetricsConsistency(data: Partial<PatientData>): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check BMI if height and weight provided
  if (data.height && data.weight) {
    const bmi = data.weight / ((data.height / 100) ** 2);
    if (bmi > 35) {
      warnings.push('High BMI - increased cardiovascular risk');
    }
  }
  
  // Check cholesterol vs medication
  if (data.cholesterol && data.cholesterol > 240 && !data.cholesterolMedication) {
    warnings.push('High cholesterol without medication - consider consulting physician');
  }
  
  // Check BP vs medication
  if (data.restingBP && data.restingBP > 140 && !data.bpMedication) {
    warnings.push('High blood pressure without medication - consider consulting physician');
  }
  
  // Check smoking + other risk factors
  if (data.smoking && data.diabetes) {
    warnings.push('Both smoking and diabetes present - significantly increased risk');
  }
  
  // Check lifestyle inconsistency
  if (data.physicalActivity === 'low' && data.stressLevel && data.stressLevel > 7) {
    warnings.push('Low activity combined with high stress - lifestyle modification recommended');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

export default {
  PatientDataSchema,
  RiskAssessmentRequestSchema,
  PDFReportDataSchema,
  RecommendationItemSchema,
  RecommendationsResponseSchema,
  validatePatientData,
  validateRiskAssessmentRequest,
  validatePDFReportData,
  getUserFriendlyValidationErrors,
  validatePatientAge,
  validateBloodPressure,
  validateCholesterol,
  validateHeartRate,
  validateMetricsConsistency,
};
