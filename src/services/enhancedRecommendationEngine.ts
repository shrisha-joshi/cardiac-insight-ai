/**
 * ENHANCED RECOMMENDATION ENGINE - Using Multiple FREE Resources
 * 
 * This service provides:
 * 1. Multiple personalized recommendations based on patient data
 * 2. Risk-specific guidance (not just one recommendation)
 * 3. Actionable, detailed medical advice
 * 4. Indian population-specific recommendations
 * 5. Evidence-based recommendations from WHO, ICC, PubMed, Gemini, DeepSeek
 * 6. Maximum accuracy using FREE resources (NO COST)
 * 
 * FREE Resources Used:
 * ✅ PubMed API (Latest research - unlimited)
 * ✅ WHO Guidelines (Global standards)
 * ✅ ICC Guidelines (Indian population specific)
 * ✅ Google Gemini (Personalization - 60 req/min free)
 * ✅ DeepSeek API (Alternative AI - no cost)
 * ✅ FDA Database (Drug information)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PatientData } from '@/lib/mockData';
import { config } from '@/lib/config';
import { freeResourcesIntegration } from './freeResourcesIntegration';
import { deepseekIntegration } from './deepseekIntegration';

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
  private gemini: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey) {
      this.gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey);
      this.model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  /**
   * Generate comprehensive recommendations using FREE resources
   * Combines: WHO + ICC + PubMed + Gemini + DeepSeek + Rule-based
   */
  async generateComprehensiveRecommendations(
    riskScore: number,
    riskLevel: string,
    data: PatientData
  ): Promise<string[]> {
    try {
      console.log('🔍 Generating recommendations from FREE resources (including DeepSeek)...');
      
      // Use free resources integration for maximum accuracy
      const conditions = [];
      if (data.smoking) conditions.push('smoking');
      if (data.diabetes) conditions.push('diabetes');
      if (data.systolicBP > 140) conditions.push('hypertension');
      if (data.cholesterol > 240) conditions.push('dyslipidemia');

      const riskFactors = [];
      if (data.smoking) riskFactors.push('smoking');
      if (data.diabetes) riskFactors.push('diabetes');
      if (data.age > 60) riskFactors.push('advanced age');
      if (data.familyHistory) riskFactors.push('family history');

      // Get recommendations from all FREE resources (including DeepSeek)
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

      // Convert all recommendations to string format
      const freeResourceStrings = freeResourceRecs.map(rec => 
        `${rec.recommendation} [Source: ${rec.evidenceSource}]`
      );

      // Merge DeepSeek recommendations
      let allResourceRecs: string[] = [...freeResourceStrings];
      if (deepseekRecs && deepseekRecs.length > 0) {
        const deepseekFormatted = deepseekRecs.map(rec => 
          `${rec.recommendation} [DEEPSEEK: ${rec.confidence}]`
        );
        allResourceRecs = [...allResourceRecs, ...deepseekFormatted];
      }

      // Deduplicate all resource recommendations
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

      console.log(`✅ Generated ${finalRecs.length} recommendations from FREE resources (WHO, ICC, PubMed, Gemini, DeepSeek)`);
      
      return finalRecs.slice(0, 15); // Return max 15 recommendations
    } catch (error) {
      console.warn('Error in recommendation generation:', error);
      return this.getRuleBasedRecommendations(riskScore, riskLevel, data);
    }
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

    // ===== URGENT ACTIONS (based on risk level) =====
    if (riskLevel === 'high') {
      recommendations.push('🔴 URGENT: Schedule comprehensive cardiac evaluation with cardiologist within 1 week');
      recommendations.push('🚑 Emergency action: Call 108 (India) if you experience chest pain, shortness of breath, or severe fatigue');
    } else if (riskLevel === 'medium') {
      recommendations.push('🟡 Schedule cardiac check-up with your doctor within 2-4 weeks');
      recommendations.push('📋 Request: ECG, stress test, and lipid panel from your healthcare provider');
    } else {
      recommendations.push('🟢 Continue annual heart health screening and preventive care');
    }

    // ===== SMOKING INTERVENTIONS =====
    if (data.smoking) {
      recommendations.push('🚭 PRIORITY: Quit smoking immediately - reduces risk by 20% in 1 year, 50% in 5 years');
      recommendations.push('💊 Smoking Cessation: Ask doctor about Varenicline (Chantix) or Nicotine Replacement Therapy (NRT)');
      recommendations.push('📱 Download: Free smoking quit apps (QuitGuide, Smokefree, or regional Indian apps)');
    }

    // ===== CHOLESTEROL MANAGEMENT =====
    if (data.cholesterol && data.cholesterol > 240) {
      recommendations.push('💊 Cholesterol: Discuss high-intensity statin therapy (Atorvastatin 40-80mg or Rosuvastatin 20-40mg daily)');
      recommendations.push('🎯 Target LDL: <70 mg/dL if high-risk, <100 mg/dL if medium-risk');
      recommendations.push('🍎 Diet: Mediterranean or DASH diet - reduce saturated fats, increase oily fish (salmon, mackerel) 2x/week');
    } else if (data.cholesterol && data.cholesterol > 200) {
      recommendations.push('💊 Cholesterol: Consider moderate-intensity statin (Atorvastatin 20-40mg daily)');
      recommendations.push('🥗 Dietary approach: Increase fiber (oats, beans), reduce trans fats');
    }

    // ===== BLOOD PRESSURE MANAGEMENT =====
    if (data.systolicBP && data.systolicBP > 160) {
      recommendations.push('🩸 URGENT BP: Blood pressure is dangerously high - seek immediate medical attention');
      recommendations.push('💊 Medication: May need ACE inhibitor (Lisinopril, Enalapril) + ARB (Losartan) + Diuretic combination');
    } else if (data.systolicBP && data.systolicBP > 140) {
      recommendations.push('🩸 Blood Pressure: Discuss dual-therapy (ACE-I + Diuretic or ARB + Diuretic)');
      recommendations.push('🧂 Sodium Reduction: Limit salt intake to <2300mg/day (1 teaspoon), use potassium salt alternatives');
      recommendations.push('🏃 DASH Diet: Fruits, vegetables, whole grains, lean protein - proven to lower BP by 11 mmHg');
    } else if (data.systolicBP && data.systolicBP > 130) {
      recommendations.push('🩸 Pre-hypertension: Lifestyle modifications can prevent progression - daily exercise is crucial');
    }

    // ===== DIABETES MANAGEMENT =====
    if (data.diabetes) {
      if (!data.diabetesMedication || data.diabetesMedication === 'none') {
        recommendations.push('🔬 Diabetes: Discuss Metformin 500mg 2x daily as first-line therapy');
        recommendations.push('📊 Add SGLT2 inhibitor if eGFR >20 (renal protective: Dapagliflozin, Empagliflozin)');
      }
      recommendations.push('🩸 Target HbA1c: <7% (if tolerated), monitor fasting blood sugar weekly');
      recommendations.push('👣 Diabetes care: Annual foot checks, eye exams, kidney function tests');
      if (data.age < 50) {
        recommendations.push('⚠️ Early-onset diabetes: Higher CVD risk in Indians - very aggressive risk factor modification needed');
      }
    }

    // ===== EXERCISE PROGRAMMING =====
    if (data.physicalActivity === 'low' || !data.physicalActivity) {
      recommendations.push('🏃 START EXERCISE: Minimum 150 min moderate-intensity aerobic activity per week (brisk walking)');
      recommendations.push('💪 Strength training: 2 sessions/week targeting major muscle groups (resistance training)');
      recommendations.push('📅 Exercise plan: Start slow (10-15 min daily), gradually increase to 30 min daily');
      recommendations.push('🚴 Options: Brisk walking, swimming, cycling, jogging, or yoga - choose what you enjoy');
    } else if (data.physicalActivity === 'moderate') {
      recommendations.push('🏃 Increase intensity: Aim for 150+ minutes of vigorous-intensity activity OR 300+ minutes moderate');
      recommendations.push('🏋️ Add strength training: 2 sessions/week for better metabolic health');
    }

    // ===== STRESS MANAGEMENT =====
    if (data.stressLevel && data.stressLevel > 7) {
      recommendations.push('🧘 Stress Management: 20-30 min daily meditation/yoga (proven to lower BP and inflammation)');
      recommendations.push('🫁 Breathing exercises: Box breathing (4-4-4-4) for immediate stress relief');
      recommendations.push('💬 Mental health: Consider counseling or cardiac rehabilitation psychology program');
    } else if (data.stressLevel && data.stressLevel > 5) {
      recommendations.push('🧘 Stress reduction: Regular meditation (Headspace, Calm, or local yoga classes)');
    }

    // ===== SLEEP OPTIMIZATION =====
    if (data.sleepHours && (data.sleepHours < 6 || data.sleepHours > 9)) {
      recommendations.push('😴 Sleep: Aim for 7-8 hours nightly - poor sleep increases inflammation and BP');
      recommendations.push('🛌 Sleep hygiene: Consistent bedtime, dark room, no screens 1 hour before sleep');
    }

    // ===== FAMILY HISTORY =====
    if (data.hasPositiveFamilyHistory && data.age < 50) {
      recommendations.push('👨‍👩‍👧 Family history: Genetic screening recommended - discuss with cardiologist');
      recommendations.push('🧬 Genetic factors: May benefit from advanced risk assessment (CAC scoring)');
    }

    // ===== MONITORING & FOLLOW-UP =====
    recommendations.push('📊 Home monitoring: Check BP daily, weight weekly, note any symptoms');
    recommendations.push('🔄 Follow-up: Reassess in 3 months after implementing changes');

    // ===== INDIAN POPULATION SPECIFIC =====
    recommendations.push('🥘 Indian diet: Increase turmeric (anti-inflammatory), add garlic, reduce ghee/coconut oil');
    recommendations.push('🌶️ Spices: Use cumin, coriander, ginger - beneficial for cardiac health');
    recommendations.push('🏥 Regular testing: Annual lipid panel, fasting glucose, and kidney function tests');

    // Remove duplicates and limit to 15
    const unique = Array.from(new Set(recommendations));
    return unique.slice(0, 15);
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
      console.log('Gemini personalized recommendations failed:', error);
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
