/**
 * Deterministic mapping table for PDF field labels to form field names
 * Maps common PDF question labels and synonyms to exact input name attributes
 */

export interface FieldMapping {
  fieldName: string;
  labels: string[];
  type: 'number' | 'boolean' | 'select' | 'text';
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}

export const PDF_FIELD_MAPPINGS: Record<string, FieldMapping> = {
  age: {
    fieldName: 'age',
    labels: [
      'age',
      'patient age',
      'age in years',
      'years old',
      'current age',
      'age of patient',
      'patient\'s age'
    ],
    type: 'number',
    validation: {
      min: 1,
      max: 120
    }
  },
  gender: {
    fieldName: 'gender',
    labels: [
      'gender',
      'sex',
      'patient gender',
      'patient sex',
      'male/female',
      'm/f'
    ],
    type: 'select'
  },
  restingBP: {
    fieldName: 'restingBP',
    labels: [
      'resting bp',
      'blood pressure',
      'resting blood pressure',
      'bp',
      'systolic bp',
      'systolic blood pressure',
      'systolic pressure',
      'resting systolic bp'
    ],
    type: 'number',
    validation: {
      min: 60,
      max: 250
    }
  },
  cholesterol: {
    fieldName: 'cholesterol',
    labels: [
      'cholesterol',
      'total cholesterol',
      'serum cholesterol',
      'cholesterol level',
      'chol',
      'total chol',
      'cholesterol mg/dl'
    ],
    type: 'number',
    validation: {
      min: 100,
      max: 500
    }
  },
  maxHR: {
    fieldName: 'maxHR',
    labels: [
      'max hr',
      'maximum heart rate',
      'max heart rate',
      'heart rate',
      'hr',
      'resting heart rate',
      'resting hr',
      'pulse rate',
      'pulse'
    ],
    type: 'number',
    validation: {
      min: 40,
      max: 220
    }
  },
  oldpeak: {
    fieldName: 'oldpeak',
    labels: [
      'oldpeak',
      'st depression',
      'st segment depression',
      'exercise st depression',
      'old peak'
    ],
    type: 'number',
    validation: {
      min: 0,
      max: 10
    }
  },
  chestPainType: {
    fieldName: 'chestPainType',
    labels: [
      'chest pain type',
      'chest pain',
      'type of chest pain',
      'cp type',
      'angina type',
      'pain type'
    ],
    type: 'select'
  },
  restingECG: {
    fieldName: 'restingECG',
    labels: [
      'resting ecg',
      'ecg',
      'ekg',
      'electrocardiogram',
      'resting electrocardiogram',
      'ecg results',
      'resting ekg'
    ],
    type: 'select'
  },
  stSlope: {
    fieldName: 'stSlope',
    labels: [
      'st slope',
      'exercise st slope',
      'slope of st segment',
      'st segment slope',
      'slope'
    ],
    type: 'select'
  },
  diabetes: {
    fieldName: 'diabetes',
    labels: [
      'diabetes',
      'diabetic',
      'diabetes mellitus',
      'blood sugar',
      'high blood sugar',
      'fasting blood sugar',
      'fbs'
    ],
    type: 'boolean'
  },
  exerciseAngina: {
    fieldName: 'exerciseAngina',
    labels: [
      'exercise angina',
      'exercise induced angina',
      'angina during exercise',
      'chest pain during exercise',
      'exang'
    ],
    type: 'boolean'
  },
  smoking: {
    fieldName: 'smoking',
    labels: [
      'smoking',
      'smoker',
      'tobacco use',
      'cigarette smoking',
      'tobacco',
      'smokes'
    ],
    type: 'boolean'
  },
  hasPositiveFamilyHistory: {
    fieldName: 'hasPositiveFamilyHistory',
    labels: [
      'family history',
      'family history of heart disease',
      'cardiac family history',
      'family cardiac history',
      'family hx',
      'fh of heart disease'
    ],
    type: 'boolean'
  },
  hasHypertension: {
    fieldName: 'hasHypertension',
    labels: [
      'hypertension',
      'high blood pressure',
      'htn',
      'diagnosed hypertension',
      'bp medication'
    ],
    type: 'boolean'
  },
  hasMentalHealthIssues: {
    fieldName: 'hasMentalHealthIssues',
    labels: [
      'mental health',
      'depression',
      'anxiety',
      'mental health issues',
      'psychological issues',
      'stress',
      'depression/anxiety'
    ],
    type: 'boolean'
  },
  previousHeartAttack: {
    fieldName: 'previousHeartAttack',
    labels: [
      'previous heart attack',
      'heart attack',
      'myocardial infarction',
      'mi',
      'prior mi',
      'past heart attack',
      'cardiac event'
    ],
    type: 'boolean'
  },
  height: {
    fieldName: 'height',
    labels: [
      'height',
      'height cm',
      'height in cm',
      'patient height',
      'ht'
    ],
    type: 'number',
    validation: {
      min: 100,
      max: 250
    }
  },
  weight: {
    fieldName: 'weight',
    labels: [
      'weight',
      'weight kg',
      'weight in kg',
      'body weight',
      'patient weight',
      'wt'
    ],
    type: 'number',
    validation: {
      min: 30,
      max: 300
    }
  },
  // Enhanced fields
  hdlCholesterol: {
    fieldName: 'hdlCholesterol',
    labels: [
      'hdl',
      'hdl cholesterol',
      'hdl-c',
      'good cholesterol',
      'high density lipoprotein'
    ],
    type: 'number',
    validation: {
      min: 0,
      max: 200
    }
  },
  ldlCholesterol: {
    fieldName: 'ldlCholesterol',
    labels: [
      'ldl',
      'ldl cholesterol',
      'ldl-c',
      'bad cholesterol',
      'low density lipoprotein'
    ],
    type: 'number',
    validation: {
      min: 0,
      max: 300
    }
  },
  triglycerides: {
    fieldName: 'triglycerides',
    labels: [
      'triglycerides',
      'tg',
      'triglyceride level',
      'serum triglycerides'
    ],
    type: 'number',
    validation: {
      min: 0,
      max: 1000
    }
  },
  systolicBP: {
    fieldName: 'systolicBP',
    labels: [
      'systolic bp',
      'systolic',
      'systolic blood pressure',
      'sbp'
    ],
    type: 'number',
    validation: {
      min: 60,
      max: 250
    }
  },
  diastolicBP: {
    fieldName: 'diastolicBP',
    labels: [
      'diastolic bp',
      'diastolic',
      'diastolic blood pressure',
      'dbp'
    ],
    type: 'number',
    validation: {
      min: 30,
      max: 150
    }
  },
  waistCircumference: {
    fieldName: 'waistCircumference',
    labels: [
      'waist circumference',
      'waist',
      'waist size',
      'abdominal circumference'
    ],
    type: 'number',
    validation: {
      min: 40,
      max: 200
    }
  },
  sleep_hours: {
    fieldName: 'sleep_hours',
    labels: [
      'sleep hours',
      'hours of sleep',
      'sleep duration',
      'sleep per night',
      'sleeping hours'
    ],
    type: 'number',
    validation: {
      min: 0,
      max: 24
    }
  }
};

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Find matching field for a given label
 */
export function findMatchingField(label: string): FieldMapping | null {
  const normalizedLabel = normalizeText(label);
  
  for (const mapping of Object.values(PDF_FIELD_MAPPINGS)) {
    for (const mappingLabel of mapping.labels) {
      const normalizedMappingLabel = normalizeText(mappingLabel);
      
      // Exact match
      if (normalizedLabel === normalizedMappingLabel) {
        return mapping;
      }
      
      // Contains match (label contains the mapping label or vice versa)
      if (normalizedLabel.includes(normalizedMappingLabel) || 
          normalizedMappingLabel.includes(normalizedLabel)) {
        return mapping;
      }
    }
  }
  
  return null;
}

/**
 * Validate parsed value against field constraints
 */
export function validateValue(
  value: string | number | boolean,
  mapping: FieldMapping
): { valid: boolean; normalizedValue?: string | number | boolean; error?: string } {
  if (mapping.type === 'number') {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    
    if (isNaN(numValue)) {
      return { valid: false, error: 'Invalid number' };
    }
    
    if (mapping.validation?.min !== undefined && numValue < mapping.validation.min) {
      return { valid: false, error: `Value below minimum ${mapping.validation.min}` };
    }
    
    if (mapping.validation?.max !== undefined && numValue > mapping.validation.max) {
      return { valid: false, error: `Value above maximum ${mapping.validation.max}` };
    }
    
    return { valid: true, normalizedValue: numValue };
  }
  
  if (mapping.type === 'boolean') {
    const strValue = String(value).toLowerCase().trim();
    const truthyValues = ['yes', 'true', '1', 'positive', 'present'];
    const falsyValues = ['no', 'false', '0', 'negative', 'absent'];
    
    if (truthyValues.includes(strValue)) {
      return { valid: true, normalizedValue: true };
    }
    
    if (falsyValues.includes(strValue)) {
      return { valid: true, normalizedValue: false };
    }
    
    return { valid: false, error: 'Invalid boolean value' };
  }
  
  // For select and text types, return as-is
  return { valid: true, normalizedValue: value };
}
