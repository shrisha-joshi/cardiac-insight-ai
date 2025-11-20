import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '@/lib/config';
import { PatientData, PredictionResult } from '@/lib/mockData';

// Import ULTIMATE accuracy services
import { ultimateAccuracyMLService } from './ultimateAccuracyMLService';
import { dynamicRecommendationEngine } from './dynamicRecommendationEngine';
import { comprehensiveInputUtilization } from './comprehensiveInputUtilization';

// Phase 5: Additional services pending implementation
// - lifestyleAnalytics (module resolution issue)

// - lifestyleAnalytics (partially implemented)
// - medicationInteractions
// - familyRiskClustering
// - biomarkerIntegration
// - imagingAnalysis
// - ecgAnalysis
// - predictiveAnalytics

// Legacy interfaces for backwards compatibility
interface AIResponse {
  content: string;
  data?: Record<string, unknown>;
  suggestions?: string[];
}

interface ConversationContext {
  previousQuestions: string[];
  userProfile?: {
    age?: number;
    conditions?: string[];
    interests?: string[];
  };
  currentTopic?: string;
}

// New interfaces for enhanced AI
export interface EnhancedAIRequest {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  patientData: {
    age: number;
    gender: string;
    medicalHistory: string[];
    currentConditions: string[];
    lifestyle: string[];
  };
  requestType: 'medicines' | 'ayurveda' | 'yoga' | 'diet' | 'comprehensive';
}

export interface EnhancedAIResponse {
  suggestions: {
    medicines?: string[];
    ayurveda?: string[];
    yoga?: string[];
    diet?: string[];
    lifestyle?: string[];
  };
  warnings: string[];
  disclaimer: string;
  source: 'gemini' | 'openai' | 'fallback';
}

interface ComprehensiveRiskAssessment {
  patientId: string;
  timestamp: Date;
  riskScores: {
    predictiveAnalytics: number;
    biomarkers: number;
    imaging: number;
    ecg: number;
    familyHistory: number;
    lifestyle: number;
  };
  overallRiskScore: number;
  riskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  keyFindings: string[];
  urgentConcerns: string[];
  recommendations: string[];
  clinicalReport: string;
}

class EnhancedAIService {
  private readonly conversationHistory: Map<string, ConversationContext> = new Map();
  private gemini: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private readonly comprehensiveAssessments: Map<string, ComprehensiveRiskAssessment[]> = new Map();

  constructor() {
    // Initialize Google Gemini
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey) {
      // Validate API key format (should start with valid prefix)
      if (this.isValidGeminiKey(config.ai.gemini.apiKey)) {
        this.gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey);
        if (import.meta.env.DEV) console.log('[AI Service] ✅ Gemini initialized successfully');
      } else {
        if (import.meta.env.DEV) console.warn('[AI Service] ⚠️ Invalid Gemini API key format. Please check VITE_GOOGLE_GEMINI_API_KEY in .env file.');
      }
    } else {
      if (import.meta.env.DEV) console.log('[AI Service] Gemini disabled or no API key configured');
    }

    // Initialize OpenAI
    if (config.ai.openai.enabled && config.ai.openai.apiKey) {
      // Validate API key format (should start with 'sk-')
      if (this.isValidOpenAIKey(config.ai.openai.apiKey)) {
        this.openai = new OpenAI({
          apiKey: config.ai.openai.apiKey,
          dangerouslyAllowBrowser: true // Note: In production, calls should go through a backend
        });
        if (import.meta.env.DEV) console.log('[AI Service] ✅ OpenAI initialized successfully');
      } else {
        if (import.meta.env.DEV) console.warn('[AI Service] ⚠️ Invalid OpenAI API key format. Please check VITE_OPENAI_API_KEY in .env file.');
      }
    } else {
      if (import.meta.env.DEV) console.log('[AI Service] OpenAI disabled or no API key configured');
    }

    // Log available providers
    if (import.meta.env.DEV) {
      const providers = this.getAvailableProviders();
      console.log(`[AI Service] Available providers: ${providers.join(', ')}`);
    }
  }

  private isValidGeminiKey(key: string): boolean {
    // Gemini keys typically start with 'AIzaSy' and are ~39 characters
    return key.startsWith('AIzaSy') && key.length >= 30 && !key.includes('your_');
  }

  private isValidOpenAIKey(key: string): boolean {
    // OpenAI keys start with 'sk-' and are ~48+ characters
    return key.startsWith('sk-') && key.length >= 40 && !key.includes('your_');
  }

  /**
   * Comprehensive Risk Assessment using all Phase 5 services
   */
  async generateComprehensiveAssessment(patientId: string, patientData: unknown): Promise<ComprehensiveRiskAssessment> {
    const assessment: ComprehensiveRiskAssessment = {
      patientId,
      timestamp: new Date(),
      riskScores: {
        predictiveAnalytics: 0,
        biomarkers: 0,
        imaging: 0,
        ecg: 0,
        familyHistory: 0,
        lifestyle: 0
      },
      overallRiskScore: 0,
      riskCategory: 'very-low',
      keyFindings: [],
      urgentConcerns: [],
      recommendations: [],
      clinicalReport: ''
    };

    // ML model predictions (Phase 5: awaiting predictiveAnalyticsService implementation)
    try {
      assessment.riskScores.predictiveAnalytics = 0;
      assessment.keyFindings.push(`ML Ensemble Risk Score: Ready for integration`);
    } catch (e) {
      if (import.meta.env.DEV) console.log('ML prediction unavailable');
    }

    // Biomarker analysis (Phase 5: awaiting biomarkerIntegrationService implementation)
    try {
      assessment.riskScores.biomarkers = 0;
    } catch (e) {
      if (import.meta.env.DEV) console.log('Biomarker profile unavailable');
    }

    // Imaging findings (Phase 5: awaiting imagingAnalysisService implementation)
    try {
      assessment.riskScores.imaging = 0;
    } catch (e) {
      if (import.meta.env.DEV) console.log('Imaging profile unavailable');
    }

    // ECG analysis (Phase 5: awaiting ecgAnalysisService implementation)
    try {
      assessment.riskScores.ecg = 0;
    } catch (e) {
      if (import.meta.env.DEV) console.log('ECG profile unavailable');
    }

    // Family history risk clustering (Phase 5: awaiting familyRiskClusteringService implementation)
    try {
      assessment.riskScores.familyHistory = 0;
    } catch (e) {
      if (import.meta.env.DEV) console.log('Family risk clustering unavailable');
    }

    // Lifestyle factor analysis (Phase 5: awaiting lifestyleAnalyticsService implementation)
    try {
      assessment.riskScores.lifestyle = 0;
    } catch (e) {
      if (import.meta.env.DEV) console.log('Lifestyle analysis unavailable');
    }

    // Calculate overall risk score (weighted average)
    const weights = {
      predictiveAnalytics: 0.30,
      biomarkers: 0.25,
      imaging: 0.20,
      ecg: 0.15,
      familyHistory: 0.05,
      lifestyle: 0.05
    };

    assessment.overallRiskScore =
      assessment.riskScores.predictiveAnalytics * weights.predictiveAnalytics +
      assessment.riskScores.biomarkers * weights.biomarkers +
      assessment.riskScores.imaging * weights.imaging +
      assessment.riskScores.ecg * weights.ecg +
      assessment.riskScores.familyHistory * weights.familyHistory +
      assessment.riskScores.lifestyle * weights.lifestyle;

    // Categorize risk
    if (assessment.overallRiskScore < 10) assessment.riskCategory = 'very-low';
    else if (assessment.overallRiskScore < 20) assessment.riskCategory = 'low';
    else if (assessment.overallRiskScore < 35) assessment.riskCategory = 'moderate';
    else if (assessment.overallRiskScore < 60) assessment.riskCategory = 'high';
    else assessment.riskCategory = 'very-high';

    // Generate recommendations
    assessment.recommendations = this.generateIntegratedRecommendations(assessment);

    // Generate comprehensive report
    assessment.clinicalReport = this.generateIntegratedReport(assessment);

    // Store assessment
    const assessments = this.comprehensiveAssessments.get(patientId) || [];
    assessments.push(assessment);
    this.comprehensiveAssessments.set(patientId, assessments);

    return assessment;
  }

  /**
   * Generate integrated recommendations from all services
   */
  private generateIntegratedRecommendations(assessment: ComprehensiveRiskAssessment): string[] {
    const recommendations: string[] = [];

    if (assessment.urgentConcerns.length > 0) {
      recommendations.push('🚨 URGENT: Critical findings requiring immediate specialist evaluation');
      assessment.urgentConcerns.forEach(concern => {
        recommendations.push(`  - ${concern}`);
      });
    }

    // Medications
    if (assessment.riskScores.biomarkers > 50 || assessment.riskScores.predictiveAnalytics > 50) {
      recommendations.push('Consider lipid-lowering therapy (statin +/- ezetimibe)');
      recommendations.push('Consider blood pressure management medication');
    }

    // Lifestyle
    if (assessment.riskScores.lifestyle > 40) {
      recommendations.push('High-priority lifestyle modifications needed');
      recommendations.push('Consult nutritionist for heart-healthy diet');
      recommendations.push('Engage in cardiac rehabilitation or exercise program');
    }

    // Imaging
    if (assessment.riskScores.imaging > 30) {
      recommendations.push('Advanced cardiac imaging recommended (echo, CTA, or angiography)');
    }

    // Family counseling
    if (assessment.riskScores.familyHistory > 50) {
      recommendations.push('Genetic counseling recommended');
      recommendations.push('Cascade screening of family members');
    }

    // Follow-up
    if (assessment.riskCategory === 'very-high') {
      recommendations.push('Schedule cardiology appointment within 1 week');
      recommendations.push('Consider hospitalization for advanced testing');
    } else if (assessment.riskCategory === 'high') {
      recommendations.push('Schedule cardiology appointment within 2 weeks');
      recommendations.push('Comprehensive cardiac testing recommended');
    } else if (assessment.riskCategory === 'moderate') {
      recommendations.push('Schedule cardiology appointment within 4-6 weeks');
      recommendations.push('Optimize risk factors');
    }

    return recommendations;
  }

  /**
   * Generate integrated clinical report
   */
  private generateIntegratedReport(assessment: ComprehensiveRiskAssessment): string {
    let report = `# Comprehensive Cardiovascular Risk Assessment Report\n\n`;
    report += `**Patient ID:** ${assessment.patientId}\n`;
    report += `**Assessment Date:** ${assessment.timestamp.toLocaleString()}\n\n`;

    report += `## Overall Risk Profile\n`;
    report += `- **Overall Risk Score:** ${assessment.overallRiskScore.toFixed(1)}/100\n`;
    report += `- **Risk Category:** ${assessment.riskCategory.toUpperCase()}\n\n`;

    report += `## Component Risk Scores\n`;
    report += `- **Predictive Analytics (ML Models):** ${assessment.riskScores.predictiveAnalytics.toFixed(1)}/100 (Weight: 30%)\n`;
    report += `- **Biomarker Analysis:** ${assessment.riskScores.biomarkers.toFixed(1)}/100 (Weight: 25%)\n`;
    report += `- **Cardiac Imaging:** ${assessment.riskScores.imaging.toFixed(1)}/100 (Weight: 20%)\n`;
    report += `- **ECG Analysis:** ${assessment.riskScores.ecg.toFixed(1)}/100 (Weight: 15%)\n`;
    report += `- **Family History:** ${assessment.riskScores.familyHistory.toFixed(1)}/100 (Weight: 5%)\n`;
    report += `- **Lifestyle Factors:** ${assessment.riskScores.lifestyle.toFixed(1)}/100 (Weight: 5%)\n\n`;

    report += `## Key Findings\n`;
    assessment.keyFindings.forEach((finding, i) => {
      report += `${i + 1}. ${finding}\n`;
    });

    if (assessment.urgentConcerns.length > 0) {
      report += `\n## ⚠️ Urgent Concerns\n`;
      assessment.urgentConcerns.forEach((concern, i) => {
        report += `${i + 1}. **${concern}** - Requires immediate specialist evaluation\n`;
      });
    }

    report += `\n## Clinical Recommendations\n`;
    assessment.recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });

    report += `\n## Medical Disclaimer\n`;
    report += `This assessment is based on available patient data and automated analysis. `;
    report += `It should not replace professional medical evaluation by qualified healthcare providers. `;
    report += `All recommendations should be reviewed and confirmed by the patient's cardiologist or primary care physician.\n`;

    return report;
  }

  /**
   * Get comprehensive assessment
   */
  getComprehensiveAssessment(patientId: string): ComprehensiveRiskAssessment | null {
    const assessments = this.comprehensiveAssessments.get(patientId);
    return assessments ? assessments[assessments.length - 1] : null;
  }

  /**
   * Get all assessments for patient
   */
  getAllAssessments(patientId: string): ComprehensiveRiskAssessment[] {
    return this.comprehensiveAssessments.get(patientId) || [];
  }

  async getChatResponse(message: string, userId: string = 'anonymous', context?: Record<string, unknown>): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    const userContext = this.conversationHistory.get(userId) || { previousQuestions: [] };
    
    // Update conversation context
    userContext.previousQuestions.push(message);
    if (userContext.previousQuestions.length > 10) {
      userContext.previousQuestions = userContext.previousQuestions.slice(-10);
    }
    this.conversationHistory.set(userId, userContext);

    // Emergency detection with immediate response
    if (this.isEmergencyMessage(message)) {
      return this.getEmergencyResponse();
    }

    // Heart attack and cardiovascular risk assessment
    if (this.isAboutHeartRisk(lowerMessage)) {
      return this.getHeartRiskResponse();
    }

    // Symptoms and medical concerns
    if (this.isAboutSymptoms(lowerMessage)) {
      return this.getSymptomsResponse();
    }

    // Indian traditional medicine (Ayurveda)
    if (this.isAboutAyurveda(lowerMessage)) {
      return this.getAyurvedaResponse(lowerMessage);
    }

    // Yoga and breathing exercises
    if (this.isAboutYoga(lowerMessage)) {
      return this.getYogaResponse(lowerMessage);
    }

    // Exercise and fitness
    if (this.isAboutExercise(lowerMessage)) {
      return this.getExerciseResponse(lowerMessage);
    }

    // Diet and nutrition
    if (this.isAboutDiet(lowerMessage)) {
      return this.getDietResponse(lowerMessage);
    }

    // Lifestyle and prevention
    if (this.isAboutLifestyle(lowerMessage)) {
      return this.getLifestyleResponse();
    }

    // Stress management
    if (this.isAboutStress(lowerMessage)) {
      return this.getStressManagementResponse();
    }

    // Medication and treatment questions
    if (this.isAboutMedication(lowerMessage)) {
      return this.getMedicationResponse();
    }

    // Lab results and medical numbers
    if (this.isAboutLabResults(lowerMessage)) {
      return this.getLabResultsResponse();
    }

    // General health education
    return this.getGeneralHealthResponse(userContext);
  }

  private isEmergencyMessage(message: string): boolean {
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'can\'t breathe', 'shortness of breath',
      'crushing pain', 'left arm pain', 'emergency', 'help me', 'severe pain',
      'chest pressure', 'chest tightness', 'difficulty breathing', 'cardiac arrest'
    ];
    return emergencyKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isAboutHeartRisk(message: string): boolean {
    return ['heart attack', 'cardiac', 'cardiovascular', 'coronary', 'risk assessment', 'heart health', 'heart disease'].some(term => message.includes(term));
  }

  private isAboutSymptoms(message: string): boolean {
    return ['symptom', 'pain', 'ache', 'discomfort', 'breathing', 'fatigue', 'dizzy', 'nausea'].some(term => message.includes(term));
  }

  private isAboutAyurveda(message: string): boolean {
    return ['ayurveda', 'ayurvedic', 'herbs', 'arjuna', 'ashwagandha', 'turmeric', 'traditional medicine', 'dosha', 'vata', 'pitta', 'kapha'].some(term => message.includes(term));
  }

  private isAboutYoga(message: string): boolean {
    return ['yoga', 'pranayama', 'breathing', 'meditation', 'asana', 'pose', 'namaste', 'chakra', 'mindfulness'].some(term => message.includes(term));
  }

  private isAboutExercise(message: string): boolean {
    return ['exercise', 'workout', 'fitness', 'physical activity', 'walking', 'running', 'gym', 'cardio', 'strength training'].some(term => message.includes(term));
  }

  private isAboutDiet(message: string): boolean {
    return ['diet', 'food', 'nutrition', 'eat', 'meal', 'vegetarian', 'vegan', 'cooking', 'recipe'].some(term => message.includes(term));
  }

  private isAboutLifestyle(message: string): boolean {
    return ['lifestyle', 'prevent', 'healthy living', 'habits', 'routine', 'sleep', 'smoking', 'alcohol'].some(term => message.includes(term));
  }

  private isAboutStress(message: string): boolean {
    return ['stress', 'anxiety', 'tension', 'worried', 'relaxation', 'calm', 'mental health'].some(term => message.includes(term));
  }

  private isAboutMedication(message: string): boolean {
    return ['medication', 'medicine', 'pills', 'prescription', 'drug', 'treatment', 'therapy'].some(term => message.includes(term));
  }

  private isAboutLabResults(message: string): boolean {
    return ['cholesterol', 'blood pressure', 'sugar', 'glucose', 'test results', 'lab report', 'numbers', 'levels'].some(term => message.includes(term));
  }

  private getSymptomsResponse(): AIResponse {
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
• India: 108
• US: 911
• UK: 999  
• EU: 112
• Canada: 911
• Australia: 000

Are you currently experiencing any of these symptoms? If yes, please contact emergency services immediately.`,
      suggestions: ['I need general heart health info', 'What are heart attack prevention tips?', 'Tell me about stress management']
    };
  }

  private getEmergencyResponse(): AIResponse {
    return {
      content: `🚨 **MEDICAL EMERGENCY** 🚨

**If you are experiencing a medical emergency, IMMEDIATELY:**
• **Call emergency services: 108 (India), 911 (US), 999 (UK)**
• Go to the nearest hospital emergency room
• If possible, have someone drive you - do NOT drive yourself

**Heart Attack Warning Signs:**
• Severe chest pain, pressure, or squeezing
• Pain radiating to arms, neck, jaw, or back
• Shortness of breath or difficulty breathing
• Sweating, nausea, or lightheadedness
• Sudden severe fatigue (especially in women)

**⚠️ CRITICAL:** This AI cannot provide emergency medical care. Every minute counts in a cardiac emergency.

Are you currently experiencing any of these symptoms? If YES, please contact emergency services immediately.`,
      suggestions: ['I need general heart health info instead', 'What are heart attack prevention tips?', 'Tell me about stress management']
    };
  }

  private getHeartRiskResponse(): AIResponse {
    return {
      content: `❤️ **Heart Attack Risk Assessment & Prevention**

**Major Risk Factors (Based on Indian Heart Study data):**

**🔴 High-Risk Factors:**
• Age: Men >45, Women >55 years
• Diabetes (very common in Indian population)
• High blood pressure (>140/90 mmHg)
• Smoking or tobacco use (including gutka, pan masala)
• High cholesterol (>240 mg/dL)
• Family history of heart disease
• Obesity (BMI >25 for Indians vs >30 for others)

**🟡 Moderate Risk Factors:**
• Sedentary lifestyle (very common in IT professionals)
• High stress levels
• Poor diet (excessive refined carbs, trans fats)
• Sleep disorders
• Air pollution exposure

**🇮🇳 India-Specific Considerations:**
• Indians develop heart disease 10 years earlier than Western populations
• Vegetarian diets can be heart-healthy if balanced properly
• Traditional cooking methods (using mustard oil, turmeric) are beneficial
• High prevalence of diabetes requires special attention

**⚠️ Medical Disclaimer:** This is educational information only. For personalized risk assessment, consult a cardiologist.`,
      suggestions: ['How can I prevent heart disease?', 'Tell me about Indian diet for heart health', 'What yoga poses help the heart?', 'I want to quit smoking']
    };
  }

  private getAyurvedaResponse(message: string): AIResponse {
    if (message.includes('arjuna') || message.includes('herb')) {
      return {
        content: `🌿 **Ayurvedic Heart Health Remedies**

**🍃 Terminalia Arjuna (Arjun Chaal):**
• **Benefits:** Strengthens heart muscle, improves circulation, reduces cholesterol
• **Usage:** 3-6g bark powder daily with warm milk or water
• **Preparation:** Boil 1 tsp bark powder in 1 cup water for 10 minutes, strain & drink

**🌱 Other Heart-Supporting Herbs:**
• **Ashwagandha:** Reduces stress and cortisol levels
• **Brahmi:** Calms nervous system, reduces anxiety
• **Garlic (Lasun):** Natural blood thinner, reduces cholesterol
• **Ginger (Adrak):** Improves circulation, anti-inflammatory

**💚 Ayurvedic Heart Tonic Recipe:**
*Mix:* 1 tsp Arjuna powder + 1/2 tsp turmeric + 1 tsp honey
*Take:* Twice daily with warm water

**⚖️ Dosha Considerations:**
• **Vata types:** Focus on calming, warming herbs
• **Pitta types:** Use cooling herbs, avoid excessive spices
• **Kapha types:** Use warming, stimulating herbs

**⚠️ Important:** Consult an Ayurvedic practitioner and your doctor before starting herbal treatments, especially if taking medications.`,
        suggestions: ['Yoga poses for heart health', 'Ayurvedic diet recommendations', 'Stress management techniques', 'How to prepare herbal remedies']
      };
    }

    return {
      content: `🧘‍♀️ **Ayurveda & Heart Health**

**🌟 Ayurvedic Principles for Heart Health:**

**Lifestyle (Dinacharya):**
• Wake up before sunrise (Brahma Muhurta: 4-6 AM)
• Practice oil pulling with sesame or coconut oil
• Eat largest meal at noon when digestion is strongest
• Sleep by 10 PM for optimal rest

**Heart-Healthy Practices:**
• **Abhyanga:** Daily oil massage to improve circulation
• **Pranayama:** Breathing exercises to calm the mind
• **Meditation:** 20 minutes daily to reduce stress
• **Sattvavajaya:** Psychological counseling & positive thinking

**🥄 Ayurvedic Heart Remedies:**
• Morning: 1 tsp Arjuna powder with warm water
• Afternoon: Fresh pomegranate juice
• Evening: Golden milk with turmeric
• Before bed: 2-3 soaked almonds

**💝 Rasayana (Rejuvenative) Therapy:**
• Chyawanprash: 1 tsp daily for overall heart health
• Brahmi Ghrita: For stress-related heart issues
• Saraswatarishta: For nervous system support

**⚠️ Caution:** Always inform your cardiologist about Ayurvedic treatments.`,
      suggestions: ['Specific herbs for my condition', 'Pranayama techniques', 'Ayurvedic diet plan', 'Oil massage techniques']
    };
  }

  private getYogaResponse(message: string): AIResponse {
    if (message.includes('pranayama') || message.includes('breathing')) {
      return {
        content: `🧘‍♂️ **Pranayama for Heart Health**

**🌬️ Essential Breathing Techniques:**

**1. Anulom Vilom (Alternate Nostril Breathing):**
• Sit comfortably, close right nostril with thumb
• Inhale through left nostril (4 counts)
• Close both nostrils (hold for 2 counts)
• Release thumb, exhale through right nostril (4 counts)
• Reverse and repeat for 5-10 minutes
• **Benefits:** Balances nervous system, reduces blood pressure

**2. Kapalbhati (Skull Shining Breath):**
• Sit straight, inhale normally
• Exhale forcefully through nose by contracting abdomen
• Let inhalation happen naturally
• Start with 30 rounds, gradually increase
• **Benefits:** Improves circulation, energizes heart

**3. Bhramari Pranayama (Bee Breath):**
• Close ears with thumbs, eyes with fingers
• Inhale normally, exhale making humming sound
• Practice for 5-10 rounds
• **Benefits:** Calms nervous system, reduces stress

**4. Ujjayi Pranayama (Ocean Breath):**
• Breathe through nose with slight throat constriction
• Creates soft ocean-like sound
• Practice throughout yoga session
• **Benefits:** Calms mind, improves focus

**⏰ Best Practice Time:** Early morning (5-7 AM) on empty stomach`,
        suggestions: ['Yoga poses for heart', 'Meditation techniques', 'How to start yoga practice', 'Stress relief exercises']
      };
    }

    return {
      content: `🧘‍♀️ **Yoga for Heart Health**

**❤️ Heart-Opening Asanas:**

**🔰 Beginner Level:**
• **Sukhasana (Easy Pose):** For meditation and breathing
• **Marjaryasana-Bitilasana (Cat-Cow):** Gentle spine movement
• **Bhujangasana (Cobra Pose):** Opens chest, improves circulation
• **Balasana (Child's Pose):** Relieves stress and anxiety

**🔶 Intermediate Level:**
• **Ustrasana (Camel Pose):** Deep heart opening
• **Matsyasana (Fish Pose):** Expands chest cavity
• **Urdhva Mukha Svanasana (Upward Dog):** Strengthens heart
• **Setu Bandhasana (Bridge Pose):** Improves circulation

**🏆 Advanced Level:**
• **Urdhva Dhanurasana (Wheel Pose):** Complete back opening
• **Raja Kapotasana (King Pigeon):** Deep emotional release

**🧘‍♂️ Restorative Poses:**
• **Legs-Up-Wall Pose:** Reduces heart rate, calms nerves
• **Supported Fish Pose:** Gentle heart opening with props
• **Savasana:** Complete relaxation, stress relief

**📅 Recommended Practice:**
• 20-30 minutes daily
• Focus on breath awareness
• End with 5-10 minutes meditation
• Practice Surya Namaskara for cardiovascular fitness

**⚠️ Cautions:** Avoid inversions if you have high blood pressure. Consult yoga instructor for modifications.`,
      suggestions: ['Pranayama breathing techniques', 'Meditation for beginners', 'Yoga sequence for stress', 'How to modify poses']
    };
  }

  private getExerciseResponse(message: string): AIResponse {
    return {
      content: `🏃‍♂️ **Heart-Healthy Exercise Program**

**💪 Cardiovascular Exercise (150+ minutes/week):**

**🚶‍♂️ Walking Program:**
• **Beginner:** 15-20 minutes daily, moderate pace
• **Intermediate:** 30-45 minutes, brisk walking
• **Advanced:** Include hills, stairs, or intervals
• **Best times:** Early morning (6-8 AM) or evening (5-7 PM)

**🏃‍♂️ Cardio Options for Indians:**
• Traditional dance (Bharatanatyam, Folk dances)
• Cricket, badminton, table tennis
• Swimming (excellent low-impact option)
• Cycling (great in Indian weather)
• Stair climbing (use building stairs)

**🏋️‍♂️ Strength Training (2-3 days/week):**
• Push-ups (wall, knee, or full)
• Squats and lunges
• Resistance band exercises
• Light weights or water bottles
• Bodyweight exercises

**🧘‍♀️ Flexibility & Balance:**
• 10 minutes stretching daily
• Yoga poses for heart health
• Tai Chi for seniors
• Balance exercises to prevent falls

**⚡ High-Intensity Options (if cleared by doctor):**
• Interval training: 30 sec high intensity, 90 sec recovery
• Surya Namaskara at faster pace
• Circuit training with bodyweight exercises

**📅 Weekly Schedule Example:**
• **Monday:** 30 min walk + 15 min yoga
• **Tuesday:** Strength training (upper body)
• **Wednesday:** 45 min cycling or dancing
• **Thursday:** Strength training (lower body)
• **Friday:** 30 min swimming or badminton
• **Saturday:** Long walk (60+ minutes)
• **Sunday:** Gentle yoga and stretching

**⚠️ Safety Guidelines:** Start slowly, monitor heart rate, stop if chest pain occurs.`,
      suggestions: ['Exercise for beginners', 'Home workout routines', 'Heart rate monitoring', 'Exercise with medical conditions']
    };
  }

  private getDietResponse(message: string): AIResponse {
    return {
      content: `🍽️ **Indian Heart-Healthy Diet Plan**

**🥗 Traditional Indian Foods for Heart Health:**

**✅ Excellent Choices:**
• **Whole Grains:** Brown rice, quinoa, millets (jowar, bajra, ragi)
• **Lentils:** All dals, especially moong and masoor
• **Vegetables:** Leafy greens, broccoli, carrots, bell peppers
• **Fruits:** Pomegranate, amla, berries, citrus fruits
• **Nuts & Seeds:** Walnuts, almonds, flaxseeds, chia seeds
• **Oils:** Mustard oil, olive oil (in moderation)
• **Spices:** Turmeric, garlic, ginger, fenugreek, cinnamon

**⚠️ Foods to Limit:**
• Refined flour (maida) products
• Deep-fried foods (samosas, pakoras)
• High-sodium pickles and processed foods
• Excessive ghee and butter
• Sugary sweets and beverages
• Red meat and organ meats

**🍛 Sample Daily Menu:**

**🌅 Breakfast:**
• Option 1: Oats upma with vegetables + green tea
• Option 2: Moong dal chilla with mint chutney
• Option 3: Brown bread with almond butter + amla juice

**🌞 Lunch:**
• Brown rice/roti + dal + sabzi + salad
• Include one leafy green vegetable daily
• Small portion of yogurt or buttermilk

**🌆 Dinner:**
• Light: Vegetable soup + roti + minimal oil curry
• Or: Khichdi with vegetables
• Finish 3 hours before sleep

**🥤 Beverages:**
• Green tea with ginger/cardamom
• Herbal teas: chamomile, hibiscus
• Fresh lime water (without sugar)
• Coconut water (natural electrolytes)

**🇮🇳 Indian Superfoods for Heart:**
• **Amla:** Highest vitamin C, natural antioxidant
• **Curry leaves:** Lower cholesterol naturally
• **Fenugreek seeds:** Control blood sugar
• **Bitter gourd:** Excellent for diabetics

**📏 Portion Control Tips:**
• Use smaller plates (8-9 inch diameter)
• Fill half plate with vegetables
• Quarter plate protein (dal/paneer)
• Quarter plate complex carbs

**⚠️ Special Considerations for Indians:** Many Indians are vegetarian - ensure adequate protein from lentils, nuts, and dairy.`,
      suggestions: ['Vegetarian protein sources', 'Heart-healthy recipes', 'Weight management tips', 'Meal prep ideas']
    };
  }

  private getStressManagementResponse(): AIResponse {
    return {
      content: `🧘 **Stress Management for Heart Health**

**🧠 Understanding Stress & Heart Connection:**
Chronic stress releases cortisol and adrenaline, which:
• Increase blood pressure and heart rate
• Promote inflammation in arteries
• Raise blood sugar levels
• Contribute to unhealthy coping behaviors

**🌟 Proven Stress Reduction Techniques:**

**💆‍♂️ Immediate Relief (5-10 minutes):**
• **4-7-8 Breathing:** Inhale 4, hold 7, exhale 8
• **Progressive Muscle Relaxation:** Tense and release each muscle group
• **Visualization:** Imagine peaceful place in detail
• **Mindful Walking:** Focus on each step and breath

**🧘‍♂️ Daily Practices:**
• **Meditation:** 10-20 minutes daily, use apps like Headspace
• **Yoga:** Gentle poses with breath awareness
• **Gratitude Journaling:** Write 3 things you're grateful for
• **Nature Time:** Spend time outdoors daily

**📱 Modern Stress Management:**
• **Digital Detox:** No screens 1 hour before bed
• **Time Management:** Use techniques like Pomodoro
• **Boundaries:** Learn to say no to excess commitments
• **Sleep Hygiene:** 7-9 hours quality sleep

**🎯 Indian Approaches:**
• **Mantra Meditation:** Repeat "Om" or personal mantra
• **Kirtan/Bhajans:** Devotional singing for emotional release
• **Community Support:** Spend time with family and friends
• **Seva (Service):** Helping others reduces personal stress

**🏢 Workplace Stress Management:**
• Take short breaks every 2 hours
• Practice desk yoga stretches
• Use lunch break for walking or meditation
• Create a calming workspace with plants

**⚡ Emergency Stress Protocol:**
1. Stop what you're doing
2. Take 5 deep breaths
3. Identify what you can and cannot control
4. Take one small positive action
5. Seek support if needed

**📞 Professional Help:** Consider counseling if stress affects daily life or relationships.`,
      suggestions: ['Meditation techniques for beginners', 'Yoga for stress relief', 'Sleep improvement tips', 'Work-life balance strategies']
    };
  }

  private getMedicationResponse(): AIResponse {
    return {
      content: `💊 **Important Information About Heart Medications**

**⚠️ CRITICAL MEDICAL DISCLAIMER:**

**I CANNOT and MUST NOT provide advice about:**
• Specific medications or dosages
• Starting, stopping, or changing medications
• Drug interactions or side effects
• Treatment protocols or prescriptions
• Medical procedures or interventions

**🏥 FOR ALL MEDICATION QUESTIONS, CONSULT:**
• Your cardiologist or primary care physician
• Clinical pharmacist
• Emergency services (for urgent medication concerns)

**❓ Questions to Ask Your Healthcare Provider:**

**💊 About Your Medications:**
• "What is this medication for and how does it work?"
• "When should I take it and with or without food?"
• "What side effects should I watch for?"
• "How long will I need to take this?"
• "What should I do if I miss a dose?"

**🔄 About Interactions:**
• "Can I take this with my other medications?"
• "Are there foods or supplements I should avoid?"
• "How does this interact with alcohol?"
• "What about over-the-counter medications?"

**📊 About Monitoring:**
• "How often should I have blood tests?"
• "What symptoms require immediate medical attention?"
• "How will we know if the medication is working?"

**📝 Medication Safety Tips:**
• Keep an updated list of all medications
• Use a pill organizer for complex regimens
• Set reminders on your phone
• Never share medications with others
• Store medications properly (temperature, light)
• Check expiration dates regularly

**🚨 Seek IMMEDIATE medical attention for:**
• Severe allergic reactions
• Chest pain or difficulty breathing
• Unusual bleeding or bruising
• Severe dizziness or fainting
• Any symptoms that concern you

**Remember:** Your healthcare team has access to your complete medical history and can provide safe, personalized advice that I cannot.`,
      suggestions: ['General heart health information', 'Lifestyle modifications', 'Questions to ask my doctor', 'Heart-healthy diet tips']
    };
  }

  private getLabResultsResponse(): AIResponse {
    return {
      content: `📊 **Understanding Heart Health Numbers**

**⚠️ IMPORTANT:** These are general reference ranges. Your specific targets may be different based on your individual health conditions, age, and risk factors.

**🩺 Blood Pressure (mmHg):**
• **Optimal:** <120/80
• **Normal:** <130/85  
• **High Normal:** 130-139/85-89
• **Stage 1 Hypertension:** 140-159/90-99
• **Stage 2 Hypertension:** ≥160/100

**🔬 Cholesterol Levels (mg/dL):**
• **Total Cholesterol:** <200 (desirable)
• **LDL ("Bad"):** <100 (optimal), <70 (high-risk patients)
• **HDL ("Good"):** >40 (men), >50 (women), >60 (protective)
• **Triglycerides:** <150 (normal), <100 (optimal)

**📈 Blood Sugar (mg/dL):**
• **Fasting Glucose:** 70-100 (normal)
• **HbA1c:** <5.7% (normal), <7% (diabetic target)
• **Random Glucose:** <140 (normal)

**❤️ Other Heart Health Markers:**
• **Resting Heart Rate:** 60-100 bpm (lower is generally better)
• **BMI:** 18.5-22.9 (ideal for Indians)
• **Waist Circumference:** <90cm (men), <80cm (women) for Indians

**🔍 Advanced Cardiac Markers:**
• **C-Reactive Protein (CRP):** <1.0 mg/L (low risk)
• **Homocysteine:** <10 μmol/L
• **Lipoprotein(a):** <30 mg/dL

**🇮🇳 Special Considerations for Indians:**
• Indians have higher risk at lower BMI levels
• Diabetes onset occurs at younger ages
• Genetic predisposition requires lower treatment thresholds
• Traditional diet may affect lipid profiles differently

**⚠️ CRITICAL DISCLAIMER:**
**NEVER interpret your lab results without professional medical guidance.**

**Your doctor considers:**
• Your complete medical history
• Current medications and supplements
• Family history and genetic factors
• Overall cardiovascular risk profile
• Trends over time, not just single values

**📞 ALWAYS discuss your specific results with your healthcare provider for proper interpretation and treatment planning.**`,
      suggestions: ['How to improve cholesterol naturally', 'Blood pressure management tips', 'Diet for better lab results', 'Questions to ask about my results']
    };
  }

  private getLifestyleResponse(): AIResponse {
    return {
      content: `🌟 **Comprehensive Heart-Healthy Lifestyle**

**💤 Sleep for Heart Health:**
• **Duration:** 7-9 hours nightly for adults
• **Quality:** Deep, uninterrupted sleep
• **Schedule:** Consistent sleep-wake times
• **Environment:** Cool, dark, quiet room
• **Pre-sleep:** No screens 1 hour before bed, gentle stretching

**🚭 Tobacco Cessation:**
• **Benefits:** 50% reduced heart attack risk within 1 year
• **Indian Context:** Avoid gutka, pan masala, bidis
• **Support:** Call tobacco quitline: 1800-11-2356 (India)
• **Alternatives:** Nicotine gum, patches (consult doctor)
• **Coping:** Stress management, support groups

**🍷 Alcohol Guidelines:**
• **Men:** Maximum 2 drinks per day
• **Women:** Maximum 1 drink per day
• **1 drink equals:** 12 oz beer, 5 oz wine, 1.5 oz spirits
• **Benefits:** Moderate consumption may have heart benefits
• **Risks:** Excess increases blood pressure, heart rhythm issues

**🌱 Environmental Health:**
• **Air Quality:** Use air purifiers, avoid outdoor exercise during high pollution
• **Water:** Drink 8-10 glasses daily, filtered if possible
• **Chemicals:** Minimize exposure to pesticides, household cleaners
• **Green Spaces:** Spend time in parks, gardens for stress relief

**👥 Social Connections:**
• **Relationships:** Maintain strong family and friend networks
• **Community:** Join clubs, volunteer, religious activities
• **Communication:** Express emotions healthily, seek support
• **Isolation:** Loneliness increases heart disease risk by 50%

**🎯 Goal Setting:**
• **SMART Goals:** Specific, Measurable, Achievable, Relevant, Time-bound
• **Start Small:** One change at a time
• **Track Progress:** Use apps or journals
• **Celebrate:** Acknowledge improvements and milestones

**📅 Daily Heart-Healthy Routine:**
• **Morning:** Meditation/prayer, healthy breakfast, morning walk
• **Midday:** Nutritious lunch, brief work break, stairs instead of elevator
• **Evening:** Physical activity, family time, limit work stress
• **Night:** Light dinner, relaxation, preparation for quality sleep

**🏥 Regular Health Monitoring:**
• **Annual checkups:** Even if feeling healthy
• **Blood pressure:** Monthly if normal, weekly if elevated
• **Weight:** Weekly monitoring
• **Symptoms:** Track and report changes to doctor

**⚖️ Work-Life Balance:**
• Set boundaries between work and personal time
• Take regular vacations or breaks
• Practice saying "no" to excessive commitments
• Find purpose and meaning in daily activities`,
      suggestions: ['Sleep improvement strategies', 'Stress management at work', 'Building healthy habits', 'Social support networks']
    };
  }

  private getGeneralHealthResponse(userContext: ConversationContext): AIResponse {
    return {
      content: `👋 **Welcome to Your Heart Health Assistant!**

I'm here to provide comprehensive heart health education with a focus on **Indian healthcare approaches**, combining modern medicine with traditional practices like **Ayurveda** and **Yoga**.

**🎯 What I Can Help You With:**

**🫀 Heart Health Education:**
• Understanding cardiovascular risk factors
• Prevention strategies and lifestyle modifications
• Reading and understanding common health metrics
• Heart attack warning signs and emergency response

**🇮🇳 Indian Traditional Medicine:**
• **Ayurvedic remedies** for heart health (Arjuna, Ashwagandha, etc.)
• **Yoga sequences** and breathing exercises (Pranayama)
• Traditional Indian recipes and cooking methods
• Stress management through meditation and mindfulness

**🏃‍♂️ Lifestyle Guidance:**
• Exercise programs suitable for Indian climate and culture
• Vegetarian nutrition for optimal heart health
• Stress management for high-pressure work environments
• Sleep optimization and daily routines

**🌿 Natural Approaches:**
• Herbal remedies and their preparation
• Breathing techniques for immediate stress relief
• Traditional practices for long-term wellness
• Integration of modern and ancient healing wisdom

**⚠️ Important Medical Disclaimers:**
• I provide **educational information only**
• I **cannot diagnose, treat, or replace medical care**
• Always **consult healthcare professionals** for medical decisions
• For emergencies, **immediately contact medical services**

**🔥 Popular Topics:**
• "Heart attack risk factors in Indians"
• "Ayurvedic herbs for heart health"
• "Yoga poses for cardiovascular fitness" 
• "Indian vegetarian diet for heart disease prevention"
• "Stress management techniques"

**How can I help you achieve better heart health today?**`,
      suggestions: [
        'Assess my heart attack risk',
        'Ayurvedic remedies for heart health',
        'Yoga and breathing exercises',
        'Heart-healthy Indian recipes',
        'Stress management techniques',
        'Exercise program for beginners'
      ]
    };
  }

  async generateHealthInsight(patientData: PatientData, predictionResult: PredictionResult): Promise<string> {
    const riskLevel = predictionResult.riskLevel;
    const riskScore = predictionResult.riskScore;
    
    let insight = `**🇮🇳 Personalized Heart Health Insight for Indian Context**\n\n`;
    insight += `**⚠️ Medical Disclaimer:** This analysis is educational only. Always consult healthcare professionals.\n\n`;
    
    insight += `**📊 Your Assessment Summary:**\n`;
    insight += `• **Risk Level:** ${riskLevel.toUpperCase()}\n`;
    insight += `• **Risk Score:** ${riskScore.toFixed(1)}%\n`;
    insight += `• **Assessment Date:** ${new Date().toLocaleDateString('en-IN')}\n\n`;
    
    if (riskLevel === 'high') {
      insight += `**🚨 High Risk - Immediate Action Needed:**\n\n`;
      insight += `**🏥 Medical Steps:**\n`;
      insight += `• Schedule cardiology consultation within 1-2 weeks\n`;
      insight += `• Request comprehensive cardiac evaluation\n`;
      insight += `• Discuss preventive medications with doctor\n\n`;
      
      insight += `**🌿 Ayurvedic Support (with doctor's approval):**\n`;
      insight += `• Arjuna (Terminalia arjuna) bark tea daily\n`;
      insight += `• Ashwagandha for stress reduction\n`;
      insight += `• Garlic and turmeric in daily diet\n\n`;
      
      insight += `**🧘‍♂️ Immediate Lifestyle Changes:**\n`;
      insight += `• Start gentle yoga and pranayama daily\n`;
      insight += `• Eliminate smoking/tobacco completely\n`;
      insight += `• Adopt strict heart-healthy Indian diet\n`;
    } else if (riskLevel === 'medium') {
      insight += `**⚠️ Moderate Risk - Prevention Focus:**\n\n`;
      insight += `**🏥 Medical Steps:**\n`;
      insight += `• Schedule check-up with primary care physician\n`;
      insight += `• Annual comprehensive health screening\n`;
      insight += `• Monitor blood pressure and cholesterol regularly\n\n`;
      
      insight += `**🌿 Preventive Ayurvedic Practices:**\n`;
      insight += `• Include heart-supportive spices (turmeric, ginger)\n`;
      insight += `• Practice oil pulling with sesame oil\n`;
      insight += `• Regular abhyanga (oil massage) for circulation\n\n`;
      
      insight += `**🏃‍♂️ Active Prevention:**\n`;
      insight += `• 150 minutes weekly moderate exercise\n`;
      insight += `• Daily yoga practice with pranayama\n`;
      insight += `• Stress management through meditation\n`;
    } else {
      insight += `**✅ Low Risk - Maintain & Optimize:**\n\n`;
      insight += `**🏥 Medical Steps:**\n`;
      insight += `• Continue annual health check-ups\n`;
      insight += `• Monitor trends in key health metrics\n`;
      insight += `• Stay informed about family history changes\n\n`;
      
      insight += `**🌿 Wellness Ayurvedic Practices:**\n`;
      insight += `• Seasonal detox (Panchakarma) annually\n`;
      insight += `• Daily rasayana (rejuvenative) practices\n`;
      insight += `• Maintain dosha balance through diet\n\n`;
      
      insight += `**🎯 Optimization Goals:**\n`;
      insight += `• Enhance cardiovascular fitness\n`;
      insight += `• Deepen yoga and meditation practice\n`;
      insight += `• Share knowledge with family members\n`;
    }
    
    insight += `**🍽️ Recommended Indian Heart-Healthy Foods:**\n`;
    insight += `• **Whole grains:** Brown rice, quinoa, millets\n`;
    insight += `• **Legumes:** All dals, especially moong and masoor\n`;
    insight += `• **Vegetables:** Leafy greens, amla, curry leaves\n`;
    insight += `• **Spices:** Turmeric, garlic, ginger, fenugreek\n`;
    insight += `• **Oils:** Mustard oil, olive oil (limited quantities)\n\n`;
    
    insight += `**📞 Emergency Contacts to Save:**\n`;
    insight += `• **Emergency Services:** 108 (India)\n`;
    insight += `• **Your Cardiologist:** _____________\n`;
    insight += `• **Family Doctor:** _____________\n\n`;
    
    insight += `**🔄 Next Steps:**\n`;
    insight += `1. Share these results with your healthcare provider\n`;
    insight += `2. Start implementing one lifestyle change this week\n`;
    insight += `3. Schedule appropriate medical follow-up\n`;
    insight += `4. Track your progress using health apps or journals\n`;
    
    return insight;
  }

  // New enhanced AI methods using Gemini and OpenAI
  async getEnhancedSuggestions(request: EnhancedAIRequest): Promise<EnhancedAIResponse> {
    const prompt = this.buildEnhancedPrompt(request);

    try {
      // Try Gemini first
      if (this.gemini) {
        if (import.meta.env.DEV) console.log('[AI Service] Attempting Gemini API call...');
        const response = await this.callGemini(prompt);
        if (response && response.suggestions) {
          if (import.meta.env.DEV) console.log('[AI Service] ✅ Gemini API success');
          return {
            suggestions: response.suggestions,
            warnings: response.warnings || [],
            source: 'gemini',
            disclaimer: this.getMedicalDisclaimer()
          };
        }
        if (import.meta.env.DEV) console.warn('[AI Service] ⚠️ Gemini API returned no suggestions, trying OpenAI...');
      } else {
        if (import.meta.env.DEV) console.log('[AI Service] Gemini not initialized, skipping to OpenAI');
      }

      // Fallback to OpenAI
      if (this.openai) {
        if (import.meta.env.DEV) console.log('[AI Service] Attempting OpenAI API call...');
        const response = await this.callOpenAI(prompt);
        if (response && response.suggestions) {
          if (import.meta.env.DEV) console.log('[AI Service] ✅ OpenAI API success');
          return {
            suggestions: response.suggestions,
            warnings: response.warnings || [],
            source: 'openai',
            disclaimer: this.getMedicalDisclaimer()
          };
        }
        if (import.meta.env.DEV) console.warn('[AI Service] ⚠️ OpenAI API returned no suggestions');
      } else {
        if (import.meta.env.DEV) console.log('[AI Service] OpenAI not initialized');
      }

      // Fallback to rule-based suggestions
      if (import.meta.env.DEV) console.warn('[AI Service] ⚠️ Using rule-based fallback suggestions');
      return this.getFallbackSuggestions(request);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AI Service] ❌ Error:', error);
      return this.getFallbackSuggestions(request);
    }
  }

  private buildEnhancedPrompt(request: EnhancedAIRequest): string {
    const { riskLevel, patientData, requestType } = request;
    
    return `
    You are an experienced cardiologist and medical AI assistant providing evidence-based, personalized cardiovascular health recommendations.
    
    PATIENT PROFILE:
    - Age: ${patientData.age} years old
    - Gender: ${patientData.gender}
    - Cardiovascular Risk Level: ${riskLevel.toUpperCase()}
    - Medical History: ${patientData.medicalHistory.length > 0 ? patientData.medicalHistory.join(', ') : 'None reported'}
    - Current Conditions: ${patientData.currentConditions.length > 0 ? patientData.currentConditions.join(', ') : 'None reported'}
    - Lifestyle Factors: ${patientData.lifestyle.length > 0 ? patientData.lifestyle.join(', ') : 'None reported'}

    TASK: Provide ${requestType === 'comprehensive' ? 'comprehensive personalized' : requestType} recommendations for cardiovascular health improvement tailored to this patient's specific risk level and profile.

    ${requestType === 'comprehensive' || requestType === 'medicines' ? `
    MEDICINES/SUPPLEMENTS (over-the-counter and general recommendations):
    - Evidence-based supplements for heart health
    - General medication categories (user should consult doctor for prescriptions)
    - Vitamins and minerals beneficial for cardiovascular health
    ` : ''}

    ${requestType === 'comprehensive' || requestType === 'ayurveda' ? `
    AYURVEDIC APPROACHES:
    - Traditional herbs known for heart health (Arjuna, Garlic, Turmeric, etc.)
    - Ayurvedic lifestyle practices
    - Pranayama (breathing exercises)
    - Dietary principles from Ayurveda
    ` : ''}

    ${requestType === 'comprehensive' || requestType === 'yoga' ? `
    YOGA & PHYSICAL PRACTICES:
    - Specific yoga poses for heart health
    - Breathing exercises (Pranayama)
    - Meditation techniques for stress reduction
    - Safe exercise guidelines based on risk level
    ` : ''}

    ${requestType === 'comprehensive' || requestType === 'diet' ? `
    DIETARY RECOMMENDATIONS:
    - Heart-healthy foods to include
    - Foods to avoid or limit
    - Meal timing and portion control
    - Specific nutrients important for cardiovascular health
    ` : ''}

    CRITICAL FORMATTING REQUIREMENTS:
    1. Provide 4-6 specific, actionable recommendations per category
    2. Consider the ${riskLevel} risk level - be more conservative for high/critical risk
    3. Include dosages, frequencies, and specific instructions where applicable
    4. For high/critical risk patients, emphasize medical consultation
    5. Each recommendation should be a complete sentence with clear action steps
    
    RESPONSE FORMAT (respond ONLY with this JSON structure, no additional text):
    {
      "medicines": [
        "Omega-3 fatty acids (fish oil) 1000mg twice daily with meals",
        "Coenzyme Q10 100mg daily for heart energy support",
        "..."
      ],
      "ayurveda": [
        "Arjuna bark powder 3-6g daily divided into 2-3 doses with warm water",
        "Fresh garlic 2-3 cloves on empty stomach each morning",
        "..."
      ],
      "yoga": [
        "Shavasana (Corpse Pose) 10-15 minutes daily for deep relaxation",
        "Anulom Vilom pranayama 5-10 minutes twice daily",
        "..."
      ],
      "diet": [
        "Consume 5-7 servings of colorful fruits and vegetables daily",
        "Include fatty fish (salmon, mackerel) 2-3 times per week",
        "..."
      ],
      "warnings": [
        "Consult cardiologist before starting any new supplement regimen",
        "..."
      ]
    }

    IMPORTANT: Return ONLY the JSON object above with your personalized recommendations. No explanatory text before or after.
    `;
  }

  private async callGemini(prompt: string, retries = 2): Promise<Partial<EnhancedAIResponse> | null> {
    if (!this.gemini) return null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (import.meta.env.DEV && attempt > 0) {
          console.log(`[AI Service] Gemini retry attempt ${attempt}/${retries}`);
        }

        const model = this.gemini.getGenerativeModel({ 
          model: config.ai.gemini.model,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (import.meta.env.DEV) {
          console.log('[AI Service] Gemini raw response length:', text.length);
        }

        // Try to parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate response has expected structure
            if (parsed.medicines || parsed.ayurveda || parsed.yoga || parsed.diet) {
              return {
                suggestions: parsed,
                warnings: parsed.warnings || []
              };
            } else {
              if (import.meta.env.DEV) {
                console.warn('[AI Service] Gemini response missing expected categories');
              }
              // Throw error to trigger error categorization
              throw new Error('GEMINI_INVALID_RESPONSE: Missing expected categories');
            }
          } catch (parseError) {
            if (import.meta.env.DEV) {
              console.error('[AI Service] JSON parse error:', parseError);
            }
            throw new Error('GEMINI_INVALID_RESPONSE: Failed to parse JSON');
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn('[AI Service] No JSON found in Gemini response');
          }
          throw new Error('GEMINI_INVALID_RESPONSE: No JSON found');
        }

        // If we got here, parsing failed but no exception - don't retry
        if (attempt === 0) break;
        
      } catch (error: unknown) {
        const err = error as { message?: string; status?: number };
        if (import.meta.env.DEV) {
          console.error(`[AI Service] Gemini API error (attempt ${attempt + 1}):`, err?.message || error);
        }
        
        // Categorize error for better user feedback (Phase 7)
        if (err?.message?.includes('quota') || err?.status === 429) {
          throw new Error('GEMINI_QUOTA_EXCEEDED');
        }
        if (err?.message?.includes('API key') || err?.message?.includes('invalid')) {
          throw new Error('GEMINI_API_ERROR');
        }
        if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
          throw new Error('GEMINI_NETWORK_ERROR');
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        } else {
          // Last retry failed - rethrow for fallback handling
          throw error;
        }
      }
    }

    return null;
  }

  private async callOpenAI(prompt: string): Promise<Partial<EnhancedAIResponse> | null> {
    if (!this.openai) return null;

    try {
      const completion = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant. Provide evidence-based health suggestions in JSON format. Always include appropriate medical disclaimers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.ai.openai.maxTokens,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        // Try to parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            suggestions: parsed,
            warnings: parsed.warnings || []
          };
        }
      }

      return null;
    } catch (error) {
      if (import.meta.env.DEV) console.error('OpenAI API error:', error);
      return null;
    }
  }

  private getFallbackSuggestions(request: EnhancedAIRequest): EnhancedAIResponse {
    const { riskLevel } = request;

    const baseSuggestions = {
      medicines: [
        'Omega-3 fatty acids (fish oil supplements)',
        'Coenzyme Q10 for heart health',
        'Magnesium supplements (consult doctor for dosage)',
        'Vitamin D3 if deficient',
        'Low-dose aspirin (only if recommended by doctor)'
      ],
      ayurveda: [
        'Arjuna bark powder (1-2 tsp with warm water)',
        'Garlic cloves (2-3 daily on empty stomach)',
        'Turmeric with black pepper in warm milk',
        'Triphala for digestive health',
        'Ashwagandha for stress management'
      ],
      yoga: [
        'Shavasana (Corpse Pose) for relaxation',
        'Anulom Vilom (Alternate Nostril Breathing)',
        'Bhramari Pranayama (Humming Bee Breath)',
        'Gentle Surya Namaskara (Sun Salutations)',
        'Meditation for 10-15 minutes daily'
      ],
      diet: [
        'Increase fruits and vegetables (5-7 servings daily)',
        'Choose whole grains over refined grains',
        'Include fatty fish 2-3 times per week',
        'Limit sodium intake to less than 2300mg daily',
        'Stay hydrated with 8-10 glasses of water daily'
      ]
    };

    let warnings: string[] = [];

    if (riskLevel === 'high' || riskLevel === 'critical') {
      warnings = [
        'HIGH RISK: Consult a cardiologist immediately',
        'Do not start any new supplements without medical supervision',
        'Avoid intense physical activities until cleared by doctor',
        'Monitor blood pressure and heart rate regularly'
      ];
    } else if (riskLevel === 'medium') {
      warnings = [
        'Regular medical check-ups recommended',
        'Start new activities gradually',
        'Monitor your response to dietary changes'
      ];
    }

    return {
      suggestions: baseSuggestions,
      warnings,
      disclaimer: this.getMedicalDisclaimer(),
      source: 'fallback'
    };
  }

  private getMedicalDisclaimer(): string {
    return `
    MEDICAL DISCLAIMER: This information is for educational purposes only and should not replace professional medical advice. 
    Always consult with qualified healthcare providers before making any changes to your medication, diet, or exercise routine. 
    In case of chest pain, shortness of breath, or other emergency symptoms, seek immediate medical attention.
    Emergency: Call your local emergency number immediately.
    `;
  }

  // Method to check if AI services are available
  isAIAvailable(): boolean {
    return !!(this.gemini || this.openai);
  }

  // Method to get available AI providers
  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.gemini) providers.push('Google Gemini');
    if (this.openai) providers.push('OpenAI GPT');
    if (providers.length === 0) providers.push('Rule-based fallback');
    return providers;
  }
}

export const enhancedAiService = new EnhancedAIService();