/**
 * Recommendation Engine
 * 
 * Orchestrates multiple AI providers (Gemini, OpenAI) with comprehensive fallback system.
 * Implements three-tier strategy:
 * 1. Primary: Google Gemini API (if available)
 * 2. Secondary: OpenAI GPT-4 (if available)
 * 3. Fallback: Rule-based recommendations (always available)
 * 
 * Ensures users always get recommendations, even without API keys.
 * Handles errors, timeouts, rate limits with graceful degradation.
 */

import { config } from '../lib/config';
import { geminiService } from './geminiService';
import { openaiService } from './openaiService';
import type { PatientData } from '../lib/mockData';

/**
 * Types for recommendation engine
 */
export interface RecommendationRequest {
  patientData: PatientData;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  types?: ('medicines' | 'ayurveda' | 'yoga' | 'diet' | 'comprehensive')[];
}

export interface RecommendationItem {
  category: string;
  recommendation: string;
  priority?: 'high' | 'medium' | 'low';
  evidence?: string;
}

export interface RecommendationResponse {
  medicines: RecommendationItem[];
  ayurveda: RecommendationItem[];
  yoga: RecommendationItem[];
  diet: RecommendationItem[];
  comprehensive?: string;
  provider: 'gemini' | 'openai' | 'fallback';
  disclaimer: string;
  timestamp: string;
  confidence: number; // 0.0 to 1.0, higher for API-based, lower for rule-based
}

/**
 * Provider status for diagnostic purposes
 */
export interface ProviderStatus {
  gemini: {
    available: boolean;
    reason?: string;
  };
  openai: {
    available: boolean;
    reason?: string;
  };
  fallback: {
    available: boolean;
  };
}

/**
 * Get provider availability status
 */
export async function getProviderStatus(): Promise<ProviderStatus> {
  return {
    gemini: {
      available: config.ai.gemini.enabled && !!config.ai.gemini.apiKey,
      reason: !config.ai.gemini.enabled
        ? 'Gemini disabled in config'
        : !config.ai.gemini.apiKey
          ? 'No Gemini API key configured'
          : undefined,
    },
    openai: {
      available: config.ai.openai.enabled && !!config.ai.openai.apiKey,
      reason: !config.ai.openai.enabled
        ? 'OpenAI disabled in config'
        : !config.ai.openai.apiKey
          ? 'No OpenAI API key configured'
          : undefined,
    },
    fallback: {
      available: true,
    },
  };
}

/**
 * Get recommendations using best available provider
 * Tries: Gemini → OpenAI → Fallback
 */
export async function getRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const timestamp = new Date().toISOString();
  const riskLevelLower = request.riskLevel.toLowerCase() as 'low' | 'medium' | 'high';

  try {
    // Try Gemini first (primary provider)
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey && geminiService.isAvailable()) {
      try {
        console.log('[RecommendationEngine] Attempting to use Gemini...');
        
        // Request medicines from Gemini
        const geminiResult = await geminiService.getRecommendations({
          patientData: request.patientData,
          riskLevel: riskLevelLower,
          recommendationType: 'medicines',
        });

        if (geminiResult.source === 'gemini') {
          // Convert Gemini response to our format
          return {
            medicines: geminiResult.items?.map(item => ({
              category: 'Recommended Medicine',
              recommendation: item,
              priority: 'high' as const,
            })) || [],
            ayurveda: await getAyurvedaRecommendation(riskLevelLower),
            yoga: await getYogaRecommendation(riskLevelLower),
            diet: await getDietRecommendation(riskLevelLower, request.patientData),
            provider: 'gemini',
            disclaimer: geminiResult.disclaimer,
            timestamp,
            confidence: 0.95,
          };
        }
      } catch (geminiError) {
        console.warn('[RecommendationEngine] Gemini failed, trying OpenAI...', geminiError);
      }
    }

    // Try OpenAI second (secondary provider)
    if (config.ai.openai.enabled && config.ai.openai.apiKey && openaiService.isAvailable()) {
      try {
        console.log('[RecommendationEngine] Attempting to use OpenAI...');
        
        const openaiResult = await openaiService.getRecommendations({
          riskLevel: riskLevelLower,
          patientAge: request.patientData.age,
          patientGender: request.patientData.gender,
          patientDiet: request.patientData.dietType,
          recommendationType: 'medicines',
        });

        if (openaiResult.source === 'openai') {
          return {
            medicines: openaiResult.items?.map(item => ({
              category: 'Recommended Medicine',
              recommendation: item,
              priority: 'high' as const,
            })) || [],
            ayurveda: await getAyurvedaRecommendation(riskLevelLower),
            yoga: await getYogaRecommendation(riskLevelLower),
            diet: await getDietRecommendation(riskLevelLower, request.patientData),
            provider: 'openai',
            disclaimer: openaiResult.disclaimer,
            timestamp,
            confidence: 0.90,
          };
        }
      } catch (openaiError) {
        console.warn('[RecommendationEngine] OpenAI failed, using fallback...', openaiError);
      }
    }

    // Use rule-based fallback (always works)
    console.log('[RecommendationEngine] Using rule-based fallback...');
    return getFallbackRecommendations(request, timestamp);
  } catch (error) {
    console.error('[RecommendationEngine] Unexpected error, using fallback:', error);
    return getFallbackRecommendations(request, timestamp);
  }
}

/**
 * Get Ayurveda recommendation (can use fallback or API)
 */
async function getAyurvedaRecommendation(riskLevel: 'low' | 'medium' | 'high'): Promise<RecommendationItem[]> {
  try {
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey && geminiService.isAvailable()) {
      const result = await geminiService.getRecommendations({
        patientData: {} as PatientData,
        riskLevel,
        recommendationType: 'ayurveda',
      });
      return result.items?.map(item => ({
        category: 'Ayurveda',
        recommendation: item,
        priority: 'medium' as const,
      })) || getAyurvedaFallback(riskLevel);
    }
  } catch (error) {
    console.warn('Ayurveda recommendation failed:', error);
  }
  return getAyurvedaFallback(riskLevel);
}

/**
 * Get Yoga recommendation (can use fallback or API)
 */
async function getYogaRecommendation(riskLevel: 'low' | 'medium' | 'high'): Promise<RecommendationItem[]> {
  try {
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey && geminiService.isAvailable()) {
      const result = await geminiService.getRecommendations({
        patientData: {} as PatientData,
        riskLevel,
        recommendationType: 'yoga',
      });
      return result.items?.map(item => ({
        category: 'Yoga',
        recommendation: item,
        priority: 'medium' as const,
      })) || getYogaFallback(riskLevel);
    }
  } catch (error) {
    console.warn('Yoga recommendation failed:', error);
  }
  return getYogaFallback(riskLevel);
}

/**
 * Get Diet recommendation (can use fallback or API)
 */
async function getDietRecommendation(riskLevel: 'low' | 'medium' | 'high', patientData: PatientData): Promise<RecommendationItem[]> {
  try {
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey && geminiService.isAvailable()) {
      const result = await geminiService.getRecommendations({
        patientData,
        riskLevel,
        recommendationType: 'diet',
      });
      return result.items?.map(item => ({
        category: 'Diet',
        recommendation: item,
        priority: 'high' as const,
      })) || getDietFallback(riskLevel, patientData);
    }
  } catch (error) {
    console.warn('Diet recommendation failed:', error);
  }
  return getDietFallback(riskLevel, patientData);
}

/**
 * Rule-based fallback recommendations (always available)
 */
function getFallbackRecommendations(
  request: RecommendationRequest,
  timestamp: string
): RecommendationResponse {
  const { riskLevel, patientData, types } = request;
  const recommendations: RecommendationResponse = {
    medicines: [],
    ayurveda: [],
    yoga: [],
    diet: [],
    provider: 'fallback',
    disclaimer:
      'These are rule-based recommendations and should not replace medical consultation. Please consult a cardiologist for personalized treatment.',
    timestamp,
    confidence: 0.65, // Lower confidence for rule-based
  };

  // Medicines recommendations
  if (!types || types.includes('medicines')) {
    recommendations.medicines = getMedicinesFallback(riskLevel, patientData);
  }

  // Ayurveda recommendations
  if (!types || types.includes('ayurveda')) {
    recommendations.ayurveda = getAyurvedaFallback(riskLevel);
  }

  // Yoga recommendations
  if (!types || types.includes('yoga')) {
    recommendations.yoga = getYogaFallback(riskLevel);
  }

  // Diet recommendations
  if (!types || types.includes('diet')) {
    recommendations.diet = getDietFallback(riskLevel, patientData);
  }

  // Comprehensive summary
  if (!types || types.includes('comprehensive')) {
    recommendations.comprehensive = getComprehensiveFallback(riskLevel, patientData);
  }

  return recommendations;
}

/**
 * Medicines recommendations (rule-based)
 */
function getMedicinesFallback(riskLevel: string, patientData: PatientData): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  if (riskLevel === 'High') {
    recommendations.push(
      {
        category: 'ACE Inhibitor',
        recommendation:
          'Lisinopril 10mg daily - for blood pressure control and heart protection. Start low, titrate as needed.',
        priority: 'high',
        evidence: 'HOPE trial, EUROPA trial',
      },
      {
        category: 'Beta Blocker',
        recommendation:
          'Metoprolol 50mg daily - reduces heart rate and oxygen demand. Contraindicated in asthma.',
        priority: 'high',
        evidence: 'CIBIS, MERIT-HF trials',
      },
      {
        category: 'Statin',
        recommendation:
          'Atorvastatin 40mg daily - reduces LDL cholesterol and plaque formation. Monitor liver function.',
        priority: 'high',
        evidence: '4S trial, WOSCOPS',
      },
      {
        category: 'Aspirin',
        recommendation:
          'Aspirin 75mg daily - prevents blood clots. Check for GI bleeding risk.',
        priority: 'high',
        evidence: 'ATC overview, primary prevention trials',
      }
    );

    if (patientData.cholesterol && patientData.cholesterol > 240) {
      recommendations.push({
        category: 'Additional Lipid Management',
        recommendation:
          'Consider Ezetimibe 10mg daily if LDL not controlled with Statin alone.',
        priority: 'medium',
      });
    }
  } else if (riskLevel === 'Medium') {
    recommendations.push(
      {
        category: 'ACE Inhibitor (optional)',
        recommendation:
          'Lisinopril 5mg daily - Consider if hypertensive or diabetic.',
        priority: 'medium',
      },
      {
        category: 'Statin',
        recommendation:
          'Atorvastatin 20mg daily - If cholesterol > 200 or LDL > 100.',
        priority: 'medium',
      },
      {
        category: 'Aspirin (optional)',
        recommendation:
          'Aspirin 81mg daily - Consider for primary prevention if other risk factors present.',
        priority: 'low',
      }
    );
  } else {
    // Low risk
    recommendations.push(
      {
        category: 'Healthy Lifestyle',
        recommendation:
          'Focus on diet, exercise, and stress management. Medications usually not needed at this risk level.',
        priority: 'high',
      },
      {
        category: 'Preventive Aspirin',
        recommendation:
          'Generally not recommended for primary prevention. Discuss with your doctor.',
        priority: 'low',
      }
    );
  }

  return recommendations;
}

/**
 * Ayurveda recommendations (rule-based)
 */
function getAyurvedaFallback(riskLevel: string): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  if (riskLevel === 'High') {
    recommendations.push(
      {
        category: 'Herb - Arjuna',
        recommendation:
          'Arjuna bark powder 3-5g twice daily with warm water. Strengthens heart muscle and improves circulation.',
        priority: 'high',
      },
      {
        category: 'Herb - Ashwagandha',
        recommendation:
          'Ashwagandha 500mg twice daily. Reduces stress, anxiety, and supports heart health.',
        priority: 'high',
      },
      {
        category: 'Oil Massage - Abhyanga',
        recommendation:
          'Warm sesame oil massage 3-4 times weekly. Use Brahmi or Bhringraj oil for calming effect.',
        priority: 'medium',
      },
      {
        category: 'Spices',
        recommendation:
          'Turmeric, ginger, and cardamom in daily cooking. Anti-inflammatory and improve circulation.',
        priority: 'medium',
      }
    );
  } else if (riskLevel === 'Medium') {
    recommendations.push(
      {
        category: 'Herb - Brahmi',
        recommendation:
          'Brahmi 300mg daily. Calms the nervous system and supports mental clarity.',
        priority: 'medium',
      },
      {
        category: 'Herb - Shatavari',
        recommendation:
          'Shatavari powder 3g daily with warm milk. Nourishes tissues and supports overall wellness.',
        priority: 'medium',
      },
      {
        category: 'Daily Oil',
        recommendation:
          'Use coconut or sesame oil for cooking. Light massage 2-3 times weekly.',
        priority: 'low',
      }
    );
  } else {
    recommendations.push(
      {
        category: 'Preventive Herbs',
        recommendation:
          'Incorporate turmeric, ginger, and basil into daily diet. Support natural immunity.',
        priority: 'low',
      },
      {
        category: 'Dosha Balance',
        recommendation:
          'Maintain balanced diet according to your Ayurvedic constitution (Dosha).',
        priority: 'low',
      }
    );
  }

  return recommendations;
}

/**
 * Yoga recommendations (rule-based)
 */
function getYogaFallback(riskLevel: string): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  if (riskLevel === 'High') {
    recommendations.push(
      {
        category: 'Breathing - Pranayama',
        recommendation:
          'Anulom Vilom (Alternate Nostril Breathing) - 5-10 minutes daily. Calms nervous system.',
        priority: 'high',
      },
      {
        category: 'Breathing - Pranayama',
        recommendation:
          'Ujjayi Breath - 5 minutes daily. Gentle, rhythmic breathing to calm the heart.',
        priority: 'high',
      },
      {
        category: 'Asana - Gentle',
        recommendation:
          'Child Pose (Balasana) - 2-3 minutes. Resting pose for heart relaxation.',
        priority: 'medium',
      },
      {
        category: 'Asana - Gentle',
        recommendation:
          'Supported Corpse Pose (Savasana) - 10 minutes daily. Ultimate relaxation for heart recovery.',
        priority: 'high',
      },
      {
        category: 'Meditation',
        recommendation:
          'Guided heart meditation - 10-15 minutes daily. Focus on gratitude and compassion.',
        priority: 'high',
      }
    );
  } else if (riskLevel === 'Medium') {
    recommendations.push(
      {
        category: 'Breathing - Pranayama',
        recommendation:
          'Nadi Shodhana (Alternate Nostril) - 10 minutes 5 times per week. Balances energy.',
        priority: 'high',
      },
      {
        category: 'Asana - Moderate',
        recommendation:
          'Cat-Cow Pose (Marjaryasana-Bitilasana) - 3-5 minutes. Gently mobilizes spine and chest.',
        priority: 'medium',
      },
      {
        category: 'Asana - Moderate',
        recommendation:
          'Supported Bridge Pose - 2-3 minutes. Gentle heart opener without strain.',
        priority: 'medium',
      },
      {
        category: 'Meditation',
        recommendation:
          'Loving-kindness meditation - 10 minutes 3-4 times weekly.',
        priority: 'medium',
      }
    );
  } else {
    recommendations.push(
      {
        category: 'Yoga Flow',
        recommendation:
          'Gentle Hatha or Iyengar yoga - 30-45 minutes 3 times weekly for overall fitness.',
        priority: 'medium',
      },
      {
        category: 'Breathing',
        recommendation:
          'Daily pranayama practice - 10 minutes. Choose technique you enjoy most.',
        priority: 'medium',
      },
      {
        category: 'Mindfulness',
        recommendation:
          'Daily meditation or mindfulness - 10 minutes. Maintain mental clarity.',
        priority: 'low',
      }
    );
  }

  return recommendations;
}

/**
 * Diet recommendations (rule-based)
 */
function getDietFallback(riskLevel: string, patientData: PatientData): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  if (riskLevel === 'High') {
    recommendations.push(
      {
        category: 'Primary Diet Type',
        recommendation:
          'DASH diet (Dietary Approaches to Stop Hypertension) - Low sodium, high potassium.',
        priority: 'high',
      },
      {
        category: 'Foods to Increase',
        recommendation:
          'Fatty fish (salmon, mackerel, sardines) 2-3 times weekly for omega-3 fatty acids.',
        priority: 'high',
      },
      {
        category: 'Foods to Increase',
        recommendation:
          'Leafy greens, berries, nuts, seeds, whole grains. 5+ servings of fruits/vegetables daily.',
        priority: 'high',
      },
      {
        category: 'Foods to Avoid',
        recommendation:
          'Reduce sodium to <2300mg daily (aim for <1500mg). Avoid processed foods, salt, pickles.',
        priority: 'high',
      },
      {
        category: 'Foods to Avoid',
        recommendation:
          'Limit saturated fat to <7% of calories. Avoid butter, ghee, red meat, full-fat dairy.',
        priority: 'high',
      },
      {
        category: 'Beverages',
        recommendation:
          'Reduce caffeine and alcohol. Drink 8-10 glasses of water daily. Avoid sugary drinks.',
        priority: 'medium',
      }
    );

    if (patientData.cholesterol && patientData.cholesterol > 240) {
      recommendations.push({
        category: 'Cholesterol Management',
        recommendation:
          'Increase fiber intake to 30-40g daily (oats, beans, lentils, vegetables).',
        priority: 'high',
      });
    }

    if (patientData.restingBP && patientData.restingBP > 140) {
      recommendations.push({
        category: 'Blood Pressure Management',
        recommendation:
          'Strict sodium restriction. Include potassium-rich foods: bananas, oranges, sweet potato.',
        priority: 'high',
      });
    }
  } else if (riskLevel === 'Medium') {
    recommendations.push(
      {
        category: 'Diet Type',
        recommendation:
          'Mediterranean diet - Balanced with heart-healthy fats from olive oil and nuts.',
        priority: 'high',
      },
      {
        category: 'Foods to Include',
        recommendation:
          'Fish 2 times weekly, whole grains, legumes, fresh vegetables, olive oil, nuts.',
        priority: 'high',
      },
      {
        category: 'Foods to Limit',
        recommendation:
          'Reduce sodium to <2300mg daily. Limit red meat to 2-3 times weekly.',
        priority: 'medium',
      },
      {
        category: 'Healthy Additions',
        recommendation:
          'Include garlic, turmeric, ginger, green tea for their anti-inflammatory benefits.',
        priority: 'medium',
      }
    );
  } else {
    recommendations.push(
      {
        category: 'General Nutrition',
        recommendation:
          'Balanced diet with variety - fruits, vegetables, whole grains, lean proteins.',
        priority: 'medium',
      },
      {
        category: 'Heart-Healthy Choices',
        recommendation:
          'Include fish weekly, use olive oil, eat nuts and seeds. Limit processed foods.',
        priority: 'medium',
      },
      {
        category: 'Healthy Habits',
        recommendation:
          'Stay hydrated (8 glasses water daily), limit caffeine, moderate alcohol consumption.',
        priority: 'low',
      }
    );
  }

  return recommendations;
}

/**
 * Comprehensive summary (rule-based)
 */
function getComprehensiveFallback(riskLevel: string, patientData: PatientData): string {
  const age = patientData.age || 'unknown';
  let summary = '';

  if (riskLevel === 'High') {
    summary = `Based on your clinical profile (age ${age}, risk level: HIGH), you are at significant cardiovascular risk. `;
    summary += `Immediate action is recommended:

1. MEDICAL: Schedule urgent consultation with a cardiologist. Consider stress test or angiography if not already done.

2. MEDICATIONS: Multiple medications may be needed (ACE inhibitors, beta-blockers, statins, aspirin). Start under medical supervision.

3. LIFESTYLE: 
   - Strict diet adherence (DASH diet, <2300mg sodium daily)
   - Avoid stress and strenuous exercise initially
   - Quit smoking immediately if applicable
   - Limit alcohol consumption

4. MONITORING: Daily blood pressure checks, weekly weight monitoring, monthly follow-ups with doctor.

5. EMERGENCY: Know signs of heart attack (chest pain, shortness of breath, arm pain) and keep emergency numbers handy.

Your goal: Reduce risk factors over 3-6 months through medication + lifestyle changes to move to Medium or Low risk category.`;
  } else if (riskLevel === 'Medium') {
    summary = `Based on your clinical profile (age ${age}, risk level: MEDIUM), you have moderate cardiovascular risk. `;
    summary += `Preventive measures are important:

1. MEDICAL: Annual cardiologist check-ups. Discuss medication options (may need statins/ACE inhibitors).

2. MEDICATIONS: Depends on individual factors. Some may benefit from preventive therapy.

3. LIFESTYLE:
   - Mediterranean or DASH diet recommended
   - Regular moderate exercise (30 minutes, 5 days/week)
   - Stress management (yoga, meditation)
   - Weight management if overweight

4. MONITORING: Annual check-ups, regular blood pressure/cholesterol checks (every 3-6 months).

5. GOALS: Maintain current status or improve to Low risk through lifestyle optimization.`;
  } else {
    summary = `Based on your clinical profile (age ${age}, risk level: LOW), your cardiovascular risk is currently low. `;
    summary += `Maintain prevention:

1. MEDICAL: Regular check-ups (annually). No urgent interventions needed unless other factors change.

2. MEDICATIONS: Generally not needed at this risk level. Discuss with doctor based on individual factors.

3. LIFESTYLE (MAINTAIN):
   - Continue balanced diet with heart-healthy choices
   - Regular physical activity (30 minutes, 5 days/week)
   - Stress management practices
   - Avoid smoking and excessive alcohol

4. MONITORING: Annual comprehensive health check-ups, regular exercise tracking.

5. GOALS: Maintain low-risk status through consistent healthy habits.`;
  }

  summary += `

IMPORTANT DISCLAIMER: These recommendations are AI-generated and for educational purposes only. They should not replace professional medical consultation. Always consult with a qualified healthcare provider (cardiologist preferred) for personalized diagnosis and treatment plans. In case of emergency symptoms (chest pain, severe shortness of breath), call emergency services (911 in US, 999 in UK, 108 in India) immediately.`;

  return summary;
}

export default {
  getRecommendations,
  getProviderStatus,
};
