/**
 * OpenAI GPT-4 Service
 * 
 * Provides personalized health recommendations using OpenAI's GPT-4 model
 * Serves as backup/secondary AI provider with comprehensive medical guidance
 * 
 * Created: November 4, 2025
 */

import OpenAI from 'openai';
import { config } from '@/lib/config';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface OpenAIRecommendationRequest {
  riskLevel: 'low' | 'medium' | 'high';
  patientAge: number;
  patientGender: string;
  patientDiet: string;
  recommendationType: 'medicines' | 'ayurveda' | 'yoga' | 'diet' | 'comprehensive';
}

export interface OpenAIRecommendation {
  category: string;
  items: string[];
  source: 'openai' | 'fallback';
  timestamp: Date;
  disclaimer: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIMEOUT_MS = 25000; // 25 second timeout for better results
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const MEDICAL_DISCLAIMER = `
⚠️ **CRITICAL MEDICAL DISCLAIMER:**
- These are EDUCATIONAL recommendations ONLY, not medical advice
- Do NOT diagnose, treat, prescribe, or modify any medical care without professional guidance
- Individual medical decisions require consultation with qualified healthcare providers
- For emergencies (chest pain, shortness of breath): Call 108 (India), 911 (US), 999 (UK), or 112 (EU)
- Always discuss any health changes with your doctor who knows your complete medical history
`;

// ============================================================================
// OPENAI SERVICE CLASS
// ============================================================================

class OpenAIService {
  private client: OpenAI | null = null;
  private isInitialized = false;

  /**
   * Initialize OpenAI client
   */
  private initializeIfNeeded(): boolean {
    if (this.isInitialized && this.client) return true;

    if (!config.ai.openai.enabled || !config.ai.openai.apiKey) {
      console.warn('OpenAI not configured - will use fallback');
      return false;
    }

    try {
      this.client = new OpenAI({
        apiKey: config.ai.openai.apiKey,
        dangerouslyAllowBrowser: true // Note: In production, use backend proxy
      });
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      return false;
    }
  }

  /**
   * Get recommendations from OpenAI with retries and error handling
   */
  async getRecommendations(request: OpenAIRecommendationRequest): Promise<OpenAIRecommendation> {
    if (!this.initializeIfNeeded() || !this.client) {
      return this.getFallbackRecommendation(request);
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      const response = await this.callOpenAIWithRetry(systemPrompt, userPrompt);

      if (!response) {
        return this.getFallbackRecommendation(request);
      }

      return this.formatRecommendation(response, request, 'openai');
    } catch (error) {
      console.error('OpenAI recommendation error:', error);
      return this.getFallbackRecommendation(request);
    }
  }

  /**
   * Build system prompt for GPT-4
   */
  private buildSystemPrompt(): string {
    return `You are a compassionate and knowledgeable health education AI assistant specializing in cardiovascular health. 
Your role is to provide evidence-based, educational information only - NOT medical diagnosis or treatment.

Guidelines:
1. ALWAYS include medical disclaimers
2. Recommend professional medical consultation
3. Provide specific, actionable guidance tailored to individual context
4. Consider Indian health context and traditional medicine (Ayurveda, Yoga)
5. Be clear about evidence levels and when guidance is general vs specific
6. Include practical implementation details (dosages, frequencies, modifications)
7. Acknowledge limitations and when professional help is essential
8. Format responses as clear, numbered lists
9. Use conversational but professional tone
10. Never diagnose, prescribe medications, or guarantee outcomes`;
  }

  /**
   * Build user prompt based on request type
   */
  private buildUserPrompt(request: OpenAIRecommendationRequest): string {
    const { riskLevel, patientAge, patientGender, patientDiet, recommendationType } = request;

    const basePrompt = `
Patient Profile:
- Age: ${patientAge} years old
- Gender: ${patientGender}
- Cardiovascular Risk Level: ${riskLevel.toUpperCase()}
- Dietary Preference: ${patientDiet}

Please provide evidence-based, educational recommendations for ${riskLevel.toLowerCase()} cardiovascular risk.
`;

    const typePrompts: { [key: string]: string } = {
      medicines: `
Provide a list of over-the-counter supplements and natural compounds beneficial for cardiovascular health at ${riskLevel} risk level.
For each, include:
- Substance name
- Typical dosage for ${patientAge} year old
- Expected benefits
- Precautions or interactions
- When to consult doctor

Focus on: Omega-3s, CoQ10, Magnesium, Vitamins, Garlic, Turmeric, Hawthorn, etc.
Emphasize that all should be discussed with healthcare provider.`,

      ayurveda: `
Provide Ayurvedic recommendations for cardiovascular health suited to ${patientAge} year old ${patientGender} with ${riskLevel} risk.
Include:
- Heart-supporting herbs (preparation methods)
- Dosha-balancing approaches
- Daily practices (Dinacharya)
- Seasonal adjustments
- Foods to emphasize vs avoid
- Oil massage (Abhyanga) recommendations
- Breathing exercises

Tailor suggestions to age and risk level.`,

      yoga: `
Provide specific yoga poses and breathing exercises for ${patientAge} year old with ${riskLevel} cardiovascular risk.
Include:
- Specific poses (with modifications for age/risk)
- Breathing techniques (Pranayama)
- Meditation guidance
- Daily practice schedule
- Intensity level recommendations
- Poses to avoid for this risk level
- How to progress safely

Consider: High risk patients need gentler practices.`,

      diet: `
Create detailed dietary recommendations for ${riskLevel} cardiovascular risk patient.
Consider: ${patientAge} year old, ${patientGender}, ${patientDiet} diet preference.
Include:
- Foods to emphasize (with Indian traditional examples)
- Portion guidelines
- Meal timing and frequency
- Specific recipes or combinations
- Foods to limit
- Beverages (including traditional options like masala chai alternatives)
- Cooking methods
- Seasonal variations

Use culturally appropriate examples.`,

      comprehensive: `
Provide comprehensive cardiovascular health recommendations covering:
1. Supplements and natural compounds (with dosages)
2. Ayurvedic practices (tailored to dosha and risk)
3. Yoga and breathing exercises (with modifications)
4. Dietary guidance (respecting ${patientDiet} preference)

Integrate all four domains into a cohesive plan for ${patientAge} year old ${patientGender} with ${riskLevel} risk.
Prioritize by urgency and impact for this risk level.
Make it actionable and realistic to implement.`
    };

    return basePrompt + (typePrompts[recommendationType] || typePrompts.comprehensive);
  }

  /**
   * Call OpenAI API with retry logic
   */
  private async callOpenAIWithRetry(
    systemPrompt: string,
    userPrompt: string,
    attempt = 1
  ): Promise<string | null> {
    if (!this.client) return null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API timeout')), TIMEOUT_MS);
      });

      const completion = Promise.race([
        this.client.chat.completions.create({
          model: config.ai.openai.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: config.ai.openai.maxTokens,
          temperature: 0.7,
          top_p: 0.9
        }),
        timeoutPromise
      ]);

      const response = await completion;
      const content = response.choices[0]?.message?.content;
      return content || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (attempt < MAX_RETRIES && (errorMessage.includes('timeout') || errorMessage.includes('rate'))) {
        console.warn(`OpenAI retry ${attempt}/${MAX_RETRIES}`);
        await this.delay(RETRY_DELAY_MS * attempt);
        return this.callOpenAIWithRetry(systemPrompt, userPrompt, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Format OpenAI response into recommendation object
   */
  private formatRecommendation(
    content: string,
    request: OpenAIRecommendationRequest,
    source: 'openai' | 'fallback'
  ): OpenAIRecommendation {
    // Split response into lines and filter empty ones
    const items = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return {
      category: request.recommendationType,
      items,
      source,
      timestamp: new Date(),
      disclaimer: MEDICAL_DISCLAIMER
    };
  }

  /**
   * Fallback recommendation when OpenAI unavailable
   */
  private getFallbackRecommendation(request: OpenAIRecommendationRequest): OpenAIRecommendation {
    const { riskLevel } = request;

    const fallbackItems: { [key: string]: string[] } = {
      medicines: [
        `**Supplements for ${riskLevel} risk patients:**`,
        '1. Omega-3 Fatty Acids (fish oil or algae-based)',
        '   - Dosage: 1000-2000mg daily',
        '   - Benefit: Supports healthy triglycerides and heart function',
        '',
        '2. Coenzyme Q10 (CoQ10)',
        '   - Dosage: 100-200mg daily',
        '   - Benefit: Supports heart energy production',
        '',
        '3. Magnesium',
        '   - Dosage: 200-400mg daily',
        '   - Benefit: Supports heart rhythm and relaxation',
        '',
        '4. Vitamin D3',
        '   - Dosage: 1000-2000 IU daily (if deficient)',
        '   - Benefit: Supports overall cardiovascular health',
        '',
        '⚠️ Discuss all supplements with your doctor before starting'
      ],
      ayurveda: [
        `**Ayurvedic practices for ${riskLevel} risk:**`,
        '1. Arjuna (Terminalia arjuna)',
        '   - Traditional heart-strengthening herb',
        '   - Preparation: 2-3g decoction twice daily with warm water',
        '',
        '2. Ashwagandha',
        '   - Stress-reducing adaptogenic herb',
        '   - Dosage: 300-500mg twice daily',
        '',
        '3. Turmeric with Black Pepper',
        '   - Golden milk: 1/4 tsp turmeric + pinch black pepper in warm milk',
        '   - Daily for anti-inflammatory benefits',
        '',
        '4. Daily Oil Massage (Abhyanga)',
        '   - Use sesame or coconut oil',
        '   - 10 minutes daily to support circulation',
        '',
        '⚠️ Consult an Ayurvedic practitioner for personalization'
      ],
      yoga: [
        `**Yoga practices for ${riskLevel} risk:**`,
        '1. Anulom Vilom (Alternate Nostril Breathing)',
        '   - Duration: 10 minutes daily',
        '   - Benefits: Balances nervous system, reduces stress',
        '',
        '2. Gentle Heart-Opening Poses',
        '   - Child\'s Pose (Balasana) - 1 minute',
        '   - Cat-Cow Pose (Marjaryasana-Bitilasana) - 5 minutes',
        '   - Supported Fish Pose - 2 minutes',
        '',
        '3. Meditation',
        '   - Duration: 15-20 minutes daily',
        '   - Focus on calm, steady breathing',
        '',
        '4. Bhramari Pranayama (Bee Breath)',
        '   - 5-10 rounds, calms the nervous system',
        '',
        riskLevel === 'high' ? '⚠️ Start with gentle practices only' : '',
        '⚠️ Learn proper form from a qualified yoga instructor'
      ],
      diet: [
        `**Heart-healthy diet for ${riskLevel} risk:**`,
        '1. Foods to Emphasize',
        '   - Leafy greens: Spinach, kale, fenugreek leaves',
        '   - Legumes: Lentils, chickpeas, black beans',
        '   - Whole grains: Brown rice, quinoa, millets',
        '   - Nuts and seeds: Almonds, walnuts, flaxseeds',
        '   - Spices: Turmeric, ginger, garlic, fenugreek',
        '',
        '2. Foods to Limit',
        '   - Refined carbohydrates',
        '   - Fried and fatty foods',
        '   - Excess salt and sugar',
        '   - Processed foods',
        '',
        '3. Meal Guidelines',
        '   - Eat largest meal at lunch (when digestion strongest)',
        '   - Light, early dinner (3 hours before sleep)',
        '   - Stay hydrated: 8-10 glasses water daily',
        '',
        '⚠️ Work with a dietitian for personalized meal planning'
      ],
      comprehensive: [
        '**COMPREHENSIVE CARDIOVASCULAR HEALTH PLAN**',
        '',
        '**Level 1: Lifestyle Foundation (All Risk Levels)**',
        '- Daily 30-minute moderate activity',
        '- 15-20 minute daily meditation',
        '- Whole food, plant-based emphasis',
        '- 8-9 hours quality sleep',
        '',
        '**Level 2: Supplements (Discuss with Doctor)**',
        '- Omega-3 (1000mg), CoQ10 (100-200mg), Magnesium (200-400mg)',
        '',
        '**Level 3: Traditional Medicine**',
        '- Ayurvedic herbs: Arjuna, Ashwagandha',
        '- Yoga and Pranayama practice',
        '',
        '**Level 4: Professional Support**',
        '- Regular doctor checkups',
        '- Cardiologist if high risk',
        '- Registered dietitian consultation'
      ]
    };

    return {
      category: request.recommendationType,
      items: fallbackItems[request.recommendationType] || fallbackItems.comprehensive,
      source: 'fallback',
      timestamp: new Date(),
      disclaimer: MEDICAL_DISCLAIMER
    };
  }

  /**
   * Helper: delay for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return config.ai.openai.enabled && !!config.ai.openai.apiKey;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; configured: boolean; message: string } {
    const available = this.isAvailable();
    const configured = !!config.ai.openai.apiKey;

    return {
      available,
      configured,
      message: available
        ? 'OpenAI GPT-4 is configured and ready'
        : configured
          ? 'OpenAI configured but may not be responding'
          : 'OpenAI not configured - using fallback recommendations'
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const openaiService = new OpenAIService();

export default openaiService;
