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
  // New enhanced fields
  previousHeartAttack: boolean;
  cholesterolMedication: boolean;
  diabetesMedication: 'insulin' | 'tablets' | 'both' | 'none';
  bpMedication: boolean;
  lifestyleChanges: boolean;
  dietType: 'vegetarian' | 'non-vegetarian' | 'vegan';
  stressLevel: number; // 1-10 scale
  sleepHours: number;
  physicalActivity: 'low' | 'moderate' | 'high';
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
  diabetes: false,
  // New enhanced defaults
  previousHeartAttack: false,
  cholesterolMedication: false,
  diabetesMedication: 'none',
  bpMedication: false,
  lifestyleChanges: false,
  dietType: 'vegetarian',
  stressLevel: 5,
  sleepHours: 7,
  physicalActivity: 'moderate',
};

export function generateMockPrediction(patientData: PatientData): PredictionResult {
  // Advanced medical algorithm with enhanced lifestyle and historical factors
  let riskScore = 0;
  let riskFactors: string[] = [];
  
  // Age-based risk
  const ageRisk = calculateAgeRisk(patientData.age, patientData.gender);
  riskScore += ageRisk.score;
  if (ageRisk.score > 0) riskFactors.push(ageRisk.factor);
  
  // Gender-based cardiovascular risk
  if (patientData.gender === 'male') {
    riskScore += 12;
    riskFactors.push('Male gender increases cardiovascular risk');
  }
  
  // Previous heart attack (major risk factor)
  if (patientData.previousHeartAttack) {
    riskScore += 35;
    riskFactors.push('History of heart attack significantly increases risk of future cardiac events');
    
    // Medication compliance helps reduce risk
    if (patientData.cholesterolMedication) {
      riskScore -= 8;
    } else {
      riskScore += 5;
      riskFactors.push('Not taking cholesterol medication after heart attack increases risk');
    }
  }
  
  // Enhanced diabetes assessment
  if (patientData.diabetes) {
    riskScore += 18;
    riskFactors.push('Diabetes significantly increases cardiovascular risk');
    
    // Medication management impact
    if (patientData.diabetesMedication === 'none') {
      riskScore += 12;
      riskFactors.push('Unmanaged diabetes dramatically increases heart attack risk');
    } else if (patientData.diabetesMedication === 'both') {
      riskScore -= 5; // Better controlled
    }
  }
  
  // Blood pressure with medication assessment
  const bpRisk = assessBloodPressureRisk(patientData.restingBP, patientData.age);
  riskScore += bpRisk.score;
  if (bpRisk.score > 0) riskFactors.push(bpRisk.factor);
  
  if (patientData.restingBP > 130) {
    if (patientData.bpMedication) {
      riskScore -= 6; // Medication helps
    }
    if (patientData.lifestyleChanges) {
      riskScore -= 8; // Lifestyle changes help
    }
  }
  
  // Other existing assessments
  const chestPainRisk = assessChestPainRisk(patientData.chestPainType);
  riskScore += chestPainRisk.score;
  if (chestPainRisk.score > 0) riskFactors.push(chestPainRisk.factor);
  
  const cholesterolRisk = assessCholesterolRisk(patientData.cholesterol, patientData.age);
  riskScore += cholesterolRisk.score;
  if (cholesterolRisk.score > 0) riskFactors.push(cholesterolRisk.factor);
  
  if (patientData.smoking) {
    riskScore += 22;
    riskFactors.push('Smoking dramatically increases heart attack risk');
  }
  
  if (patientData.fastingBS) {
    riskScore += 12;
    riskFactors.push('Elevated fasting blood sugar indicates metabolic dysfunction');
  }
  
  if (patientData.exerciseAngina) {
    riskScore += 20;
    riskFactors.push('Exercise-induced chest pain suggests coronary artery disease');
  }
  
  // Enhanced lifestyle assessment
  if (patientData.physicalActivity === 'low') {
    riskScore += 12;
    riskFactors.push('Sedentary lifestyle significantly increases cardiovascular risk');
  } else if (patientData.physicalActivity === 'high') {
    riskScore -= 8; // Protective factor
  }
  
  // Diet assessment
  if (patientData.dietType === 'vegetarian' || patientData.dietType === 'vegan') {
    riskScore -= 6; // Plant-based diet is protective
  }
  
  // Stress assessment
  if (patientData.stressLevel >= 8) {
    riskScore += 15;
    riskFactors.push('High stress levels contribute significantly to cardiovascular disease');
  } else if (patientData.stressLevel <= 3) {
    riskScore -= 5; // Low stress is protective
  }
  
  // Sleep assessment
  if (patientData.sleepHours < 6 || patientData.sleepHours > 9) {
    riskScore += 10;
    riskFactors.push('Poor sleep patterns increase cardiovascular risk');
  }
  
  // Other clinical assessments
  const hrRisk = assessHeartRateRisk(patientData.maxHR, patientData.age);
  riskScore += hrRisk.score;
  if (hrRisk.score > 0) riskFactors.push(hrRisk.factor);
  
  const stSlopeRisk = assessSTSlopeRisk(patientData.stSlope);
  riskScore += stSlopeRisk.score;
  if (stSlopeRisk.score > 0) riskFactors.push(stSlopeRisk.factor);
  
  const ecgRisk = assessECGRisk(patientData.restingECG);
  riskScore += ecgRisk.score;
  if (ecgRisk.score > 0) riskFactors.push(ecgRisk.factor);
  
  // Cap risk score and determine risk level
  riskScore = Math.min(Math.max(riskScore, 0), 100);
  
  const riskLevel: 'low' | 'medium' | 'high' = 
    riskScore < 25 ? 'low' : riskScore < 60 ? 'medium' : 'high';
  
  const prediction = riskScore > 45 ? 'Risk' : 'No Risk';
  
  const confidence = calculateConfidence(riskFactors.length, riskScore);
  
  return {
    id: Date.now().toString(),
    patientData,
    riskScore,
    riskLevel,
    prediction,
    confidence,
    timestamp: new Date(),
    explanation: generateEnhancedExplanationWithReassurance(riskScore, riskLevel, patientData, riskFactors),
    recommendations: generateEnhancedIndianRecommendations(riskLevel, patientData, riskFactors)
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

function generateEnhancedExplanationWithReassurance(riskScore: number, riskLevel: 'low' | 'medium' | 'high', data: PatientData, riskFactors: string[]): string {
  let explanation = '';
  
  // Reassuring introduction
  explanation += '💗 **Your Heart Health Assessment Results**\n\n';
  
  if (riskLevel === 'low') {
    explanation += `**Excellent news!** Your current heart attack risk is **low (${riskScore.toFixed(1)}%)**. This indicates a strong foundation for cardiovascular health. `;
  } else if (riskLevel === 'medium') {
    explanation += `Your heart attack risk assessment shows a **moderate level (${riskScore.toFixed(1)}%)**. While this isn't immediately alarming, it presents valuable opportunities to enhance your heart health. `;
  } else {
    explanation += `Your assessment indicates a **higher risk level (${riskScore.toFixed(1)}%)** for cardiovascular events. Please don't be alarmed - this assessment is designed to help you take proactive steps toward better heart health. `;
  }
  
  explanation += 'Remember, this is a predictive tool to guide preventive care, not a medical diagnosis.\n\n';
  
  // Risk factors with context
  if (riskFactors.length > 0) {
    explanation += '### ⚠️ Key Areas for Attention:\n';
    riskFactors.slice(0, 5).forEach((factor, index) => {
      explanation += `${index + 1}. ${factor}\n`;
    });
    explanation += '\n';
  }
  
  // Protective factors
  let protectiveFactors: string[] = [];
  if (data.dietType === 'vegetarian' || data.dietType === 'vegan') {
    protectiveFactors.push('Plant-based diet provides natural cardiovascular protection');
  }
  if (data.physicalActivity === 'high') {
    protectiveFactors.push('High physical activity significantly reduces heart disease risk');
  }
  if (!data.smoking) {
    protectiveFactors.push('Non-smoking status protects against cardiovascular disease');
  }
  if (data.stressLevel <= 5) {
    protectiveFactors.push('Well-managed stress levels support heart health');
  }
  
  if (protectiveFactors.length > 0) {
    explanation += '### ✅ Your Heart-Healthy Strengths:\n';
    protectiveFactors.forEach((factor, index) => {
      explanation += `${index + 1}. ${factor}\n`;
    });
    explanation += '\n';
  }
  
  // Personalized insights
  explanation += '### 🎯 What This Means for You:\n';
  explanation += 'Heart disease is largely preventable through lifestyle modifications. The recommendations provided combine modern medical guidelines with traditional Indian approaches including Ayurveda and yoga. ';
  explanation += 'Small, consistent changes can lead to significant improvements in your cardiovascular health.\n\n';
  
  // Reassuring conclusion
  explanation += '### 🌟 Moving Forward:\n';
  explanation += 'This assessment empowers you with knowledge to make informed health decisions. ';
  explanation += 'Focus on the actionable recommendations, and remember that every positive change, no matter how small, contributes to better heart health.\n\n';
  
  explanation += '**⚠️ Important Reminder:** This assessment is for educational purposes only and does not constitute professional medical advice. Always consult with qualified healthcare providers for medical evaluation, diagnosis, and treatment decisions.';
  
  return explanation;
}

function generateEnhancedIndianRecommendations(riskLevel: 'low' | 'medium' | 'high', data: PatientData, riskFactors: string[]): string[] {
  let recommendations: string[] = [];
  
  // Medical recommendations based on risk level
  if (riskLevel === 'high') {
    recommendations.push('🏥 **URGENT**: Schedule cardiology consultation within 1-2 weeks');
    recommendations.push('🔬 Request comprehensive cardiac evaluation: ECG, stress test, lipid profile');
    recommendations.push('💊 Discuss preventive medications with your doctor (aspirin, statins if needed)');
  } else if (riskLevel === 'medium') {
    recommendations.push('🩺 Schedule appointment with primary care physician within 1 month');
    recommendations.push('📊 Get annual comprehensive health screening');
    recommendations.push('🔍 Consider cardiac risk assessment every 6 months');
  } else {
    recommendations.push('✅ Maintain current healthy practices');
    recommendations.push('📅 Continue regular annual health check-ups');
  }
  
  // Ayurvedic and Traditional Medicine
  recommendations.push('🌿 **Ayurvedic Heart Support**:');
  recommendations.push('   • Arjuna bark powder: 500mg twice daily with warm water');
  recommendations.push('   • Fresh garlic: 2-3 cloves daily or garlic tablets');
  recommendations.push('   • Turmeric with black pepper: Golden milk before bed');
  recommendations.push('   • Amla (Indian gooseberry) juice: 30ml in the morning');
  
  // Yoga and Exercise
  recommendations.push('🧘 **Daily Yoga Practice** (30-45 minutes):');
  recommendations.push('   • Pranayama: Anulom Vilom, Kapalbhati, Ujjayi breathing');
  recommendations.push('   • Asanas: Vajrasana, Shavasana, Bhujangasana, Tadasana');
  recommendations.push('   • Meditation: 15-20 minutes for stress reduction');
  
  // Diet based on preference
  if (data.dietType === 'vegetarian') {
    recommendations.push('🥗 **Heart-Healthy Vegetarian Diet**:');
    recommendations.push('   • Include: Lentils, quinoa, nuts, leafy greens, whole grains');
    recommendations.push('   • Omega-3 sources: Walnuts, flaxseeds, chia seeds');
    recommendations.push('   • Consider: B12, Iron, and Omega-3 supplements (consult doctor)');
  } else if (data.dietType === 'vegan') {
    recommendations.push('🌱 **Heart-Healthy Vegan Approach**:');
    recommendations.push('   • Protein: Legumes, tofu, tempeh, quinoa, hemp seeds');
    recommendations.push('   • Essential supplements: B12, D3, Omega-3 (algae-based), Iron');
    recommendations.push('   • Focus: Colorful vegetables, berries, nuts, whole grains');
  } else {
    recommendations.push('🐟 **Balanced Heart-Healthy Diet**:');
    recommendations.push('   • Include: Fatty fish 2-3 times/week (salmon, mackerel)');
    recommendations.push('   • Limit: Red meat and processed meats');
    recommendations.push('   • Increase: Plant-based meals to 60-70% of diet');
  }
  
  // Home Remedies
  recommendations.push('🏠 **Traditional Home Remedies**:');
  recommendations.push('   • Morning: Warm lemon water with honey');
  recommendations.push('   • Daily: 2-3 cups green tea');
  recommendations.push('   • Snack: Handful of soaked almonds');
  recommendations.push('   • Cooking: Use garlic, ginger, turmeric regularly');
  
  // Specific risk factor management
  if (data.smoking) {
    recommendations.push('🚭 **Smoking Cessation** (Most Critical):');
    recommendations.push('   • Quit immediately - most important change you can make');
    recommendations.push('   • Try: Nicotine replacement therapy, counseling');
    recommendations.push('   • Support: Join smoking cessation programs');
  }
  
  if (data.diabetes) {
    recommendations.push('🩸 **Diabetes Management**:');
    recommendations.push('   • Monitor blood sugar levels regularly');
    recommendations.push('   • Follow prescribed medication regimen strictly');
    recommendations.push('   • Diet: Low glycemic index foods, portion control');
  }
  
  if (data.stressLevel >= 7) {
    recommendations.push('🧘 **Stress Management Priority**:');
    recommendations.push('   • Daily: Deep breathing exercises (5-10 minutes, 3 times)');
    recommendations.push('   • Try: Progressive muscle relaxation');
    recommendations.push('   • Consider: Professional counseling or therapy');
    recommendations.push('   • Maintain: Work-life balance');
  }
  
  if (data.sleepHours < 7 || data.sleepHours > 8) {
    recommendations.push('😴 **Sleep Optimization**:');
    recommendations.push('   • Target: 7-8 hours of quality sleep nightly');
    recommendations.push('   • Routine: Consistent sleep and wake times');
    recommendations.push('   • Evening: Avoid screens 1 hour before bed');
    recommendations.push('   • Natural aids: Chamomile tea, warm milk with turmeric');
  }
  
  // Emergency awareness
  recommendations.push('🚨 **Heart Attack Warning Signs - Know Them**:');
  recommendations.push('   • Chest pain, pressure, tightness, or discomfort');
  recommendations.push('   • Shortness of breath, nausea, cold sweats');
  recommendations.push('   • Pain in arms, neck, jaw, back, or upper abdomen');
  recommendations.push('   • **Emergency**: Call 108 (India) or local emergency number immediately');
  
  // Lifestyle
  recommendations.push('💪 **Daily Lifestyle Habits**:');
  recommendations.push('   • Walk: 30-45 minutes daily (or equivalent exercise)');
  recommendations.push('   • Hydration: 8-10 glasses of water daily');
  recommendations.push('   • Social: Maintain strong family and community connections');
  recommendations.push('   • Mindfulness: Practice gratitude and positive thinking');
  
  return recommendations;
}
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
  
  return recommendations;
}
