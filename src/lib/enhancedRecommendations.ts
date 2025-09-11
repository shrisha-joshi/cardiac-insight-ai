import { PatientData } from './mockData';

export function generateEnhancedRecommendations(patientData: PatientData, riskLevel: string, riskFactors: string[]): string[] {
  const recommendations: string[] = [];

  // Medical recommendations
  if (riskLevel === 'High') {
    recommendations.push('🏥 **URGENT**: Consult a cardiologist within 1-2 weeks for comprehensive evaluation');
    recommendations.push('📋 Schedule immediate ECG, stress test, and lipid profile');
  } else if (riskLevel === 'Medium') {
    recommendations.push('🩺 Schedule appointment with your primary care physician within 1 month');
    recommendations.push('📊 Get annual cardiac screening and blood work');
  } else {
    recommendations.push('✅ Continue regular health check-ups every 6-12 months');
    recommendations.push('📈 Monitor your health parameters regularly');
  }

  // Diet recommendations based on Indian context
  if (patientData.dietType === 'vegetarian') {
    recommendations.push('🥗 **Vegetarian Heart-Healthy Diet**: Include more lentils, quinoa, nuts, and green vegetables');
    recommendations.push('🌿 Add heart-protective foods: turmeric, garlic, ginger, and green tea');
    recommendations.push('💊 Consider B12 and Iron supplements (consult doctor)');
    recommendations.push('🥜 Include omega-3 rich foods: walnuts, flaxseeds, chia seeds');
  } else if (patientData.dietType === 'vegan') {
    recommendations.push('🌱 **Vegan Heart Care**: Ensure adequate protein from legumes, tofu, and quinoa');
    recommendations.push('💊 Essential supplements: B12, D3, Omega-3 (algae-based), Iron');
    recommendations.push('🥗 Focus on colorful vegetables, berries, and whole grains');
  } else {
    recommendations.push('🐟 Include fatty fish 2-3 times per week (salmon, mackerel, sardines)');
    recommendations.push('🥩 Limit red meat and processed meats');
    recommendations.push('🥗 Increase plant-based meals to 60-70% of your diet');
  }

  // Ayurvedic recommendations
  recommendations.push('🌿 **Ayurvedic Herbs for Heart Health**:');
  recommendations.push('   • Arjuna bark powder (500mg twice daily with warm water)');
  recommendations.push('   • Garlic tablets or 2-3 raw cloves daily');
  recommendations.push('   • Turmeric with black pepper (Golden milk before bed)');
  recommendations.push('   • Amla (Indian gooseberry) juice in morning');
  
  // Yoga and Exercise recommendations
  recommendations.push('🧘 **Yoga for Heart Health** (30 mins daily):');
  recommendations.push('   • Pranayama: Anulom Vilom, Bhramari, and Ujjayi breathing');
  recommendations.push('   • Asanas: Vajrasana, Shavasana, Bhujangasana, Tadasana');
  recommendations.push('   • Meditation: 10-15 minutes daily for stress reduction');
  
  if (patientData.physicalActivity === 'low') {
    recommendations.push('🚶 Start with 20-30 minutes brisk walking daily');
    recommendations.push('🏃 Gradually increase to 150 minutes moderate exercise per week');
  } else if (patientData.physicalActivity === 'moderate') {
    recommendations.push('💪 Add strength training 2-3 times per week');
    recommendations.push('🏊 Include variety: swimming, cycling, dancing');
  }

  // Home remedies and lifestyle
  recommendations.push('🏠 **Home Remedies**:');
  recommendations.push('   • Drink warm lemon water with honey (morning)');
  recommendations.push('   • Green tea 2-3 cups daily');
  recommendations.push('   • Handful of soaked almonds daily');
  recommendations.push('   • Reduce salt intake to less than 5g per day');

  // Stress management
  if (patientData.stressLevel >= 7) {
    recommendations.push('🧘 **Stress Management Priority**:');
    recommendations.push('   • Practice deep breathing exercises 3 times daily');
    recommendations.push('   • Try progressive muscle relaxation');
    recommendations.push('   • Consider counseling or therapy');
    recommendations.push('   • Maintain work-life balance');
  }

  // Sleep optimization
  if (patientData.sleepHours < 7 || patientData.sleepHours > 8) {
    recommendations.push('😴 **Sleep Hygiene**:');
    recommendations.push('   • Aim for 7-8 hours of quality sleep');
    recommendations.push('   • Maintain consistent sleep schedule');
    recommendations.push('   • Avoid screens 1 hour before bed');
    recommendations.push('   • Try chamomile tea or warm milk before sleep');
  }

  // Specific risk factor management
  if (patientData.diabetes) {
    recommendations.push('🩸 **Diabetes Management**:');
    recommendations.push('   • Monitor blood sugar levels regularly');
    recommendations.push('   • Follow diabetic diet plan strictly');
    recommendations.push('   • Take medications as prescribed');
  }

  if (patientData.smoking) {
    recommendations.push('🚭 **Smoking Cessation** (Most Important):');
    recommendations.push('   • Quit smoking immediately - single most important change');
    recommendations.push('   • Consider nicotine replacement therapy');
    recommendations.push('   • Join smoking cessation programs');
  }

  // Emergency awareness
  recommendations.push('🚨 **Know Heart Attack Warning Signs**:');
  recommendations.push('   • Chest pain, pressure, or discomfort');
  recommendations.push('   • Shortness of breath, nausea, sweating');
  recommendations.push('   • Pain in arms, neck, jaw, or back');
  recommendations.push('   • Call 108 (India Emergency) immediately if symptoms occur');

  return recommendations;
}

export function generateEnhancedExplanation(
  riskPercentage: number,
  riskLevel: string,
  riskFactors: string[],
  protectiveFactors: string[],
  patientData: PatientData
): string {
  let explanation = '';

  // Reassuring introduction
  explanation += `## 💗 Your Heart Health Assessment Results\n\n`;
  
  if (riskLevel === 'Low') {
    explanation += `**Great news!** Your current heart attack risk is **${riskLevel.toLowerCase()} (${riskPercentage.toFixed(1)}%)**. This means you have a strong foundation for heart health. `;
  } else if (riskLevel === 'Medium') {
    explanation += `Your heart attack risk is currently **${riskLevel.toLowerCase()} (${riskPercentage.toFixed(1)}%)**. While this isn't immediately concerning, there are excellent opportunities to improve your heart health. `;
  } else {
    explanation += `Your assessment shows a **${riskLevel.toLowerCase()} risk (${riskPercentage.toFixed(1)}%)** for heart attack. Don't panic - this assessment is a tool to help you take proactive steps for better heart health. `;
  }

  explanation += `Remember, this is a prediction tool to guide preventive care, not a diagnosis.\n\n`;

  // Risk factors explanation
  if (riskFactors.length > 0) {
    explanation += `### ⚠️ Areas for Improvement:\n`;
    riskFactors.slice(0, 5).forEach((factor, index) => {
      explanation += `${index + 1}. ${factor}\n`;
    });
    explanation += `\n`;
  }

  // Protective factors
  if (protectiveFactors.length > 0) {
    explanation += `### ✅ Your Heart-Healthy Strengths:\n`;
    protectiveFactors.forEach((factor, index) => {
      explanation += `${index + 1}. ${factor}\n`;
    });
    explanation += `\n`;
  }

  // Personalized insights
  explanation += `### 🎯 Personalized Insights:\n`;
  
  if (patientData.age >= 60) {
    explanation += `• Age is a non-modifiable risk factor, but healthy lifestyle choices can significantly reduce your risk\n`;
  }
  
  if (patientData.dietType === 'vegetarian') {
    explanation += `• Your vegetarian diet provides natural cardiovascular protection through plant compounds\n`;
  }
  
  if (patientData.physicalActivity === 'high') {
    explanation += `• Your high activity level is excellent for heart health - keep it up!\n`;
  }
  
  if (patientData.stressLevel <= 5) {
    explanation += `• Your managed stress levels contribute positively to heart health\n`;
  }

  // Conclusion with reassurance
  explanation += `\n### 🌟 Moving Forward:\n`;
  explanation += `Heart disease is largely preventable through lifestyle modifications. The recommendations provided integrate modern medicine with traditional Indian approaches including Ayurveda and yoga. `;
  explanation += `Small, consistent changes in diet, exercise, stress management, and sleep can dramatically improve your heart health over time.\n\n`;
  explanation += `**Remember**: This assessment empowers you with knowledge to make informed decisions about your health. Always consult healthcare professionals for medical advice and treatment decisions.`;

  return explanation;
}