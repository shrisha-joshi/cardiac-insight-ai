/**
 * ENHANCED CARDIAC CHAT SERVICE - Using Gemini + DeepSeek
 * 
 * This service provides:
 * 1. Intelligent responses based on user context
 * 2. Varied, non-repetitive conversations
 * 3. Medical knowledge integration
 * 4. Indian population-specific guidance
 * 5. Efficient Gemini API usage
 * 6. DeepSeek as alternative/backup AI provider
 * 7. Smart caching and context management
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/lib/config';
import { deepseekIntegration } from './deepseekIntegration';

interface ConversationContext {
  userId?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  riskScore?: number;
  patientAge?: number;
  patientGender?: string;
}

type MessageType = 'general' | 'medical' | 'emergency' | 'educational' | 'personalized';
type NonEmergencyMessageType = Exclude<MessageType, 'emergency'>;

interface ChatResponse {
  message: string;
  type: MessageType;
  followUpQuestions?: string[];
  references?: string[];
}

class EnhancedCardiacChatService {
  private readonly gemini: GoogleGenerativeAI | null = null;
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
  private readonly conversationContexts: Map<string, ConversationContext> = new Map();
  private readonly responseCache: Map<string, string> = new Map();

  constructor() {
    if (config.ai.gemini.enabled && config.ai.gemini.apiKey) {
      this.gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey);
      this.model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  /**
   * Process user message and generate intelligent response
   */
  async processMessage(
    userMessage: string,
    userId?: string,
    riskScore?: number,
    patientAge?: number,
    patientGender?: string
  ): Promise<ChatResponse> {
    try {
      // Check cache first for common questions
      const cacheKey = this.generateCacheKey(userMessage, riskScore);
      if (this.responseCache.has(cacheKey)) {
        const cachedMessage = this.responseCache.get(cacheKey);
        if (cachedMessage) {
          return {
            message: cachedMessage,
            type: 'general',
            followUpQuestions: this.generateFollowUpQuestions(userMessage)
          };
        }
      }

      // Get or create conversation context
      const contextKey = userId || 'anonymous';
      let context = this.conversationContexts.get(contextKey);
      if (!context) {
        context = {
          userId,
          messages: [],
          riskScore,
          patientAge,
          patientGender
        };
      }

      // Add user message to context
      context.messages.push({ role: 'user', content: userMessage });

      // Determine message type and get response
      const messageType = this.detectMessageType(userMessage);
      let response = '';

      if (messageType === 'emergency') {
        response = this.getEmergencyResponse(userMessage);
      } else if (this.model && config.ai.gemini.enabled) {
        // Try Gemini first (messageType is now NonEmergencyMessageType)
        response = await this.getGeminiResponse(userMessage, context, messageType);
      } else if (deepseekIntegration.isAvailable()) {
        // Fall back to DeepSeek if Gemini not available
        if (import.meta.env.DEV) console.log('Using DeepSeek for chat response...');
        const deepseekResponse = await deepseekIntegration.generateChatbotResponse(
          userMessage,
          userId,
          riskScore,
          patientAge,
          patientGender
        );
        response = deepseekResponse.message;
      } else {
        // Final fallback to rule-based (messageType is now NonEmergencyMessageType)
        response = this.getRuleBasedResponse(userMessage, messageType, riskScore, patientAge, patientGender);
      }

      // Add assistant response to context
      context.messages.push({ role: 'assistant', content: response });

      // Keep only last 10 messages for context window
      if (context.messages.length > 20) {
        context.messages = context.messages.slice(-20);
      }

      this.conversationContexts.set(contextKey, context);

      // Cache response
      this.responseCache.set(cacheKey, response);

      return {
        message: response,
        type: messageType,
        followUpQuestions: this.generateFollowUpQuestions(userMessage, messageType),
        references: this.generateReferences(userMessage)
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Chat service error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Detect message type for intelligent routing
   */
  private detectMessageType(message: string): MessageType {
    const lowerMsg = message.toLowerCase();

    // Emergency indicators
    if (lowerMsg.includes('chest pain') || lowerMsg.includes('breathless') || 
        lowerMsg.includes('emergency') || lowerMsg.includes('heart attack') ||
        lowerMsg.includes('急') || lowerMsg.includes('emer')) {
      return 'emergency';
    }

    // Medical questions
    if (lowerMsg.includes('medication') || lowerMsg.includes('doctor') ||
        lowerMsg.includes('symptom') || lowerMsg.includes('disease') ||
        lowerMsg.includes('condition') || lowerMsg.includes('treatment')) {
      return 'medical';
    }

    // Educational questions
    if (lowerMsg.includes('what is') || lowerMsg.includes('explain') ||
        lowerMsg.includes('how') || lowerMsg.includes('why') ||
        lowerMsg.includes('information') || lowerMsg.includes('risk')) {
      return 'educational';
    }

    // Personalized questions
    if (lowerMsg.includes('my') || lowerMsg.includes('i have') ||
        lowerMsg.includes('my risk') || lowerMsg.includes('should i')) {
      return 'personalized';
    }

    return 'general';
  }

  /**
   * Emergency response - always consistent
   */
  private getEmergencyResponse(message: string): string {
    return `🚨 **EMERGENCY - SEEK IMMEDIATE MEDICAL HELP**

If you're experiencing:
- Chest pain or pressure
- Shortness of breath
- Severe dizziness
- Fainting
- Unusual fatigue

**CALL IMMEDIATELY:**
🇮🇳 **India:** 108 (Ambulance)
🇮🇳 **Cardiac Emergency:** 1298 (in some cities)
🇺🇸 **USA:** 911
🇬🇧 **UK:** 999
🇪🇺 **Europe:** 112

**Do NOT wait.** These could be signs of a heart attack.

**While waiting for ambulance:**
1. Stop all activity
2. Sit down or lie down
3. Chew aspirin if available (300mg)
4. Stay calm and breathe slowly
5. Keep phone nearby

This is not the time for online consultation. **GET PROFESSIONAL HELP NOW.**`;
  }

  /**
   * Get Gemini-powered intelligent response
   */
  private async getGeminiResponse(
    userMessage: string,
    context: ConversationContext,
    messageType: NonEmergencyMessageType
  ): Promise<string> {
    try {
      // Build conversation history for context
      const conversationHistory = context.messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      const systemPrompt = `You are CardiacInsight, an AI cardiac health assistant for Indian patients.

**CRITICAL RULES:**
1. NEVER provide medical diagnosis - refer to doctors
2. ALWAYS include medical disclaimers
3. For emergencies, direct to 108 (India) or emergency services
4. Be empathetic but concise (max 500 words per response)
5. Focus on EDUCATION, not treatment
6. Use Indian medical context and examples
7. Vary your responses - don't repeat yourself
8. Provide actionable information

**CONTEXT:**
- User Age: ${context.patientAge || 'Not specified'}
- User Gender: ${context.patientGender || 'Not specified'}
- Risk Score: ${context.riskScore || 'Not assessed'}
- Message Type: ${messageType}

**CONVERSATION HISTORY:**
${conversationHistory}

**Current User Message:** ${userMessage}

Provide a UNIQUE, VARIED response appropriate for "${messageType}" type.
If it's personalized, tailor to their risk profile.
If educational, explain clearly with examples.
If general, be friendly and engaging.
Always be accurate and cite reliable sources when possible.`;

      const response = await this.model.generateContent(systemPrompt);
      const text = response.response.text();

      return text || this.getRuleBasedResponse(userMessage, messageType, context.riskScore);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Gemini response failed:', error);
      return this.getRuleBasedResponse(userMessage, messageType, context.riskScore);
    }
  }

  /**
   * Rule-based responses (fallback)
   */
  private getRuleBasedResponse(
    message: string,
    type: NonEmergencyMessageType,
    riskScore?: number,
    age?: number,
    gender?: string
  ): string {
    switch (type) {
      case 'personalized':
        return this.handlePersonalizedResponse(message, riskScore, age, gender);
      case 'educational':
        return this.handleEducationalResponse(message);
      case 'medical':
        return this.handleMedicalResponse(message);
      case 'general':
        return this.handleGeneralResponse();
      default:
        return `👋 Hi! I'm here to help with cardiac health questions. How can I assist you today?`;
    }
  }

  /**
   * Handle personalized health responses
   */
  private handlePersonalizedResponse(
    message: string,
    riskScore?: number,
    age?: number,
    gender?: string
  ): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('exercise') || lowerMsg.includes('workout')) {
      return this.getExerciseResponse(age);
    }

    if (lowerMsg.includes('diet') || lowerMsg.includes('food') || lowerMsg.includes('eat')) {
      return this.getDietResponse();
    }

    if (riskScore && riskScore > 60) {
      return this.getHighRiskResponse(riskScore, message);
    }

    return `👋 Hi! I'm here to help with cardiac health questions. How can I assist you today?`;
  }

  /**
   * Get exercise recommendations based on age
   */
  private getExerciseResponse(age?: number): string {
    if (age && age > 60) {
      return `👴 **Exercise for Older Adults with Cardiac Risk**

For your age group, gradual progression is key:

**Week 1-2:** Start slow
- Walking: 10-15 min daily at comfortable pace
- Stretching: 10 min daily
- No strenuous activity

**Week 3-4:** Gradual increase
- Walking: 20-30 min daily
- Add gentle swimming or water aerobics (excellent for joints)
- Breathing exercises

**Weeks 5+:** Build strength
- 150 min brisk walking per week
- 2x/week resistance training (light weights)
- Flexibility work (yoga, tai chi)

**Important:** Get medical clearance before starting exercise program.

**⚠️ Stop exercise if:**
- Chest pain or pressure
- Shortness of breath
- Dizziness or fainting
- Unusual fatigue

Would you like specific exercise examples for your condition?`;
    }

    return `🏃 **Exercise Plan for Cardiac Health**

**Target:** 150 minutes moderate + 2x strength training per week

**Moderate Intensity Options:**
- Brisk walking (30 min, 5x/week)
- Cycling (30 min, 3x/week)
- Swimming (30 min, 3x/week)
- Dancing or group fitness

**Strength Training (2x/week):**
- Bodyweight exercises (10-15 min)
- Resistance bands
- Light weights
- Functional movements

**Progression:**
- Week 1-2: Establish routine
- Week 3-4: Increase intensity
- Week 5+: Mix up activities

**Track:** Heart rate (should reach 60-70% max HR during moderate intensity)

**⚠️ Consult doctor before starting if:**
- High blood pressure
- Diabetes
- Previous cardiac events

Get started with just 10 minutes today! What type of activity interests you?`;
  }

  /**
   * Get Indian heart-healthy diet recommendations
   */
  private getDietResponse(): string {
    return `🥘 **Indian Heart-Healthy Diet**

**FOODS TO INCREASE:**
✅ Vegetables: Leafy greens, bell peppers, tomatoes, carrots
✅ Whole grains: Brown rice, whole wheat, oats, millets
✅ Proteins: Fish (2x/week), lentils (dal), chickpeas, tofu
✅ Oils: 1-2 tsp olive oil or mustard oil per meal
✅ Spices: Turmeric, cumin, coriander, ginger, garlic (anti-inflammatory)
✅ Dairy: Low-fat milk, yogurt (dahi), paneer (limited)

**FOODS TO REDUCE:**
❌ Saturated fats: Butter, ghee, coconut oil, cream
❌ Refined grains: White rice, white bread, maida
❌ Processed foods: Chips, cookies, instant noodles
❌ High sodium: Pickles, papad, processed meats
❌ Sugary drinks: Soda, sweetened juices, energy drinks
❌ Fried foods: Samosa, pakora (limit to occasional)

**INDIAN MEAL IDEAS:**
- Roti + vegetable curry + dal + salad
- Pulao with vegetables (minimal oil)
- Rasam with whole wheat rice
- Vegetable khichdi
- Moong sprouts salad
- Grilled tandoori vegetables

**Portion Control:** 1 palm-sized portion of protein per meal

Would you like specific recipes or meal plans?`;
  }

  /**
   * Get high-risk profile response
   */
  private getHighRiskResponse(riskScore: number, message: string): string {
    return `⚠️ **Your HIGH-RISK Profile - What You Should Know**

Your risk score of ${riskScore.toFixed(0)}% indicates significant cardiac risk.

**IMMEDIATE PRIORITIES:**
1. **See cardio doctor within 1 week** - Don't delay
2. **Get tests done:** ECG, stress test, lipid panel, blood sugar
3. **Identify main risk factors** - Usually smoking, BP, cholesterol, or diabetes
4. **Start medications** - As recommended by doctor
5. **Lifestyle changes** - These are critical and reduce risk by 30-50%

**Your main risk drivers (based on your profile):**
${this.getMainRiskFactors(message)}

**What others with high risk have done successfully:**
- Quit smoking → Risk reduced 20% in 1 year
- BP control → Prevents stroke and MI
- Cholesterol meds → Reduce risk by 30%
- Regular exercise → 20% risk reduction
- Stress management → Lowers BP and inflammation

**Track your progress:**
- BP readings daily
- Weight weekly
- Mood and stress levels
- Exercise minutes
- Medication adherence

Would you like help tracking these or understanding your specific risk factors?`;
  }

  /**
   * Handle educational health responses
   */
  private handleEducationalResponse(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('cholesterol')) {
      return this.getCholesterolEducation();
    }

    if (lowerMsg.includes('blood pressure') || lowerMsg.includes('bp')) {
      return this.getBloodPressureEducation();
    }

    return `👋 Hi! I'm here to help with cardiac health questions. How can I assist you today?`;
  }

  /**
   * Get cholesterol education content
   */
  private getCholesterolEducation(): string {
    return `💊 **Understanding Cholesterol for Cardiac Health**

**What is cholesterol?**
Cholesterol is a fat-like substance your body needs. But too much causes buildup in arteries.

**Two main types:**

**LDL - "Bad" Cholesterol:**
- Builds up in artery walls
- Causes plaque and narrowing
- Target: <100 mg/dL (optimal), <70 for high-risk

**HDL - "Good" Cholesterol:**
- Removes LDL from arteries
- Higher is better
- Target: >40 mg/dL for men, >50 for women

**Total Cholesterol:**
- Ideally <200 mg/dL
- Combination of LDL, HDL, and triglycerides

**Indian population note:**
- Indians tend to have lower HDL
- Higher Lp(a) variant common (genetic risk)
- Earlier onset of high cholesterol
- More aggressive treatment often needed

**How to improve:**
- Mediterranean/DASH diet
- Statins (most common medication)
- Regular exercise
- Reduce saturated fats
- Increase fiber and plant sterols

Your numbers are important - ask your doctor for lipid profile.

Want to know about specific medications or dietary changes?`;
  }

  /**
   * Get blood pressure education content
   */
  private getBloodPressureEducation(): string {
    return `🩸 **Understanding Blood Pressure**

**Reading:** 120/80 (Systolic/Diastolic)

**Categories:**
- **Normal:** <120/<80
- **Elevated:** 120-129/<80
- **Stage 1 HTN:** 130-139/80-89
- **Stage 2 HTN:** ≥140/≥90
- **Hypertensive crisis:** >180/>120 (EMERGENCY)

**Systolic (top number):** Pressure when heart pumps
**Diastolic (bottom number):** Pressure when heart rests

**Why it matters:**
- High BP damages blood vessels
- Increases heart attack and stroke risk
- Often called "silent killer" - usually no symptoms

**Indian context:**
- 1 in 3 Indians have hypertension
- Often undiagnosed or uncontrolled
- Genetic factors increase risk
- Urban lifestyle (stress, diet) contributes

**Management:**
- DASH diet (lots of fruits, vegetables)
- Reduce salt (<2300mg/day)
- Regular exercise
- Weight management
- Stress reduction
- Medications if lifestyle changes insufficient

**Monitoring:** Check BP regularly at home

Want specific strategies to lower BP naturally?`;
  }

  /**
   * Handle medical information responses
   */
  private handleMedicalResponse(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('medication')) {
      return this.getMedicationInformation();
    }

    return `👋 Hi! I'm here to help with cardiac health questions. How can I assist you today?`;
  }

  /**
   * Get medication information content
   */
  private getMedicationInformation(): string {
    return `💊 **Common Cardiac Medications Explained**

**Statins** (Atorvastatin, Rosuvastatin)
- Purpose: Lower cholesterol
- Take: Once daily, usually evening
- Benefits: Prevent plaque buildup
- Common side effects: Muscle aches (rare)

**ACE Inhibitors** (Lisinopril, Enalapril) / **ARBs** (Losartan)
- Purpose: Lower BP, protect heart
- Take: Once or twice daily
- Benefits: Prevent heart remodeling
- Side effect: Dry cough (ACE-I), low BP

**Beta Blockers** (Metoprolol, Atenolol)
- Purpose: Slow heart rate, lower BP
- Take: Once or twice daily
- Benefits: Less stress on heart
- Side effects: Fatigue, low heart rate

**Diuretics** ("Water pills")
- Purpose: Lower BP by reducing fluid
- Take: Usually morning
- Benefits: Reduce workload on heart
- Side effect: More frequent urination

**Aspirin**
- Purpose: Prevent blood clots
- Take: Low-dose daily (if recommended)
- Benefits: Prevent heart attacks and strokes
- Risk: Bleeding

**⚠️ IMPORTANT:**
- Always take as prescribed
- Don't stop without doctor approval
- Report all side effects
- Take other medications as directed

**Note:** This is education only. Work with YOUR doctor on YOUR medications.

Have specific questions about medications?`;
  }

  /**
   * Handle general health responses
   */
  private handleGeneralResponse(): string {
    const generalResponses = [
      `👋 Great question! I'm here to help you understand cardiac health. Ask me about:
- Risk factors and how they affect you
- Lifestyle changes for heart health
- Understanding medical tests
- Diet and exercise recommendations
- Medications and their purposes
- Indian population-specific cardiac concerns

What would you like to learn about?`,

      `💗 Heart health is important, and I'm glad you're asking questions! I can help explain:
- What your risk score means
- How to lower your cardiac risk
- Lifestyle modifications that work
- Diet and exercise strategies
- When to see a doctor
- Understanding cardiac terms

What's on your mind?`,

      `🏥 Good to see you're proactive about your health! I can provide information on:
- Cardiac risk factors
- Prevention strategies
- Healthy lifestyle changes
- Understanding medical terms
- When to seek immediate care
- Indian health resources

What would help you most?`,

      `📚 You're in the right place! I specialize in cardiac health education for Indian patients. Feel free to ask about:
- Risk factors
- Prevention and lifestyle
- Understanding tests
- Medications and treatments
- When to seek care
- Specific health concerns

What can I explain for you?`,

      `🎯 I'm here to help you navigate cardiac health. You can ask me about:
- Assessing your cardiac risk
- Making healthier choices
- Understanding your results
- Lifestyle recommendations
- When professional help is needed
- Cardiac health for Indians

What interests you?`
    ];

    const randomResponse = generalResponses[Math.floor(Math.random() * generalResponses.length)];
    return randomResponse;
  }

  /**
   * Get follow-up questions to continue conversation
   */
  private generateFollowUpQuestions(userMessage: string, type?: string): string[] {
    const lowerMsg = userMessage.toLowerCase();
    const questions: string[] = [];

    if (lowerMsg.includes('risk')) {
      questions.push(
        'What are my main risk factors?',
        'How can I lower my risk?',
        'When should I see a doctor?'
      );
    }

    if (lowerMsg.includes('exercise') || lowerMsg.includes('workout')) {
      questions.push(
        'What exercise is best for my condition?',
        'How much exercise should I do?',
        'Can I do intense exercise?'
      );
    }

    if (lowerMsg.includes('diet') || lowerMsg.includes('food')) {
      questions.push(
        'What foods should I avoid?',
        'Are there specific Indian foods that are healthy?',
        'What about salt and oil?'
      );
    }

    if (lowerMsg.includes('medication')) {
      questions.push(
        'What are the side effects?',
        'How long do I need to take it?',
        'Can I stop if I feel better?'
      );
    }

    if (questions.length === 0) {
      questions.push(
        'Tell me more - what specific aspect?',
        'Do you have other health concerns?',
        'Would you like personalized recommendations?'
      );
    }

    return questions.slice(0, 3);
  }

  /**
   * Generate references/sources
   */
  private generateReferences(message: string): string[] {
    return [
      '📖 Indian College of Cardiologists Guidelines',
      '🏥 Framingham Heart Study',
      '🔬 WHO Cardiovascular Disease Prevention',
      '🌏 PURE India Cohort Study',
      '📚 National Heart Foundation of India'
    ];
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(message: string, riskScore?: number): string {
    return `${message.substring(0, 50)}_${riskScore || 'none'}`;
  }

  /**
   * Get main risk factors from message
   */
  private getMainRiskFactors(patientProfile: string): string {
    const risks: string[] = [];
    if (patientProfile.toLowerCase().includes('smoking')) risks.push('🚭 Smoking - Highest modifiable risk');
    if (patientProfile.toLowerCase().includes('diabetes')) risks.push('🩸 Diabetes - Metabolic risk');
    if (patientProfile.toLowerCase().includes('pressure')) risks.push('🩸 High Blood Pressure');
    if (patientProfile.toLowerCase().includes('cholesterol')) risks.push('💊 High Cholesterol');
    if (patientProfile.toLowerCase().includes('sedentary')) risks.push('🛋️ Sedentary lifestyle');
    return risks.length > 0 ? risks.join('\n') : '- Your main risk factors from assessment';
  }

  /**
   * Fallback response if everything fails
   */
  private getFallbackResponse(message: string): ChatResponse {
    return {
      message: `I appreciate your question about "${message.substring(0, 30)}..."

I'm having trouble processing this right now, but I can help with:
- General cardiac health questions
- Lifestyle recommendations
- Understanding test results
- Risk factor management

Could you rephrase your question or ask about one of these topics?`,
      type: 'general',
      followUpQuestions: [
        'Tell me about cardiac risk factors',
        'What lifestyle changes help most?',
        'When should I see a doctor?'
      ]
    };
  }

  /**
   * Clear old conversations to free memory
   */
  clearOldConversations(maxAge: number = 3600000) {
    // In production, track timestamps and remove old ones
    // This is a simplified version
    if (this.conversationContexts.size > 10) {
      const firstKey = this.conversationContexts.keys().next().value;
      this.conversationContexts.delete(firstKey);
    }
  }
}

export const enhancedCardiacChatService = new EnhancedCardiacChatService();
