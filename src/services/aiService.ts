import { PatientData, PredictionResult } from '@/lib/mockData';

interface AIResponse {
  content: string;
  data?: Record<string, unknown>;
}

class AIService {
  // Fallback AI service that uses rule-based responses
  async getChatResponse(message: string, context?: Record<string, unknown>): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    
    // Medical emergency detection
    if (this.isEmergencyMessage(message)) {
      return {
        content: `🚨 **MEDICAL EMERGENCY WARNING** 🚨

If you are experiencing chest pain, shortness of breath, or other heart attack symptoms, **CALL EMERGENCY SERVICES IMMEDIATELY** (911 in US, 999 in UK, 112 in EU).

**⚠️ IMPORTANT MEDICAL DISCLAIMER:** This AI assistant is for educational purposes only and cannot replace professional medical care. Always consult with qualified healthcare professionals for medical advice, diagnosis, or treatment.

Common heart attack warning signs:
• Chest pain or pressure
• Shortness of breath  
• Pain in arms, back, neck, jaw
• Nausea or cold sweats
• Unusual fatigue (especially in women)

Would you like general information about heart health prevention instead?`
      };
    }

    // Risk assessment questions
    if (lowerMessage.includes('risk') || lowerMessage.includes('assessment') || lowerMessage.includes('heart attack')) {
      return {
        content: `I can help you understand heart attack risk factors based on medical research:

**Major Risk Factors:**
• Age (men >45, women >55)
• High blood pressure (>140/90)
• High cholesterol (LDL >160 mg/dL)
• Smoking or tobacco use
• Diabetes mellitus
• Family history of heart disease
• Obesity (BMI >30)

**Lifestyle Risk Factors:**
• Physical inactivity
• Poor diet (high saturated fat/sodium)
• Excessive alcohol consumption
• Chronic stress
• Sleep disorders

**⚠️ MEDICAL DISCLAIMER:** This information is for educational purposes only. For personalized risk assessment and medical advice, please consult with your healthcare provider or cardiologist.

Would you like me to help you schedule a proper medical assessment or provide lifestyle recommendations?`
      };
    }

    // Symptom inquiry handling
    if (lowerMessage.includes('symptom') || lowerMessage.includes('chest pain') || lowerMessage.includes('shortness of breath') || lowerMessage.includes('heart attack')) {
      return {
        content: `🚨 **URGENT - SEEK IMMEDIATE MEDICAL ATTENTION** 🚨

If you're experiencing ANY of these symptoms, call emergency services NOW:
• Chest pain, pressure, or discomfort
• Shortness of breath
• Pain radiating to arms, neck, jaw, or back
• Nausea, sweating, or dizziness
• Unusual fatigue

**⚠️ CRITICAL MEDICAL DISCLAIMER:** 
- This AI cannot diagnose medical conditions
- Never delay emergency care to use this chat
- Time is critical in heart attacks - every minute matters
- When in doubt, always seek immediate professional medical help

**Emergency Numbers:**
• US: 911
• UK: 999  
• EU: 112
• Canada: 911
• Australia: 000

Are you currently experiencing any of these symptoms? If yes, please contact emergency services immediately.`
      };
    }

    // Medical history analysis
    if (lowerMessage.includes('history') || lowerMessage.includes('previous') || lowerMessage.includes('past')) {
      if (context?.user) {
        return {
          content: `I can help analyze your medical history for heart health patterns. However, **please note this important medical disclaimer:**

**⚠️ MEDICAL DISCLAIMER:** 
- This analysis is for educational purposes only
- It cannot replace professional medical interpretation
- Always consult your healthcare provider for medical decisions
- Bring these results to your doctor for proper evaluation

Based on your assessment history, I can provide insights about:
• Risk trend analysis over time
• Lifestyle factor correlations
• Areas that may need medical attention
• Questions to discuss with your healthcare provider

**Remember:** Only qualified healthcare professionals can provide medical diagnosis, treatment recommendations, or modify your care plan.

Would you like me to review your assessment history with these limitations in mind?`
        };
      } else {
        return {
          content: `To access your medical history, please log in to your account. 

**⚠️ MEDICAL DISCLAIMER:** Any historical analysis I provide is for educational purposes only and cannot replace professional medical evaluation by qualified healthcare providers.

I can still provide general heart health information if you prefer.`
        };
      }
    }

    // Lifestyle and prevention advice
    if (lowerMessage.includes('prevent') || lowerMessage.includes('improve') || lowerMessage.includes('lifestyle') || lowerMessage.includes('diet') || lowerMessage.includes('exercise')) {
      return {
        content: `Here are evidence-based heart health recommendations:

**🍎 Dietary Guidelines:**
• Mediterranean-style diet (fruits, vegetables, whole grains, olive oil)
• Limit saturated fats (<7% of daily calories)
• Reduce sodium intake (<2,300mg daily)
• Include omega-3 fatty acids (fish, nuts, seeds)
• Limit processed foods and added sugars

**🏃 Exercise Recommendations:**
• 150 minutes moderate aerobic activity weekly
• 2+ days of strength training per week
• Start gradually if sedentary
• Include activities you enjoy for sustainability

**🚭 Lifestyle Modifications:**
• Quit smoking/tobacco use completely
• Limit alcohol (1 drink/day women, 2/day men)
• Manage stress through relaxation techniques
• Maintain healthy sleep (7-9 hours nightly)
• Regular blood pressure and cholesterol monitoring

**⚠️ IMPORTANT MEDICAL DISCLAIMER:** 
These are general guidelines based on medical research. Before starting any new exercise program or making significant dietary changes, especially if you have existing health conditions, please consult with your healthcare provider or a qualified nutritionist.

**Always seek professional medical advice for:**
- Personalized diet plans
- Exercise programs if you have health conditions
- Medication interactions with lifestyle changes
- Specific health goals and targets

Would you like more specific information about any of these areas?`
      };
    }

    // Medication and treatment questions
    if (lowerMessage.includes('medication') || lowerMessage.includes('treatment') || lowerMessage.includes('doctor') || lowerMessage.includes('prescription')) {
      return {
        content: `**⚠️ IMPORTANT MEDICAL DISCLAIMER:**

I **cannot** and **must not** provide advice about:
• Specific medications or dosages
• Treatment plans or protocols  
• Diagnosis of medical conditions
• Changing or stopping medications
• Medical procedures or interventions

**🏥 FOR MEDICAL ADVICE, PLEASE CONSULT:**
• Your primary care physician
• Cardiologist or heart specialist
• Pharmacist (for medication questions)
• Emergency services (for urgent concerns)

**What I CAN provide:**
• General heart health education
• Lifestyle modification information
• Questions you might ask your doctor
• General information about heart conditions

**Questions to discuss with your healthcare provider:**
• "What are my specific risk factors?"
• "How often should I have checkups?"
• "What lifestyle changes do you recommend?"
• "Are there warning signs I should watch for?"

**Remember:** Healthcare professionals have access to your complete medical history, current medications, and can provide personalized care that I cannot.

Is there general heart health information I can help you understand instead?`
      };
    }

    // Lab values and medical data interpretation
    if (lowerMessage.includes('cholesterol') || lowerMessage.includes('blood pressure') || lowerMessage.includes('numbers') || lowerMessage.includes('results')) {
      return {
        content: `I can provide general reference ranges for common heart health measurements:

**📊 Blood Pressure (mmHg):**
• Normal: <120/80
• Elevated: 120-129/<80
• Stage 1 High: 130-139/80-89
• Stage 2 High: ≥140/90

**📊 Cholesterol (mg/dL):**
• Total Cholesterol: <200 (desirable)
• LDL ("bad"): <100 (optimal), <70 (very high risk patients)
• HDL ("good"): >40 (men), >50 (women)
• Triglycerides: <150

**📊 Other Key Metrics:**
• Resting Heart Rate: 60-100 bpm
• BMI: 18.5-24.9 (normal range)
• Blood Glucose: 70-99 mg/dL (fasting)

**⚠️ CRITICAL MEDICAL DISCLAIMER:**

These are **general reference ranges only**. Your specific target values may be different based on:
• Your individual health conditions
• Current medications
• Overall risk factors
• Age and gender
• Medical history

**NEVER interpret your own lab results without professional guidance.**

**🏥 ALWAYS consult your healthcare provider to:**
• Interpret your specific results
• Understand what your targets should be
• Discuss any concerning values
• Create appropriate treatment plans
• Monitor changes over time

Your doctor can explain what your numbers mean in the context of your overall health.

Would you like general information about maintaining healthy levels through lifestyle?`
      };
    }

    // Default response with comprehensive disclaimers
    return {
      content: `👋 Hello! I'm your AI Health Assistant focused on heart health education.

**What I can help with:**
• General heart health information and education
• Lifestyle recommendations for heart disease prevention  
• Understanding common risk factors
• Questions to discuss with your healthcare provider
• Reviewing your assessment history trends

**⚠️ IMPORTANT MEDICAL DISCLAIMERS:**

**I CANNOT:**
• Diagnose medical conditions
• Provide medical advice or treatment recommendations
• Interpret lab results or medical tests
• Recommend medications or dosage changes
• Replace consultation with healthcare professionals

**I AM NOT A SUBSTITUTE FOR:**
• Medical diagnosis by qualified physicians
• Emergency medical services
• Professional medical treatment
• Prescription medication management
• Clinical medical care

**🚨 FOR MEDICAL EMERGENCIES:**
If experiencing chest pain, shortness of breath, or other concerning symptoms, **immediately contact emergency services** (911, 999, 112) or go to the nearest emergency room.

**📋 ALWAYS CONSULT HEALTHCARE PROVIDERS FOR:**
• Medical advice, diagnosis, and treatment
• Medication questions and changes  
• Personalized health recommendations
• Interpretation of medical tests
• Ongoing medical care and monitoring

**Legal Note:** This service is for educational purposes only. No doctor-patient relationship is established through this interaction.

How can I help you learn about heart health today?`
    };
  }

  private isEmergencyMessage(message: string): boolean {
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'can\'t breathe', 'shortness of breath',
      'crushing pain', 'left arm pain', 'emergency', '911', 'help me',
      'having symptoms', 'chest pressure', 'chest tightness', 'difficulty breathing',
      'severe pain', 'heart racing', 'cardiac arrest', 'angina'
    ];
    
    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  async generateHealthInsight(patientData: PatientData, predictionResult: PredictionResult): Promise<string> {
    const riskLevel = predictionResult.riskLevel;
    const riskScore = predictionResult.riskScore;
    
    let insight = `**⚠️ MEDICAL DISCLAIMER: This analysis is for educational purposes only. Always consult healthcare professionals for medical advice, diagnosis, or treatment decisions.**\n\n`;
    
    insight += `**Heart Health Assessment Summary:**\n`;
    insight += `• Risk Level: ${riskLevel}\n`;
    insight += `• Risk Score: ${riskScore.toFixed(1)}%\n\n`;
    
    // Add specific insights based on risk level
    if (riskLevel === 'high') {
      insight += `**🚨 Important:** Your assessment indicates elevated cardiovascular risk factors. This is **NOT a medical diagnosis** but suggests you should:\n\n`;
      insight += `**IMMEDIATE NEXT STEPS:**\n`;
      insight += `• **Schedule an appointment with a healthcare provider soon**\n`;
      insight += `• Discuss these results with a cardiologist\n`;
      insight += `• Do not ignore symptoms like chest pain or shortness of breath\n\n`;
    } else if (riskLevel === 'medium') {
      insight += `**⚠️ Notice:** Your assessment shows moderate risk factors that warrant attention. **This is not a diagnosis** but suggests:\n\n`;
      insight += `**RECOMMENDED ACTIONS:**\n`;
      insight += `• **Consult with your primary care physician** about these results\n`;
      insight += `• Consider preventive lifestyle modifications\n`;
      insight += `• Regular monitoring of key health metrics\n\n`;
    } else {
      insight += `**✅ Encouraging:** Your assessment shows relatively lower cardiovascular risk factors. However:\n\n`;
      insight += `**CONTINUE PREVENTION:**\n`;
      insight += `• Maintain current healthy lifestyle choices\n`;
      insight += `• **Regular check-ups remain important**\n`;
      insight += `• Stay vigilant about emerging risk factors\n\n`;
    }
    
    insight += `**🏥 CRITICAL REMINDER:**\n`;
    insight += `• This tool does NOT replace professional medical evaluation\n`;
    insight += `• Bring these results to your healthcare provider for proper interpretation\n`;
    insight += `• Individual risk factors require professional assessment\n`;
    insight += `• Emergency symptoms require immediate medical attention\n\n`;
    
    insight += `**Questions to discuss with your healthcare provider:**\n`;
    insight += `• "What do these risk factors mean for my specific situation?"\n`;
    insight += `• "What preventive measures do you recommend for me?"\n`;
    insight += `• "How often should I be monitored for cardiovascular health?"\n`;
    insight += `• "Are there any additional tests I should consider?"\n`;
    
    return insight;
  }
}

export const aiService = new AIService();