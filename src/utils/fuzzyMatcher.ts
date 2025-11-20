/**
 * Fuzzy String Matching Utilities for Medical Field Recognition
 * Provides Levenshtein distance and synonym-based matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * 1.0 = identical, 0.0 = completely different
 */
export function similarityRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Medical terminology synonym mappings
 * Maps common medical terms to their canonical field names
 */
export const medicalSynonyms: Record<string, string[]> = {
  age: ['age', 'patient age', 'yrs', 'years old', 'yr', 'years', 'dob', 'date of birth'],
  
  restingBP: [
    'blood pressure', 'bp', 'systolic bp', 'systolic', 'resting bp', 
    'sys bp', 'sbp', 'systolic pressure', 'blood pressure systolic'
  ],
  
  cholesterol: [
    'cholesterol', 'total cholesterol', 'chol', 'tc', 'serum cholesterol',
    'total chol', 'cholesterol level', 'cholesterol total'
  ],
  
  maxHR: [
    'heart rate', 'hr', 'pulse', 'max hr', 'maximum heart rate', 'max heart rate',
    'peak hr', 'peak heart rate', 'heart rate max', 'pulse rate'
  ],
  
  restingHR: [
    'resting heart rate', 'resting hr', 'rhr', 'rest hr', 'resting pulse'
  ],
  
  fastingBS: [
    'fasting blood sugar', 'fbs', 'blood glucose', 'glucose', 'blood sugar',
    'fasting glucose', 'fbg', 'fasting blood glucose', 'bg', 'bs'
  ],
  
  restingECG: [
    'ecg', 'ekg', 'electrocardiogram', 'resting ecg', 'rest ecg', 'ecg results',
    'st segment', 'ecg findings', 'electrocardiograph'
  ],
  
  exerciseAngina: [
    'exercise angina', 'exertional angina', 'angina on exertion', 'exercise chest pain',
    'exertional chest pain', 'angina with exercise', 'exercise induced angina'
  ],
  
  oldpeak: [
    'oldpeak', 'st depression', 'st segment depression', 'exercise st depression',
    'st depression exercise', 'old peak'
  ],
  
  slope: [
    'slope', 'st slope', 'slope of st', 'st segment slope', 'exercise st slope'
  ],
  
  ca: [
    'ca', 'calcium score', 'coronary calcium', 'fluoroscopy', 'major vessels',
    'number of vessels', 'vessels colored'
  ],
  
  thal: [
    'thal', 'thallium', 'thallium stress test', 'thallium scan', 'thalassemia',
    'stress test', 'nuclear stress'
  ],
  
  chestPainType: [
    'chest pain type', 'cp type', 'chest pain', 'angina type', 'cp',
    'type of chest pain', 'chest pain category'
  ],
  
  sex: [
    'sex', 'gender', 'male/female', 'm/f', 'patient sex', 'patient gender'
  ],
  
  diabetes: [
    'diabetes', 'diabetic', 'dm', 'diabetes mellitus', 'diabetic status',
    'has diabetes', 'diabetes history'
  ],
  
  smoking: [
    'smoking', 'smoker', 'tobacco use', 'cigarettes', 'tobacco',
    'smoking status', 'smoking history', 'tobacco user'
  ],
  
  familyHistory: [
    'family history', 'fh', 'family hx', 'family history cvd', 
    'family history heart disease', 'family history cardiac',
    'fh heart disease', 'hereditary risk'
  ],
  
  hypertension: [
    'hypertension', 'high blood pressure', 'htn', 'elevated bp',
    'high bp', 'hypertensive', 'bp elevation'
  ],
  
  previousHeartAttack: [
    'previous heart attack', 'prior heart attack', 'history of mi',
    'myocardial infarction', 'heart attack history', 'prior mi',
    'previous mi', 'past heart attack'
  ],
  
  hdlCholesterol: [
    'hdl', 'hdl cholesterol', 'hdl-c', 'high density lipoprotein',
    'good cholesterol', 'hdl level'
  ],
  
  ldlCholesterol: [
    'ldl', 'ldl cholesterol', 'ldl-c', 'low density lipoprotein',
    'bad cholesterol', 'ldl level'
  ],
  
  triglycerides: [
    'triglycerides', 'tg', 'trig', 'triglyceride', 'trigs',
    'triglyceride level', 'serum triglycerides'
  ],
  
  weight: [
    'weight', 'wt', 'body weight', 'weight kg', 'weight lbs',
    'current weight', 'body mass'
  ],
  
  height: [
    'height', 'ht', 'height cm', 'stature', 'body height'
  ],
  
  bmi: [
    'bmi', 'body mass index', 'body mass', 'weight index'
  ],
  
  waistCircumference: [
    'waist circumference', 'waist', 'wc', 'waist size',
    'abdominal circumference', 'waist measurement'
  ],
  
  sleepHours: [
    'sleep hours', 'hours of sleep', 'sleep duration', 'sleep',
    'hours sleep', 'sleep time', 'sleep per night'
  ],
  
  stressLevel: [
    'stress level', 'stress', 'stress score', 'perceived stress',
    'stress rating', 'stress index'
  ],
  
  exerciseHours: [
    'exercise hours', 'physical activity', 'exercise', 'activity hours',
    'exercise time', 'weekly exercise', 'physical activity hours'
  ]
};

/**
 * Find best matching field using fuzzy matching and synonyms
 * @param label - The label to match
 * @param threshold - Minimum similarity ratio (0-1) to consider a match
 * @returns Field name and confidence score, or null if no match
 */
export function findFuzzyMatch(
  label: string, 
  threshold: number = 0.75
): { field: string; confidence: number } | null {
  const normalizedLabel = label.toLowerCase().trim();
  let bestMatch: { field: string; confidence: number } | null = null;
  let highestConfidence = threshold;

  // Check each field's synonyms
  for (const [field, synonyms] of Object.entries(medicalSynonyms)) {
    for (const synonym of synonyms) {
      const normalizedSynonym = synonym.toLowerCase().trim();
      
      // Exact match = highest confidence
      if (normalizedLabel === normalizedSynonym) {
        return { field, confidence: 1.0 };
      }
      
      // Check if label contains synonym or vice versa
      if (normalizedLabel.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedLabel)) {
        const containsConfidence = 0.9;
        if (containsConfidence > highestConfidence) {
          bestMatch = { field, confidence: containsConfidence };
          highestConfidence = containsConfidence;
        }
        continue;
      }
      
      // Calculate fuzzy similarity
      const similarity = similarityRatio(normalizedLabel, normalizedSynonym);
      if (similarity > highestConfidence) {
        bestMatch = { field, confidence: similarity };
        highestConfidence = similarity;
      }
    }
  }

  return bestMatch;
}

/**
 * Extract numeric value with unit detection
 * @param text - Text containing numeric value
 * @returns Object with value and detected unit
 */
export function extractNumericWithUnit(text: string): { value: number; unit: string | null } | null {
  // Pattern for number with optional decimal and unit
  const patterns = [
    /(\d+\.?\d*)\s*(mmhg|mm hg|mmol\/l|mg\/dl|mg\/l|bpm|beats\/min|cm|kg|lbs|pounds|inches|in)/i,
    /(\d+\.?\d*)/,  // Just number if no unit
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2] ? match[2].toLowerCase() : null;
      
      if (!isNaN(value)) {
        return { value, unit };
      }
    }
  }

  return null;
}

/**
 * Detect and parse blood pressure in various formats
 * @param text - Text containing blood pressure reading
 * @returns Systolic and diastolic values, or null
 */
export function parseBloodPressure(text: string): { systolic: number; diastolic: number } | null {
  // Patterns: 120/80, 120 / 80, 120-80, 120 over 80
  const patterns = [
    new RegExp("(\\d{2,3})\\s*[/-]\\s*(\\d{2,3})"),
    /(\d{2,3})\s+over\s+(\d{2,3})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const systolic = parseInt(match[1]);
      const diastolic = parseInt(match[2]);
      
      // Validate ranges
      if (systolic >= 70 && systolic <= 250 && diastolic >= 40 && diastolic <= 150) {
        return { systolic, diastolic };
      }
    }
  }

  return null;
}

/**
 * Parse boolean values from various text formats
 * @param text - Text containing boolean-like value
 * @returns Boolean value or null
 */
export function parseBoolean(text: string): boolean | null {
  const normalized = text.toLowerCase().trim();
  
  const trueValues = ['yes', 'true', 'positive', 'present', '1', 'y'];
  const falseValues = ['no', 'false', 'negative', 'absent', '0', 'n'];
  
  if (trueValues.includes(normalized)) return true;
  if (falseValues.includes(normalized)) return false;
  
  return null;
}
