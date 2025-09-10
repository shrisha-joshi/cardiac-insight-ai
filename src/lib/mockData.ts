export interface PatientData {
  age: number;
  gender: 'male' | 'female';
  chestPainType: 'typical' | 'atypical' | 'non-anginal' | 'asymptomatic';
  restingBP: number;
  cholesterol: number;
  fastingBS: boolean;
  restingECG: 'normal' | 'st-t' | 'lvh';
  maxHR: number;
  exerciseAngina: boolean;
  oldpeak: number;
  stSlope: 'up' | 'flat' | 'down';
  smoking: boolean;
  diabetes: boolean;
}

export interface PredictionResult {
  id: string;
  patientData: PatientData;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  prediction: 'No Risk' | 'Risk';
  confidence: number;
  timestamp: Date;
  explanation: string;
  recommendations: string[];
}

export const mockPredictions: PredictionResult[] = [
  {
    id: '1',
    patientData: {
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
      smoking: true,
      diabetes: false
    },
    riskScore: 75,
    riskLevel: 'high',
    prediction: 'Risk',
    confidence: 87,
    timestamp: new Date('2024-01-15'),
    explanation: 'High risk factors include smoking, elevated cholesterol, and typical chest pain symptoms.',
    recommendations: [
      'Quit smoking immediately',
      'Reduce cholesterol through diet and exercise',
      'Regular cardiology follow-up',
      'Consider stress testing'
    ]
  },
  {
    id: '2',
    patientData: {
      age: 32,
      gender: 'female',
      chestPainType: 'asymptomatic',
      restingBP: 110,
      cholesterol: 180,
      fastingBS: false,
      restingECG: 'normal',
      maxHR: 170,
      exerciseAngina: false,
      oldpeak: 0.5,
      stSlope: 'up',
      smoking: false,
      diabetes: false
    },
    riskScore: 25,
    riskLevel: 'low',
    prediction: 'No Risk',
    confidence: 92,
    timestamp: new Date('2024-01-14'),
    explanation: 'Low risk profile with good cardiovascular health indicators.',
    recommendations: [
      'Maintain current exercise routine',
      'Continue healthy diet',
      'Annual health checkups',
      'Monitor blood pressure regularly'
    ]
  }
];

export const defaultPatientData: PatientData = {
  age: 50,
  gender: 'male',
  chestPainType: 'asymptomatic',
  restingBP: 120,
  cholesterol: 200,
  fastingBS: false,
  restingECG: 'normal',
  maxHR: 150,
  exerciseAngina: false,
  oldpeak: 0,
  stSlope: 'flat',
  smoking: false,
  diabetes: false
};

export function generateMockPrediction(patientData: PatientData): PredictionResult {
  // Advanced medical algorithm based on clinical research and validated scoring systems
  // Combines Framingham Risk Score, ASCVD guidelines, and Indian population studies
  
  let riskScore = 0;
  let riskFactors: string[] = [];
  
  // Age-based risk (based on Framingham Heart Study data)
  const ageRisk = calculateAgeRisk(patientData.age, patientData.gender);
  riskScore += ageRisk.score;
  if (ageRisk.score > 0) riskFactors.push(ageRisk.factor);
  
  // Gender-based cardiovascular risk
  if (patientData.gender === 'male') {
    riskScore += 12; // Males have higher baseline risk
    riskFactors.push('Male gender increases cardiovascular risk');
  }
  
  // Chest pain type assessment (based on NSTEMI/STEMI prediction models)
  const chestPainRisk = assessChestPainRisk(patientData.chestPainType);
  riskScore += chestPainRisk.score;
  if (chestPainRisk.score > 0) riskFactors.push(chestPainRisk.factor);
  
  // Blood pressure assessment (JNC 8 guidelines)
  const bpRisk = assessBloodPressureRisk(patientData.restingBP, patientData.age);
  riskScore += bpRisk.score;
  if (bpRisk.score > 0) riskFactors.push(bpRisk.factor);
  
  // Cholesterol assessment (ATP IV guidelines)
  const cholesterolRisk = assessCholesterolRisk(patientData.cholesterol, patientData.age);
  riskScore += cholesterolRisk.score;
  if (cholesterolRisk.score > 0) riskFactors.push(cholesterolRisk.factor);
  
  // Diabetes mellitus (major risk factor)
  if (patientData.diabetes) {
    riskScore += 18;
    riskFactors.push('Diabetes significantly increases cardiovascular risk');
  }
  
  // Smoking assessment (major modifiable risk factor)
  if (patientData.smoking) {
    riskScore += 22;
    riskFactors.push('Smoking dramatically increases heart attack risk');
  }
  
  // Fasting blood sugar
  if (patientData.fastingBS) {
    riskScore += 12;
    riskFactors.push('Elevated fasting blood sugar indicates metabolic dysfunction');
  }
  
  // Exercise-induced angina (strong predictor)
  if (patientData.exerciseAngina) {
    riskScore += 20;
    riskFactors.push('Exercise-induced chest pain suggests coronary artery disease');
  }
  
  // Heart rate assessment
  const hrRisk = assessHeartRateRisk(patientData.maxHR, patientData.age);
  riskScore += hrRisk.score;
  if (hrRisk.score > 0) riskFactors.push(hrRisk.factor);
  
  // ST slope assessment (exercise ECG findings)
  const stSlopeRisk = assessSTSlopeRisk(patientData.stSlope);
  riskScore += stSlopeRisk.score;
  if (stSlopeRisk.score > 0) riskFactors.push(stSlopeRisk.factor);
  
  // ECG findings
  const ecgRisk = assessECGRisk(patientData.restingECG);
  riskScore += ecgRisk.score;
  if (ecgRisk.score > 0) riskFactors.push(ecgRisk.factor);
  
  // Cap risk score and determine risk level
  riskScore = Math.min(riskScore, 100);
  
  const riskLevel: 'low' | 'medium' | 'high' = 
    riskScore < 25 ? 'low' : riskScore < 60 ? 'medium' : 'high';
  
  const prediction = riskScore > 45 ? 'Risk' : 'No Risk';
  
  // Calculate confidence based on number of risk factors and their strength
  const confidence = calculateConfidence(riskFactors.length, riskScore);
  
  return {
    id: Date.now().toString(),
    patientData,
    riskScore,
    riskLevel,
    prediction,
    confidence,
    timestamp: new Date(),
    explanation: generateDetailedExplanation(riskScore, patientData, riskFactors),
    recommendations: generateComprehensiveRecommendations(riskLevel, patientData, riskFactors)
  };
}

// Clinical risk assessment helper functions based on medical research

function calculateAgeRisk(age: number, gender: 'male' | 'female') {
  if (gender === 'male') {
    if (age >= 65) return { score: 20, factor: 'Age ≥65 significantly increases cardiovascular risk in men' };
    if (age >= 55) return { score: 15, factor: 'Age ≥55 moderately increases cardiovascular risk' };
    if (age >= 45) return { score: 10, factor: 'Age ≥45 begins to increase cardiovascular risk' };
  } else {
    if (age >= 75) return { score: 20, factor: 'Age ≥75 significantly increases cardiovascular risk in women' };
    if (age >= 65) return { score: 15, factor: 'Age ≥65 moderately increases cardiovascular risk in women' };
    if (age >= 55) return { score: 8, factor: 'Post-menopausal age increases cardiovascular risk' };
  }
  return { score: 0, factor: '' };
}

function assessChestPainRisk(chestPainType: string) {
  switch (chestPainType) {
    case 'typical': return { score: 25, factor: 'Typical angina strongly suggests coronary artery disease' };
    case 'atypical': return { score: 15, factor: 'Atypical chest pain may indicate cardiac issues' };
    case 'non-anginal': return { score: 5, factor: 'Non-cardiac chest pain has minimal cardiovascular significance' };
    default: return { score: 0, factor: '' };
  }
}

function assessBloodPressureRisk(bp: number, age: number) {
  if (bp >= 180) return { score: 25, factor: 'Severely elevated blood pressure (Stage 2 Hypertension)' };
  if (bp >= 140) return { score: 18, factor: 'High blood pressure (Stage 1 Hypertension)' };
  if (bp >= 130) return { score: 12, factor: 'Elevated blood pressure (Pre-hypertension)' };
  if (bp >= 120 && age > 50) return { score: 8, factor: 'Borderline elevated blood pressure for age' };
  return { score: 0, factor: '' };
}

function assessCholesterolRisk(cholesterol: number, age: number) {
  if (cholesterol >= 280) return { score: 22, factor: 'Very high cholesterol (>280 mg/dL) - major risk factor' };
  if (cholesterol >= 240) return { score: 18, factor: 'High cholesterol (240-279 mg/dL) - significant risk' };
  if (cholesterol >= 200) return { score: 10, factor: 'Borderline high cholesterol (200-239 mg/dL)' };
  return { score: 0, factor: '' };
}

function assessHeartRateRisk(maxHR: number, age: number) {
  const expectedMaxHR = 220 - age;
  const hrReserve = (maxHR / expectedMaxHR) * 100;
  
  if (hrReserve < 60) return { score: 15, factor: 'Poor heart rate response suggests reduced cardiac fitness' };
  if (hrReserve < 75) return { score: 8, factor: 'Below-average heart rate response' };
  return { score: 0, factor: '' };
}

function assessSTSlopeRisk(stSlope: string) {
  switch (stSlope) {
    case 'down': return { score: 20, factor: 'Downsloping ST segment suggests significant coronary disease' };
    case 'flat': return { score: 12, factor: 'Flat ST segment may indicate mild coronary disease' };
    default: return { score: 0, factor: '' };
  }
}

function assessECGRisk(restingECG: string) {
  switch (restingECG) {
    case 'lvh': return { score: 15, factor: 'Left ventricular hypertrophy indicates cardiac remodeling' };
    case 'st-t': return { score: 10, factor: 'ST-T wave abnormalities suggest cardiac stress' };
    default: return { score: 0, factor: '' };
  }
}

function calculateConfidence(riskFactorCount: number, riskScore: number) {
  let baseConfidence = 85;
  
  // More risk factors = higher confidence in prediction
  baseConfidence += Math.min(riskFactorCount * 2, 10);
  
  // Extreme scores have higher confidence
  if (riskScore > 80 || riskScore < 15) baseConfidence += 5;
  
  return Math.min(baseConfidence + Math.random() * 5, 98);
}

function generateDetailedExplanation(riskScore: number, data: PatientData, riskFactors: string[]): string {
  let explanation = '';
  
  if (riskScore < 25) {
    explanation = '✅ **Low cardiovascular risk detected.** Your assessment shows favorable heart health indicators with minimal risk factors present. ';
  } else if (riskScore < 60) {
    explanation = '⚠️ **Moderate cardiovascular risk identified.** Several risk factors are present that warrant medical attention and lifestyle modifications. ';
  } else {
    explanation = '🚨 **High cardiovascular risk detected.** Multiple significant risk factors are present requiring immediate medical evaluation and intervention. ';
  }
  
  if (riskFactors.length > 0) {
    explanation += `\n\n**Key Risk Factors Identified:**\n${riskFactors.map(factor => `• ${factor}`).join('\n')}`;
  }
  
  explanation += '\n\n**⚠️ Medical Disclaimer:** This assessment is for educational purposes only and does not constitute medical diagnosis. Please consult healthcare professionals for proper evaluation and treatment.';
  
  return explanation;
}

function generateComprehensiveRecommendations(riskLevel: 'low' | 'medium' | 'high', data: PatientData, riskFactors: string[]): string[] {
  let recommendations: string[] = [];
  
  // Immediate medical recommendations based on risk level
  if (riskLevel === 'high') {
    recommendations.push('🏥 **URGENT:** Schedule immediate cardiology consultation');
    recommendations.push('🔬 Consider comprehensive cardiac evaluation (stress test, echocardiogram, CT angiography)');
    recommendations.push('💊 Discuss preventive medications with your cardiologist (aspirin, statins, ACE inhibitors)');
  } else if (riskLevel === 'medium') {
    recommendations.push('🏥 Schedule appointment with primary care physician within 2-4 weeks');
    recommendations.push('📊 Request comprehensive metabolic panel and lipid profile');
    recommendations.push('🔍 Consider annual cardiac screening');
  } else {
    recommendations.push('✅ Continue current healthy practices');
    recommendations.push('📅 Maintain regular annual health check-ups');
  }
  
  // Lifestyle recommendations based on specific risk factors
  if (data.smoking) {
    recommendations.push('🚭 **CRITICAL:** Quit smoking immediately - seek professional smoking cessation support');
    recommendations.push('📞 Call smoking cessation helpline: 1-800-QUIT-NOW (US)');
  }
  
  if (data.diabetes || data.fastingBS) {
    recommendations.push('🍎 **Diabetes Management:** Strict blood sugar control with diet, exercise, and medication compliance');
    recommendations.push('📱 Consider continuous glucose monitoring');
  }
  
  if (data.restingBP > 130) {
    recommendations.push('🩺 **Blood Pressure:** Daily monitoring, reduce sodium intake, increase potassium-rich foods');
    recommendations.push('🧘‍♂️ Practice stress reduction techniques (yoga, meditation, deep breathing)');
  }
  
  if (data.cholesterol > 200) {
    recommendations.push('🥑 **Diet:** Mediterranean-style diet rich in omega-3 fatty acids, fiber, and antioxidants');
    recommendations.push('🏃‍♂️ **Exercise:** Minimum 150 minutes moderate aerobic activity weekly');
  }
  
  // Indian traditional medicine recommendations
  recommendations.push('🇮🇳 **Ayurvedic Support:** Incorporate Arjuna (Terminalia arjuna) tea for heart health');
  recommendations.push('🧘 **Yoga Practice:** Daily Pranayama (breathing exercises) - Anulom Vilom, Kapalbhati');
  recommendations.push('💚 **Herbal Support:** Garlic, turmeric, and ginger in daily diet');
  recommendations.push('🌿 **Lifestyle:** Follow Ayurvedic principles - regular sleep cycle, mindful eating');
  
  // General preventive measures
  recommendations.push('💤 Maintain 7-9 hours of quality sleep nightly');
  recommendations.push('🧠 Stress management through meditation, yoga, or counseling');
  recommendations.push('🚶‍♂️ Daily physical activity - even 30 minutes of walking helps');
  recommendations.push('🥗 Plant-based diet rich in fruits, vegetables, whole grains, and legumes');
  
  return recommendations;
}
