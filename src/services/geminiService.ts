/**
 * Google Gemini AI Service
 * 
 * Provides personalized health recommendations using Google's Generative AI (Gemini)
 * Includes prompt engineering for medical context, error handling, and fallback
 * 
 * Created: November 4, 2025
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/lib/config';
import { PatientData, PredictionResult } from '@/lib/mockData';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface GeminiRecommendationRequest {
  riskLevel: 'low' | 'medium' | 'high';
  patientData: PatientData;
  recommendationType: 'medicines' | 'ayurveda' | 'yoga' | 'diet' | 'comprehensive';
  context?: string;
}

export interface GeminiRecommendation {
  category: string;
  items: string[];
  source: 'gemini' | 'fallback';
  timestamp: Date;
  disclaimer: string;
}

export interface GeminiResponseParsed {
  medicines?: string[];
  ayurveda?: string[];
  yoga?: string[];
  diet?: string[];
  warnings?: string[];
  success: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL_NAME = 'gemini-pro';
const TIMEOUT_MS = 25000; // 25 second timeout for better results
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const MEDICAL_DISCLAIMER = `
⚠️ **IMPORTANT MEDICAL DISCLAIMER:**
This AI-generated recommendation is for educational purposes ONLY and does NOT constitute medical advice.
- These suggestions are general guidelines based on health principles
- Individual recommendations should be discussed with your healthcare provider
- Do NOT start any new supplements, medications, or exercises without medical clearance
- For chest pain, shortness of breath, or emergencies: call 108 (India), 911 (US), 999 (UK), or 112 (EU) IMMEDIATELY
- Your doctor knows your complete medical history and current medications - consult them for personalized advice
`;

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Build prompt for Gemini based on recommendation type and patient context
 */
function buildPrompt(request: GeminiRecommendationRequest): string {
  const { riskLevel, patientData, recommendationType } = request;

  const riskContext = {
    low: 'preventive maintenance and optimization',
    medium: 'risk reduction through lifestyle modifications',
    high: 'urgent intervention and close medical monitoring'
  };

  const basePrompt = `
You are a helpful health education AI assistant. You provide evidence-based health information for educational purposes only.

Patient Profile:
- Age: ${patientData.age} years
- Gender: ${patientData.gender}
- Risk Level: ${riskLevel.toUpperCase()}
- Lifestyle: ${patientData.physicalActivity || 'moderate'} activity
- Diet Type: ${patientData.dietType || 'mixed'}
- Stress Level: ${patientData.stressLevel || 'moderate'}/10

Medical Context:
- Risk assessment indicates ${riskContext[riskLevel]}
- Current focus: Cardiovascular health
- Goal: Personalized, evidence-based guidance

CRITICAL INSTRUCTIONS:
1. Provide practical, actionable recommendations
2. Include specific, measurable guidance
3. Tailor to ${patientData.age} year old ${patientData.gender}
4. Consider Indian health context and traditional practices
5. Emphasize medical consultation for any concerning symptoms
6. Do NOT provide medical diagnosis or treatment plans
7. Always recommend consulting healthcare providers
8. Format responses as structured lists
9. Include dosages/frequencies where appropriate
10. Add warnings for each category
`;

  const typeSpecificPrompts: { [key: string]: string } = {
    medicines: `
Generate a list of evidence-based, over-the-counter supplements and vitamins for cardiovascular health for a ${riskLevel} risk patient.

Format as JSON:
{
  "medicines": [
    "Supplement name (dosage, frequency, benefit)",
    ...
  ],
  "warnings": [
    "Important warning for this patient profile",
    ...
  ]
}

Include:
- Omega-3 supplements (fish oil or plant-based)
- Coenzyme Q10
- Magnesium
- Vitamins D, B complex
- Natural supplements (garlic, turmeric)
- Specific dosages for this age group
- Contraindications for this risk level
- When to consult a doctor

IMPORTANT: These are SUGGESTIONS ONLY. User must consult doctor before starting.
`,

    ayurveda: `
Provide evidence-based Ayurvedic recommendations for cardiovascular health for a ${riskLevel} risk ${patientData.age} year old ${patientData.gender}.

Format as JSON:
{
  "ayurveda": [
    "Ayurvedic recommendation (preparation, frequency, benefit)",
    ...
  ],
  "warnings": [
    "Important warning",
    ...
  ]
}

Include:
- Heart-supporting herbs (Arjuna, Garlic, etc.)
- Dosha-specific recommendations (Vata/Pitta/Kapha)
- Daily practices (Dinacharya)
- Oil massage (Abhyanga) recommendations
- Dietary principles from Ayurveda
- Pranayama techniques
- Seasonal adjustments
- Preparation methods

Tailor to: Age ${patientData.age}, Gender ${patientData.gender}, Risk Level ${riskLevel}
`,

    yoga: `
Provide specific yoga poses and breathing exercises for cardiovascular health for a ${riskLevel} risk ${patientData.age} year old ${patientData.gender}.

Format as JSON:
{
  "yoga": [
    "Pose/Practice name (duration, frequency, modifications for age/risk)",
    ...
  ],
  "warnings": [
    "Safety warning for this patient",
    ...
  ]
}

Include:
- Easy poses for beginners (if age >60 or high risk)
- Heart-opening asanas (Bhujangasana, Ustrasana, etc.)
- Pranayama techniques (Anulom Vilom, Ujjayi, etc.)
- Meditation guidance
- Modifications for ${patientData.age} year old
- Daily practice schedule
- Poses to AVOID for this risk level
- When to do vs avoid yoga
- Instructor guidance recommendations

Safety first: Include modifications for age and risk level.
`,

    diet: `
Create evidence-based cardiovascular health diet recommendations for a ${riskLevel} risk ${patientData.age} year old ${patientData.gender} on ${patientData.dietType} diet.

Format as JSON:
{
  "diet": [
    "Food/Recipe (frequency, portion, preparation, benefit)",
    ...
  ],
  "warnings": [
    "Foods to avoid or limit for this patient",
    ...
  ]
}

Include:
- Traditional Indian heart-healthy foods
- Specific meals for this diet type (vegetarian/non-veg)
- Spices and their cardiovascular benefits
- Foods to include (daily servings)
- Foods to limit
- Meal timing and frequency
- Hydration recommendations
- Specific recipes or combinations
- Shopping list basics
- Cooking methods (least oil)
- Portion sizes

Context: ${patientData.dietType} diet, ${riskLevel} risk, age ${patientData.age}
`,

    comprehensive: `
Provide comprehensive cardiovascular health recommendations covering:
1. Medications/Supplements
2. Ayurvedic approach
3. Yoga and exercises
4. Diet and nutrition

Format as JSON:
{
  "medicines": [...],
  "ayurveda": [...],
  "yoga": [...],
  "diet": [...],
  "warnings": [...]
}

Integrate all domains for a ${riskLevel} risk ${patientData.age} year old ${patientData.gender}.
Prioritize recommendations by urgency for this risk level.
`
  };

  return basePrompt + (typeSpecificPrompts[recommendationType] || typeSpecificPrompts.comprehensive);
}

// ============================================================================
// GEMINI SERVICE CLASS
// ============================================================================

class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private isInitialized = false;

  /**
   * Initialize Gemini service with API key
   */
  private initializeIfNeeded(): boolean {
    if (this.isInitialized && this.client) return true;

    if (!config.ai.gemini.enabled || !config.ai.gemini.apiKey) {
      console.warn('Gemini not configured - will use fallback');
      return false;
    }

    try {
      this.client = new GoogleGenerativeAI(config.ai.gemini.apiKey);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
      return false;
    }
  }

  /**
   * Get recommendations from Gemini with error handling and retries
   */
  async getRecommendations(request: GeminiRecommendationRequest): Promise<GeminiRecommendation> {
    // Initialize if needed
    if (!this.initializeIfNeeded() || !this.client) {
      return this.getFallbackRecommendation(request);
    }

    try {
      const prompt = buildPrompt(request);
      const response = await this.callGeminiWithRetry(prompt);
      
      if (!response) {
        return this.getFallbackRecommendation(request);
      }

      const parsed = this.parseGeminiResponse(response);
      if (!parsed.success) {
        console.warn('Failed to parse Gemini response, using fallback');
        return this.getFallbackRecommendation(request);
      }

      return this.formatRecommendation(parsed, request, 'gemini');
    } catch (error) {
      console.error('Gemini recommendation error:', error);
      return this.getFallbackRecommendation(request);
    }
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callGeminiWithRetry(prompt: string, attempt = 1): Promise<string | null> {
    if (!this.client) return null;

    try {
      const model = this.client.getGenerativeModel({ model: MODEL_NAME });

      // Create promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API timeout')), TIMEOUT_MS);
      });

      // Race between API call and timeout
      const response = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);

      const text = response.response.text();
      return text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt < MAX_RETRIES && errorMessage.includes('timeout')) {
        console.warn(`Gemini timeout, retry ${attempt}/${MAX_RETRIES}`);
        await this.delay(RETRY_DELAY_MS * attempt);
        return this.callGeminiWithRetry(prompt, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Parse Gemini response to extract structured recommendations
   */
  private parseGeminiResponse(response: string): GeminiResponseParsed {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      const result: GeminiResponseParsed = {
        medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
        ayurveda: Array.isArray(parsed.ayurveda) ? parsed.ayurveda : [],
        yoga: Array.isArray(parsed.yoga) ? parsed.yoga : [],
        diet: Array.isArray(parsed.diet) ? parsed.diet : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        success: true
      };

      // Ensure we have at least some recommendations
      if (
        (!result.medicines || result.medicines.length === 0) &&
        (!result.ayurveda || result.ayurveda.length === 0) &&
        (!result.yoga || result.yoga.length === 0) &&
        (!result.diet || result.diet.length === 0)
      ) {
        return { success: false };
      }

      return result;
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return { success: false };
    }
  }

  /**
   * Format parsed response into recommendation object
   */
  private formatRecommendation(
    parsed: GeminiResponseParsed,
    request: GeminiRecommendationRequest,
    source: 'gemini' | 'fallback'
  ): GeminiRecommendation {
    let items: string[] = [];

    // Build recommendation list based on type
    if (request.recommendationType === 'medicines' && parsed.medicines) {
      items = parsed.medicines;
    } else if (request.recommendationType === 'ayurveda' && parsed.ayurveda) {
      items = parsed.ayurveda;
    } else if (request.recommendationType === 'yoga' && parsed.yoga) {
      items = parsed.yoga;
    } else if (request.recommendationType === 'diet' && parsed.diet) {
      items = parsed.diet;
    } else if (request.recommendationType === 'comprehensive') {
      items = [
        ...(parsed.medicines ? [`💊 **Medicines/Supplements:**`, ...parsed.medicines] : []),
        ...(parsed.ayurveda ? [`🌿 **Ayurvedic Practices:**`, ...parsed.ayurveda] : []),
        ...(parsed.yoga ? [`🧘 **Yoga & Pranayama:**`, ...parsed.yoga] : []),
        ...(parsed.diet ? [`🍽️ **Diet & Nutrition:**`, ...parsed.diet] : [])
      ];
    }

    // Add warnings
    if (parsed.warnings && parsed.warnings.length > 0) {
      items.push('', '⚠️ **Warnings:**');
      items.push(...parsed.warnings);
    }

    return {
      category: request.recommendationType,
      items,
      source,
      timestamp: new Date(),
      disclaimer: MEDICAL_DISCLAIMER
    };
  }

  /**
   * Fallback recommendation when Gemini is unavailable
   */
  private getFallbackRecommendation(request: GeminiRecommendationRequest): GeminiRecommendation {
    const { riskLevel, recommendationType } = request;

    const fallbackItems: { [key: string]: string[] } = {
      medicines: [
        `**For ${riskLevel} risk patients:**`,
        '💊 Omega-3 fatty acids (fish oil or flaxseed) - 1000mg daily',
        '💊 Coenzyme Q10 - 100-200mg daily for heart health',
        '💊 Magnesium supplement - 200-400mg daily',
        '💊 Vitamin D3 - 1000-2000 IU daily (if deficient)',
        '💊 B-complex vitamins - daily for metabolism',
        '💊 Garlic extract - natural blood pressure support',
        '',
        '⚠️ Always consult your doctor before starting any supplement'
      ],
      ayurveda: [
        `**For ${riskLevel} risk patients:**`,
        '🌿 Arjuna bark tea - 2-3 grams in warm water, twice daily',
        '🌿 Ashwagandha - 300-500mg twice daily for stress',
        '🌿 Turmeric with black pepper - 1/4 tsp in warm milk daily',
        '🌿 Garlic (Lasun) - 1-2 cloves daily with food',
        '🌿 Daily oil massage (Abhyanga) with sesame oil',
        '🌿 Meditate for 20 minutes daily',
        '',
        '⚠️ Consult an Ayurvedic practitioner for personalized dosage'
      ],
      yoga: [
        `**For ${riskLevel} risk patients:**`,
        '🧘 Gentle stretching - 10 minutes daily',
        '🧘 Child\'s Pose (Balasana) - calms nervous system',
        '🧘 Cat-Cow Pose (Marjaryasana-Bitilasana) - gentle spine movement',
        '🧘 Anulom Vilom (Alternate Nostril Breathing) - 10 minutes daily',
        '🧘 Bhramari Pranayama (Bee Breath) - 5-10 rounds',
        '🧘 Meditation - 15-20 minutes for stress reduction',
        '',
        riskLevel === 'high' ? '⚠️ Avoid intense poses. Start with gentle practice only.' : '',
        '⚠️ Consult a yoga instructor for proper form'
      ],
      diet: [
        `**For ${riskLevel} risk patients:**`,
        '🍽️ Include: Leafy greens, whole grains, legumes, nuts',
        '🍽️ Limit: Salt, sugar, refined carbs, fried foods',
        '🍽️ Spices: Turmeric, ginger, garlic, fenugreek',
        '🍽️ Oils: Use olive oil or mustard oil sparingly',
        '🍽️ Vegetables: Broccoli, carrots, tomatoes, peppers',
        '🍽️ Hydration: 8-10 glasses of water daily',
        '🍽️ Meal timing: Eat light dinners, finish 3 hours before sleep',
        '',
        '⚠️ Consult a dietitian for personalized meal plans'
      ],
      comprehensive: [
        '**COMPREHENSIVE CARDIOVASCULAR HEALTH PLAN**',
        '',
        '💊 **Supplements:**',
        '- Omega-3 (1000mg daily), CoQ10 (100-200mg), Magnesium (200-400mg)',
        '',
        '🌿 **Ayurveda:**',
        '- Arjuna tea (2-3g twice daily), Ashwagandha (300-500mg twice daily)',
        '',
        '🧘 **Yoga & Exercise:**',
        '- 30 min moderate activity 5x/week, 20 min yoga daily',
        '',
        '🍽️ **Diet:**',
        '- Mediterranean style, whole grains, lean proteins, vegetables',
        '',
        '⚠️ Consult healthcare provider before implementing any changes'
      ]
    };

    return {
      category: recommendationType,
      items: fallbackItems[recommendationType] || fallbackItems.comprehensive,
      source: 'fallback',
      timestamp: new Date(),
      disclaimer: MEDICAL_DISCLAIMER
    };
  }

  /**
   * Helper: delay function for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if Gemini is available
   */
  isAvailable(): boolean {
    return config.ai.gemini.enabled && !!config.ai.gemini.apiKey;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; configured: boolean; message: string } {
    const available = this.isAvailable();
    const configured = !!config.ai.gemini.apiKey;

    return {
      available,
      configured,
      message: available
        ? 'Gemini AI is configured and ready'
        : configured
          ? 'Gemini AI configured but may not be responding'
          : 'Gemini AI not configured - using fallback recommendations'
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const geminiService = new GeminiService();

export default geminiService;
