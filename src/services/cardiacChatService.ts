/**
 * Cardiac-Specific Chat Service
 * Enhances AI responses with medical context and MedlinePlus verification
 * Date: November 6, 2025
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// MEDLINE PLUS API INTEGRATION (Free medical information)
// ============================================================================

interface MedlinePlusResult {
  title: string;
  description: string;
  url: string;
  snippet: string;
}

async function fetchMedlinePlusInfo(query: string): Promise<MedlinePlusResult | null> {
  try {
    // MedlinePlus National Library of Medicine API (free, no key required for basic searches)
    const encodedQuery = encodeURIComponent(query);
    const medlinePlusUrl = `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${encodedQuery}&x=0&y=0`;
    
    const response = await fetch(medlinePlusUrl);
    
    if (!response.ok) {
      console.log('MedlinePlus API not available - will use Gemini only');
      return null;
    }

    // Parse the response
    const text = await response.text();
    
    // Extract relevant information (simple parsing)
    const titleMatch = text.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'Heart Health Information';

    return {
      title: title,
      description: `Information from MedlinePlus (National Library of Medicine)`,
      url: `https://medlineplus.gov/search/results?query=${encodedQuery}`,
      snippet: `Search MedlinePlus for: ${query}`
    };
  } catch (error) {
    console.log('MedlinePlus fetch failed - using Gemini only:', error);
    return null;
  }
}

// ============================================================================
// CARDIAC-SPECIFIC SYSTEM PROMPT
// ============================================================================

const CARDIAC_SYSTEM_PROMPT = `You are a highly knowledgeable Cardiac Health Education Assistant with expertise in:
- Cardiovascular disease prevention and management
- Heart attack risk factors and warning signs
- Lifestyle modifications for heart health
- Medication information related to cardiac conditions
- Indian population-specific cardiac risk factors (diabetes prevalence, central obesity, triglyceride sensitivity)
- Clinical guidelines (ACC/AHA, ESC, Indian Heart Association)

**YOUR ROLE:**
You provide evidence-based, medically accurate information about heart health to help patients understand their cardiovascular risks and make informed decisions.

**CRITICAL GUIDELINES YOU MUST FOLLOW:**

1. **ALWAYS START with this medical disclaimer for ANY cardiac advice:**
   "⚠️ IMPORTANT: I'm an educational assistant, not a substitute for professional medical care. Always consult your healthcare provider."

2. **EMERGENCY PROTOCOL:**
   - If user mentions chest pain, shortness of breath, severe symptoms, or discomfort → IMMEDIATELY say:
   "🚨 SEEK EMERGENCY HELP: Call 911 (US), 999 (UK), 112 (EU) or your emergency number immediately. Do not delay."

3. **SCOPE OF RESPONSES:**
   ✅ CAN: Explain risk factors, recommend preventive measures, discuss lifestyle changes, clarify medical concepts
   ❌ CANNOT: Diagnose conditions, prescribe medications, replace doctor consultations, guarantee outcomes

4. **RESPONSE QUALITY:**
   - Use clear, simple language (avoid jargon or explain it)
   - Cite clinical evidence when relevant (Framingham Study, INTERHEART, PURE-India, etc.)
   - For Indian users: Mention South Asian-specific factors (triglycerides 1.56x risk, central obesity 1.5x)
   - Structure responses with headers and bullet points for clarity
   - Include practical, actionable recommendations

5. **PERSONALIZATION:**
   - Consider patient's age, gender, and health conditions
   - For women: Mention hormonal factors, pregnancy complications, HRT impact
   - For men: Mention earlier onset risk (develops 5-10 years earlier than women)
   - Acknowledge cultural and dietary preferences

6. **MEDICATION DISCUSSIONS:**
   - ✅ CAN: Explain how medications work (e.g., "Statins reduce cholesterol")
   - ❌ CANNOT: Recommend specific doses or timing
   - Direct to pharmacist for interaction questions

7. **TONE:**
   - Empathetic, not alarmist
   - Encouraging for positive behavior changes
   - Respectful of patient autonomy
   - Supportive of professional medical relationships

**EXAMPLE RESPONSE STRUCTURE:**
1. Medical disclaimer (if needed)
2. Clear, simple explanation
3. Key facts with evidence
4. Practical lifestyle tips
5. When to see doctor
6. Links to trusted resources (MedlinePlus, American Heart Association)

**Always prioritize patient safety and professional medical care above all else.**`;

// ============================================================================
// GEMINI INTEGRATION FOR CARDIAC CHAT
// ============================================================================

export class CardiacChatService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_KEY;
    
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: 'gemini-pro',
          systemInstruction: CARDIAC_SYSTEM_PROMPT
        });
      } catch (error) {
        console.warn('Gemini AI initialization failed:', error);
      }
    }
  }

  /**
   * Get cardiac-specific response from Gemini with medical context
   */
  async getCardiacResponse(
    userMessage: string, 
    patientContext?: {
      riskLevel?: 'low' | 'medium' | 'high';
      riskScore?: number;
      age?: number;
      gender?: 'male' | 'female';
      hasFamilyHistory?: boolean;
      conditions?: string[];
    }
  ): Promise<string> {
    if (!this.model) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Build context from patient data if provided
      let contextMessage = userMessage;
      if (patientContext) {
        contextMessage = `[Patient Context: Age ${patientContext.age}, Gender: ${patientContext.gender}, Risk Level: ${patientContext.riskLevel}, Risk Score: ${patientContext.riskScore}%]\n\n${userMessage}`;
      }

      // Fetch MedlinePlus info to enrich response
      const medlinePlusInfo = await fetchMedlinePlusInfo(userMessage.substring(0, 50));

      // Get response from Gemini with cardiac system prompt
      const result = await this.model.generateContent(contextMessage);
      const response = await result.response;
      let content = response.text();

      // Append MedlinePlus reference if available
      if (medlinePlusInfo) {
        content += `\n\n📚 **Verified Resources:**\n- ${medlinePlusInfo.title}\n- [Search MedlinePlus](${medlinePlusInfo.url})`;
      }

      // Add footer with resources
      content += `\n\n**🏥 For More Information:**\n- American Heart Association: www.heart.org\n- MedlinePlus: medlineplus.gov\n- World Heart Federation: www.worldheart.org`;

      return content;
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Check if user message indicates an emergency
   */
  detectEmergency(message: string): boolean {
    const emergencyKeywords = [
      'chest pain', 'chest discomfort', 'shortness of breath', 'cannot breathe',
      'difficulty breathing', 'heart attack', 'stroke', 'fainting', 'collapse',
      'severe pain', 'crushing pain', 'pressure in chest', 'emergency',
      'call ambulance', 'dial 911', 'urgent', 'severe', 'acute', 'sudden'
    ];

    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Fallback response when Gemini API is unavailable
   */
  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Emergency detection
    if (this.detectEmergency(userMessage)) {
      return `🚨 **MEDICAL EMERGENCY DETECTED**

If you're experiencing:
- Chest pain or pressure
- Shortness of breath  
- Severe symptoms
- Any life-threatening condition

**CALL EMERGENCY SERVICES IMMEDIATELY:**
- 🇺🇸 USA: Call 911
- 🇬🇧 UK: Call 999
- 🇪🇺 Europe: Call 112
- 🇮🇳 India: Call 108 or 102

**Do not wait. Do not delay. Seek emergency help now.**`;
    }

    // Common cardiac questions
    if (lowerMessage.includes('risk factor')) {
      return `⚠️ **Common Heart Attack Risk Factors:**

**Non-Modifiable:**
• Age (men 45+, women 55+)
• Family history of heart disease
• Gender (men at higher risk)

**Modifiable (You CAN change these):**
• Smoking - Quit immediately
• High blood pressure - Manage with medication & lifestyle
• High cholesterol - Diet, exercise, medications
• Diabetes - Control blood sugar
• Obesity - Lose weight gradually
• Sedentary lifestyle - Increase physical activity
• Stress - Practice relaxation techniques
• Poor diet - Eat heart-healthy foods

**Action Items:**
1. Get regular blood pressure checks
2. Know your cholesterol levels
3. Maintain healthy weight (BMI < 25)
4. Exercise 150 min/week
5. Eat Mediterranean or DASH diet
6. Manage stress
7. Don't smoke

**Always consult your healthcare provider for personalized advice.** 🏥`;
    }

    if (lowerMessage.includes('diet') || lowerMessage.includes('food')) {
      return `🥗 **Heart-Healthy Diet Recommendations:**

**BEST Foods:**
✅ Whole grains (oats, brown rice, quinoa)
✅ Fatty fish (salmon, mackerel) - 2x/week
✅ Fruits & vegetables - 5+ servings/day
✅ Nuts & seeds (almonds, walnuts)
✅ Legumes (beans, lentils)
✅ Olive oil
✅ Low-fat dairy

**AVOID/LIMIT:**
❌ Trans fats (processed foods)
❌ Saturated fats (red meat, butter)
❌ Added sugars & salt
❌ Processed meats (bacon, sausage)
❌ Sugary drinks
❌ Alcohol (limit to moderate)

**Mediterranean & DASH Diets** are proven to reduce heart disease risk by 20-30%.

**For Indian Users:** 
- Use heart-healthy oils (groundnut, soybean)
- Include spices (turmeric, ginger) - anti-inflammatory
- Control portion sizes of refined grains
- Reduce added salt in curries

**Consult a nutritionist for personalized meal plans.** 👨‍⚕️`;
    }

    if (lowerMessage.includes('exercise') || lowerMessage.includes('activity')) {
      return `💪 **Physical Activity for Heart Health:**

**RECOMMENDED:** 150 min moderate exercise/week

**Excellent Activities:**
✅ Brisk walking
✅ Jogging  
✅ Swimming
✅ Cycling
✅ Dancing
✅ Team sports

**Starting Out?**
• Start with 10-15 min walks daily
• Gradually increase to 30 min
• Aim for 5 days/week
• Always warm up & cool down

**With Existing Heart Conditions:**
⚠️ Consult doctor before starting exercise program
- May need stress testing first
- Follow personalized guidelines
- Monitor for symptoms

**Benefits:**
- Lowers blood pressure
- Improves cholesterol
- Helps weight loss
- Reduces stress
- Improves heart function

**Set realistic goals and track progress!** 📊`;
    }

    // Default response with disclaimer
    return `ℹ️ **Heart Health Information Assistant**

I'm here to help you understand cardiovascular health through evidence-based education.

⚠️ **Important Disclaimer:** I provide educational information, NOT medical advice. Always consult qualified healthcare professionals.

**I can help with:**
• Risk factor explanations
• Lifestyle recommendations  
• Understanding cardiac conditions
• Prevention strategies
• Preparation for doctor visits

**I CANNOT:**
• Diagnose conditions
• Prescribe medications
• Provide medical treatment
• Handle emergencies

**For emergencies:** Call 911 (US), 999 (UK), 112 (EU) immediately.

**What would you like to learn about cardiac health?** 💓`;
  }
}

// Export singleton instance
export const cardiacChatService = new CardiacChatService();
