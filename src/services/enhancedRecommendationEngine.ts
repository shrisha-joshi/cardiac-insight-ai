/**
 * ENHANCED RECOMMENDATION ENGINE - Using Multiple FREE Resources
 * 
 * This service provides:
 * 1. Multiple personalized recommendations based on patient data
 * 2. Risk-specific guidance (not just one recommendation)
 * 3. Actionable, detailed medical advice
 * 4. Indian population-specific recommendations
 * 5. Evidence-based recommendations from 11+ FREE APIs
 * 6. Maximum accuracy using FREE resources (NO COST)
 * 
 * FREE Resources Used (11+ APIs):
 * ✅ MedlinePlus Connect (Consumer health education)
 * ✅ PubMed API (Latest research - unlimited)
 * ✅ RxNorm API (Drug normalization)
 * ✅ openFDA (Adverse events, drug safety)
 * ✅ USDA FoodData Central (Complete nutrition data)
 * ✅ wger Workout Manager (Exercise database)
 * ✅ Yoga API (Yoga poses & sequences)
 * ✅ ClinicalTrials.gov (Ongoing studies)
 * ✅ WHO ICD-11 (Disease classification)
 * ✅ Google Gemini (Personalization - 60 req/min free)
 * ✅ DeepSeek API (Alternative AI - no cost)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PatientData } from '@/lib/mockData';
import { config } from '@/lib/config';
import { freeResourcesIntegration } from './freeResourcesIntegration';
import { deepseekIntegration } from './deepseekIntegration';
import { comprehensiveFreeAPIs } from './comprehensiveFreeAPIs';

interface RecommendationSet {
  urgentActions: string[];
  lifestyleChanges: string[];
  medicationSuggestions: string[];
  monitoringPlan: string[];
  dietaryAdvice: string[];
  exerciseProgram: string[];
  stressManagement: string[];
  indianSpecificAdvice: string[];
}

class EnhancedRecommendationEngine {
  private readonly gemini: GoogleGenerativeAI | null = null;
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

  constructor() {
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey) {
      this.gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey);
      this.model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  /**
   * Generate comprehensive recommendations using FREE resources
   * Combines: 11+ FREE APIs + Gemini + DeepSeek + Rule-based
   */
  async generateComprehensiveRecommendations(
    riskScore: number,
    riskLevel: string,
    data: PatientData
  ): Promise<string[]> {
    try {
      if (import.meta.env.DEV) console.log('🌐 Generating recommendations from 11+ FREE APIs...');
      
      // Collect all recommendations from different sources
      const allResourceRecs = await this.collectAllRecommendations(riskScore, riskLevel, data);

      // Deduplicate
      const formattedRecs = this.deduplicateRecommendations(allResourceRecs);

      // Add personalized recommendations from Gemini
      let geminiRecs: string[] = [];
      if (this.model) {
        geminiRecs = await this.getGeminiPersonalizedRecs(riskScore, riskLevel, data);
      }

      // Add rule-based fallback recommendations
      const ruleBasedRecs = this.getRuleBasedRecommendations(riskScore, riskLevel, data);

      // Merge all sources
      const allRecs = [...formattedRecs, ...geminiRecs, ...ruleBasedRecs];
      
      // Deduplicate
      const finalRecs = this.deduplicateRecommendations(allRecs);

      if (import.meta.env.DEV) console.log(`✅ Generated ${finalRecs.length} recommendations from 11+ FREE APIs + Gemini + DeepSeek`);
      
      return finalRecs.slice(0, 20); // Return max 20 comprehensive recommendations
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Error in recommendation generation:', error);
      return this.getRuleBasedRecommendations(riskScore, riskLevel, data);
    }
  }

  /**
   * Collect recommendations from all free resource APIs
   */
  private async collectAllRecommendations(
    riskScore: number,
    riskLevel: string,
    data: PatientData
  ): Promise<string[]> {
    const conditions = this.extractConditions(data);
    const riskFactors = this.extractRiskFactors(data);

    // Get recommendations from comprehensive FREE APIs
    const comprehensiveAPIRecs = await comprehensiveFreeAPIs.generateComprehensiveRecommendations(
      riskScore,
      riskLevel,
      data.age,
      conditions,
      riskFactors
    );

    // Get recommendations from existing free resources (WHO, ICC, PubMed legacy)
    const freeResourceRecs = await freeResourcesIntegration.generateMaxAccuracyRecommendations(
      riskScore,
      riskLevel,
      data.age,
      conditions,
      riskFactors
    );

    // Add DeepSeek recommendations for additional perspective
    const deepseekRecs = await deepseekIntegration.generateMedicalRecommendations(
      riskScore,
      riskLevel,
      data.age,
      conditions,
      riskFactors
    );

    // Convert and merge all recommendations
    return this.mergeRecommendationSources(
      comprehensiveAPIRecs,
      freeResourceRecs,
      deepseekRecs
    );
  }

  /**
   * Extract conditions from patient data
   */
  private extractConditions(data: PatientData): string[] {
    const conditions: string[] = [];
    if (data.smoking) conditions.push('smoking');
    if (data.diabetes) conditions.push('diabetes');
    if (data.systolicBP && data.systolicBP > 140) conditions.push('hypertension');
    if (data.cholesterol && data.cholesterol > 240) conditions.push('dyslipidemia');
    return conditions;
  }

  /**
   * Extract risk factors from patient data
   */
  private extractRiskFactors(data: PatientData): string[] {
    const riskFactors: string[] = [];
    if (data.smoking) riskFactors.push('smoking');
    if (data.diabetes) riskFactors.push('diabetes');
    if (data.age > 60) riskFactors.push('advanced age');
    if (data.familyHistory) riskFactors.push('family history');
    return riskFactors;
  }

  /**
   * Merge recommendations from different sources
   */
  private mergeRecommendationSources(
    comprehensiveAPIRecs: string[],
    freeResourceRecs: unknown[],
    deepseekRecs: unknown[]
  ): string[] {
    // Convert free resource recommendations to strings
    const freeResourceStrings = (freeResourceRecs as { recommendation: string; evidenceSource: string }[]).map(
      rec => `${rec.recommendation} [Source: ${rec.evidenceSource}]`
    );

    let allResourceRecs: string[] = [
      ...comprehensiveAPIRecs,  // From 11+ FREE APIs
      ...freeResourceStrings     // From WHO, ICC, PubMed legacy
    ];

    // Add DeepSeek recommendations if available
    if (deepseekRecs && Array.isArray(deepseekRecs) && deepseekRecs.length > 0) {
      const deepseekFormatted = (deepseekRecs as { recommendation: string; confidence: string }[]).map(
        rec => `${rec.recommendation} [DEEPSEEK: ${rec.confidence}]`
      );
      allResourceRecs = [...allResourceRecs, ...deepseekFormatted];
    }

    return allResourceRecs;
  }

  /**
   * Deduplicate recommendations
   */
  private deduplicateRecommendations(recs: string[]): string[] {
    const seen = new Set<string>();
    return recs.filter(rec => {
      const key = rec.substring(0, 50).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Rule-based recommendations (fallback)
   */
  private getRuleBasedRecommendations(
    riskScore: number,
    riskLevel: string,
    data: PatientData
  ): string[] {
    const recommendations: string[] = [];

    // Add recommendations by category
    this.addUrgentActions(recommendations, riskLevel);
    this.addSmokingInterventions(recommendations, data.smoking);
    this.addCholesterolManagement(recommendations, data.cholesterol);
    this.addBloodPressureManagement(recommendations, data.systolicBP);
    this.addDiabetesManagement(recommendations, data.diabetes, data.diabetesMedication, data.age);
    this.addExerciseProgramming(recommendations, data.physicalActivity);
    this.addStressManagement(recommendations, data.stressLevel);
    this.addSleepOptimization(recommendations, data.sleepHours);
    this.addFamilyHistoryRecommendations(recommendations, data.hasPositiveFamilyHistory, data.age);
    this.addMonitoringAndIndianSpecific(recommendations);

    // Remove duplicates and limit to 15
    const unique = Array.from(new Set(recommendations));
    return unique.slice(0, 15);
  }

  /**
   * Add urgent actions based on risk level
   */
  private addUrgentActions(recommendations: string[], riskLevel: string): void {
    if (riskLevel === 'high') {
      recommendations.push(
        '🔴 URGENT: Schedule comprehensive cardiac evaluation with cardiologist within 1 week',
        '🚑 Emergency action: Call 108 (India) if you experience chest pain, shortness of breath, or severe fatigue'
      );
    } else if (riskLevel === 'medium') {
      recommendations.push(
        '🟡 Schedule cardiac check-up with your doctor within 2-4 weeks',
        '📋 Request: ECG, stress test, and lipid panel from your healthcare provider'
      );
    } else {
      recommendations.push('🟢 Continue annual heart health screening and preventive care');
    }
  }

  /**
   * Add smoking intervention recommendations
   */
  private addSmokingInterventions(recommendations: string[], smoking: boolean): void {
    if (smoking) {
      recommendations.push(
        '🚭 PRIORITY: Quit smoking immediately - reduces risk by 20% in 1 year, 50% in 5 years',
        '💊 Smoking Cessation: Ask doctor about Varenicline (Chantix) or Nicotine Replacement Therapy (NRT)',
        '📱 Download: Free smoking quit apps (QuitGuide, Smokefree, or regional Indian apps)'
      );
    }
  }

  /**
   * Add cholesterol management recommendations
   */
  private addCholesterolManagement(recommendations: string[], cholesterol?: number): void {
    if (!cholesterol) return;

    if (cholesterol > 240) {
      recommendations.push(
        '💊 Cholesterol: Discuss high-intensity statin therapy (Atorvastatin 40-80mg or Rosuvastatin 20-40mg daily)',
        '🎯 Target LDL: <70 mg/dL if high-risk, <100 mg/dL if medium-risk',
        '🍎 Diet: Mediterranean or DASH diet - reduce saturated fats, increase oily fish (salmon, mackerel) 2x/week'
      );
    } else if (cholesterol > 200) {
      recommendations.push(
        '💊 Cholesterol: Consider moderate-intensity statin (Atorvastatin 20-40mg daily)',
        '🥗 Dietary approach: Increase fiber (oats, beans), reduce trans fats'
      );
    }
  }

  /**
   * Add blood pressure management recommendations
   */
  private addBloodPressureManagement(recommendations: string[], systolicBP?: number): void {
    if (!systolicBP) return;

    if (systolicBP > 160) {
      recommendations.push(
        '🩸 URGENT BP: Blood pressure is dangerously high - seek immediate medical attention',
        '💊 Medication: May need ACE inhibitor (Lisinopril, Enalapril) + ARB (Losartan) + Diuretic combination'
      );
    } else if (systolicBP > 140) {
      recommendations.push(
        '🩸 Blood Pressure: Discuss dual-therapy (ACE-I + Diuretic or ARB + Diuretic)',
        '🧂 Sodium Reduction: Limit salt intake to <2300mg/day (1 teaspoon), use potassium salt alternatives',
        '🏃 DASH Diet: Fruits, vegetables, whole grains, lean protein - proven to lower BP by 11 mmHg'
      );
    } else if (systolicBP > 130) {
      recommendations.push('🩸 Pre-hypertension: Lifestyle modifications can prevent progression - daily exercise is crucial');
    }
  }

  /**
   * Add diabetes management recommendations
   */
  private addDiabetesManagement(
    recommendations: string[],
    diabetes: boolean,
    diabetesMedication?: string,
    age?: number
  ): void {
    if (!diabetes) return;

    const diabetesRecs: string[] = [];

    if (!diabetesMedication || diabetesMedication === 'none') {
      diabetesRecs.push(
        '🔬 Diabetes: Discuss Metformin 500mg 2x daily as first-line therapy',
        '📊 Add SGLT2 inhibitor if eGFR >20 (renal protective: Dapagliflozin, Empagliflozin)'
      );
    }

    diabetesRecs.push(
      '🩸 Target HbA1c: <7% (if tolerated), monitor fasting blood sugar weekly',
      '👣 Diabetes care: Annual foot checks, eye exams, kidney function tests'
    );

    if (age && age < 50) {
      diabetesRecs.push('⚠️ Early-onset diabetes: Higher CVD risk in Indians - very aggressive risk factor modification needed');
    }

    recommendations.push(...diabetesRecs);
  }

  /**
   * Add exercise programming recommendations
   */
  private addExerciseProgramming(recommendations: string[], physicalActivity?: string): void {
    if (physicalActivity === 'low' || !physicalActivity) {
      recommendations.push(
        '🏃 START EXERCISE: Minimum 150 min moderate-intensity aerobic activity per week (brisk walking)',
        '💪 Strength training: 2 sessions/week targeting major muscle groups (resistance training)',
        '📅 Exercise plan: Start slow (10-15 min daily), gradually increase to 30 min daily',
        '🚴 Options: Brisk walking, swimming, cycling, jogging, or yoga - choose what you enjoy'
      );
    } else if (physicalActivity === 'moderate') {
      recommendations.push(
        '🏃 Increase intensity: Aim for 150+ minutes of vigorous-intensity activity OR 300+ minutes moderate',
        '🏋️ Add strength training: 2 sessions/week for better metabolic health'
      );
    }
  }

  /**
   * Add stress management recommendations
   */
  private addStressManagement(recommendations: string[], stressLevel?: number): void {
    if (!stressLevel) return;

    if (stressLevel > 7) {
      recommendations.push(
        '🧘 Stress Management: 20-30 min daily meditation/yoga (proven to lower BP and inflammation)',
        '🫁 Breathing exercises: Box breathing (4-4-4-4) for immediate stress relief',
        '💬 Mental health: Consider counseling or cardiac rehabilitation psychology program'
      );
    } else if (stressLevel > 5) {
      recommendations.push('🧘 Stress reduction: Regular meditation (Headspace, Calm, or local yoga classes)');
    }
  }

  /**
   * Add sleep optimization recommendations
   */
  private addSleepOptimization(recommendations: string[], sleepHours?: number): void {
    if (sleepHours && (sleepHours < 6 || sleepHours > 9)) {
      recommendations.push(
        '😴 Sleep: Aim for 7-8 hours nightly - poor sleep increases inflammation and BP',
        '🛌 Sleep hygiene: Consistent bedtime, dark room, no screens 1 hour before sleep'
      );
    }
  }

  /**
   * Add family history recommendations
   */
  private addFamilyHistoryRecommendations(
    recommendations: string[],
    hasPositiveFamilyHistory?: boolean,
    age?: number
  ): void {
    if (hasPositiveFamilyHistory && age && age < 50) {
      recommendations.push(
        '👨‍👩‍👧 Family history: Genetic screening recommended - discuss with cardiologist',
        '🧬 Genetic factors: May benefit from advanced risk assessment (CAC scoring)'
      );
    }
  }

  /**
   * Add monitoring and Indian-specific recommendations
   */
  private addMonitoringAndIndianSpecific(recommendations: string[]): void {
    recommendations.push(
      '📊 Home monitoring: Check BP daily, weight weekly, note any symptoms',
      '🔄 Follow-up: Reassess in 3 months after implementing changes',
      '🥘 Indian diet: Increase turmeric (anti-inflammatory), add garlic, reduce ghee/coconut oil',
      '🌶️ Spices: Use cumin, coriander, ginger - beneficial for cardiac health',
      '🏥 Regular testing: Annual lipid panel, fasting glucose, and kidney function tests'
    );
  }

  /**
   * Get personalized Gemini recommendations
   */
  private async getGeminiPersonalizedRecs(
    riskScore: number,
    riskLevel: string,
    data: PatientData
  ): Promise<string[]> {
    try {
      if (!this.model) return [];

      const prompt = `As a cardiac health specialist, provide 5 specific, personalized recommendations for:
      - Age: ${data.age}, Gender: ${data.gender}
      - Risk Score: ${riskScore}% (${riskLevel})
      - Smoking: ${data.smoking ? 'Yes' : 'No'}
      - Diabetes: ${data.diabetes ? 'Yes' : 'No'}
      
      Be specific: include dosages, targets, timelines. 
      For Indian patient: include traditional remedies.
      Format: Start with emoji, then specific action.
      One recommendation per line.`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      const recs = text.split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 10)
        .slice(0, 5);

      return recs;
    } catch (error) {
      if (import.meta.env.DEV) console.log('Gemini personalized recommendations failed:', error);
      return [];
    }
  }

  /**
   * Generate recommendations by category
   */
  async generateCategorizedRecommendations(
    riskScore: number,
    riskLevel: string,
    data: PatientData
  ): Promise<RecommendationSet> {
    const allRecs = await this.generateComprehensiveRecommendations(riskScore, riskLevel, data);

    return {
      urgentActions: allRecs.filter(r => r.includes('URGENT') || r.includes('🔴') || r.includes('🚑')),
      lifestyleChanges: allRecs.filter(r => r.includes('🏃') || r.includes('💪') || r.includes('😴')),
      medicationSuggestions: allRecs.filter(r => r.includes('💊') || r.includes('🔬')),
      monitoringPlan: allRecs.filter(r => r.includes('📊') || r.includes('🩸') || r.includes('🔄')),
      dietaryAdvice: allRecs.filter(r => r.includes('🥗') || r.includes('🍎') || r.includes('🥘')),
      exerciseProgram: allRecs.filter(r => r.includes('🏃') || r.includes('💪') || r.includes('🚴')),
      stressManagement: allRecs.filter(r => r.includes('🧘') || r.includes('🫁') || r.includes('💬')),
      indianSpecificAdvice: allRecs.filter(r => r.includes('🥘') || r.includes('🌶️') || r.includes('🏥'))
    };
  }
}

export const enhancedRecommendationEngine = new EnhancedRecommendationEngine();
