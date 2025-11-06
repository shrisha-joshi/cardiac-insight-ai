/**
 * DEEPSEEK API INTEGRATION
 * 
 * DeepSeek Integration for:
 * 1. Medical recommendations (FREE - no cost)
 * 2. Intelligent chatbot responses
 * 3. Research summary generation
 * 4. Patient education content
 * 5. Multi-language support
 * 
 * Why DeepSeek:
 * ✅ FREE tier available
 * ✅ No API key charge for basic usage
 * ✅ High accuracy for medical content
 * ✅ Supports Chinese medical standards
 * ✅ Faster response time than Gemini
 * ✅ Good alternative/backup to Gemini
 */

interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface MedicalRecommendation {
  recommendation: string;
  reasoning: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ChatbotResponse {
  message: string;
  type: 'medical' | 'educational' | 'personalized' | 'emergency' | 'general';
  followUpQuestions: string[];
  sources: string[];
}

class DeepSeekIntegration {
  private apiKey: string = '';
  private apiUrl: string = 'https://api.deepseek.com/v1/chat/completions';
  private model: string = 'deepseek-chat';
  private enabled: boolean = false;
  private conversationHistory: Map<string, DeepSeekMessage[]> = new Map();
  private responseCache: Map<string, string> = new Map();

  constructor() {
    // Check for DeepSeek API key from environment
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
    this.enabled = !!this.apiKey;

    if (this.enabled) {
      console.log('✅ DeepSeek API enabled');
    } else {
      console.log('ℹ️ DeepSeek API not configured (will use fallback)');
    }
  }

  /**
   * Generate medical recommendations using DeepSeek
   */
  async generateMedicalRecommendations(
    riskScore: number,
    riskLevel: string,
    age: number,
    conditions: string[],
    riskFactors: string[]
  ): Promise<MedicalRecommendation[]> {
    try {
      if (!this.enabled) {
        return this.getFallbackRecommendations(riskLevel, age);
      }

      const cacheKey = `recs_${riskScore}_${riskLevel}_${age}`;
      if (this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const systemPrompt = `You are a highly qualified cardiac health advisor with expertise in:
- Cardiovascular disease prevention and management
- Evidence-based medical recommendations
- Indian population cardiac epidemiology
- Patient education and lifestyle modification

Provide SPECIFIC, actionable medical recommendations with evidence.
Include medication names, dosages, targets, and timelines where applicable.
For Indian patients, include Ayurvedic and traditional medicine options.`;

      const userPrompt = `Generate 5-7 specific medical recommendations for:
- Risk Score: ${riskScore}% (Risk Level: ${riskLevel})
- Age: ${age}
- Conditions: ${conditions.join(', ') || 'None'}
- Risk Factors: ${riskFactors.join(', ') || 'None'}

For each recommendation:
1. Be specific (include dosages, targets, timelines)
2. Provide reasoning/evidence
3. Include alternatives where applicable
4. For Indian patients: mention traditional options

Format as JSON array with fields: recommendation, reasoning, source, confidence`;

      const response = await this.callDeepSeekAPI(systemPrompt, userPrompt);
      
      if (!response) {
        return this.getFallbackRecommendations(riskLevel, age);
      }

      try {
        // Parse JSON response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0]);
          this.responseCache.set(cacheKey, JSON.stringify(recommendations));
          return recommendations;
        }
      } catch (parseError) {
        console.log('Error parsing DeepSeek JSON:', parseError);
        return this.parseRecommendationsFromText(response, riskLevel);
      }

      return this.getFallbackRecommendations(riskLevel, age);
    } catch (error) {
      console.error('DeepSeek medical recommendations error:', error);
      return this.getFallbackRecommendations(riskLevel, age);
    }
  }

  /**
   * Generate intelligent chatbot response using DeepSeek
   */
  async generateChatbotResponse(
    userMessage: string,
    userId?: string,
    riskScore?: number,
    age?: number,
    gender?: string
  ): Promise<ChatbotResponse> {
    try {
      if (!this.enabled) {
        return this.getFallbackChatResponse(userMessage);
      }

      const cacheKey = userMessage.toLowerCase().substring(0, 50);
      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse) {
        try {
          return JSON.parse(cachedResponse);
        } catch (e) {
          // Continue with API call if cache parse fails
        }
      }

      // Get conversation history
      const conversationKey = userId || 'default';
      const messages = this.conversationHistory.get(conversationKey) || [];

      const systemPrompt = `You are a compassionate and knowledgeable cardiac health chatbot.
Your goals:
1. Provide accurate medical information
2. Support patient understanding of heart health
3. Encourage healthy lifestyle changes
4. Recognize emergencies and provide immediate guidance
5. For Indian patients: include relevant cultural and traditional medicine context

Be conversational, supportive, and evidence-based.
For emergencies (chest pain, breathlessness), always respond with immediate action steps.`;

      const patientContext = `Patient Context (if available):
${age ? `- Age: ${age}` : ''}
${gender ? `- Gender: ${gender}` : ''}
${riskScore ? `- Risk Score: ${riskScore}%` : ''}`;

      const fullSystemPrompt = `${systemPrompt}\n${patientContext}`;

      // Add user message to conversation history
      const updatedMessages: DeepSeekMessage[] = [
        ...messages.slice(-10), // Keep last 10 messages
        { role: 'user', content: userMessage }
      ];

      // Call DeepSeek
      const response = await this.callDeepSeekAPIWithHistory(
        fullSystemPrompt,
        updatedMessages
      );

      if (!response) {
        return this.getFallbackChatResponse(userMessage);
      }

      // Parse response
      const chatResponse = this.parseChartbotResponse(response, userMessage);

      // Update conversation history
      updatedMessages.push({ role: 'assistant', content: response });
      this.conversationHistory.set(conversationKey, updatedMessages);

      // Cache response
      this.responseCache.set(cacheKey, JSON.stringify(chatResponse));

      return chatResponse;
    } catch (error) {
      console.error('DeepSeek chatbot error:', error);
      return this.getFallbackChatResponse(userMessage);
    }
  }

  /**
   * Generate research summary using DeepSeek
   */
  async generateResearchSummary(topic: string, depth: 'brief' | 'detailed' = 'brief'): Promise<string> {
    try {
      if (!this.enabled) {
        return `Research on ${topic}: Please consult medical databases like PubMed for latest information.`;
      }

      const cacheKey = `research_${topic}_${depth}`;
      if (this.responseCache.has(cacheKey)) {
        return this.responseCache.get(cacheKey) || '';
      }

      const systemPrompt = `You are a medical researcher specializing in cardiovascular disease.
Provide accurate, evidence-based summaries of medical research.
Include key findings, implications, and recommendations.`;

      const userPrompt = depth === 'brief'
        ? `Provide a 2-3 sentence summary of latest research on: ${topic}`
        : `Provide a detailed summary (5-7 sentences) of latest research on: ${topic}. Include key studies, findings, and clinical implications.`;

      const response = await this.callDeepSeekAPI(systemPrompt, userPrompt);

      if (response) {
        this.responseCache.set(cacheKey, response);
      }

      return response || `Information about ${topic} is being researched.`;
    } catch (error) {
      console.error('DeepSeek research summary error:', error);
      return `Research on ${topic}: Please consult PubMed for latest studies.`;
    }
  }

  /**
   * Generate patient education content
   */
  async generatePatientEducation(
    topic: string,
    complexity: 'simple' | 'moderate' | 'technical' = 'moderate'
  ): Promise<string> {
    try {
      if (!this.enabled) {
        return this.getDefaultEducationContent(topic);
      }

      const cacheKey = `education_${topic}_${complexity}`;
      if (this.responseCache.has(cacheKey)) {
        return this.responseCache.get(cacheKey) || '';
      }

      const systemPrompt = `You are a medical educator specializing in patient health literacy.
Create clear, accurate health education content appropriate for patients.
Use analogies and simple language.
Include practical tips and when to seek help.`;

      const complexityLevel = complexity === 'simple'
        ? 'simple language, like explaining to a friend'
        : complexity === 'moderate'
        ? 'clear medical terms with explanations'
        : 'detailed medical terminology for healthcare professionals';

      const userPrompt = `Create patient education content about "${topic}".
Style: ${complexityLevel}
Include: What it is, why it matters, what to do, when to seek help`;

      const response = await this.callDeepSeekAPI(systemPrompt, userPrompt);

      if (response) {
        this.responseCache.set(cacheKey, response);
      }

      return response || this.getDefaultEducationContent(topic);
    } catch (error) {
      console.error('DeepSeek education content error:', error);
      return this.getDefaultEducationContent(topic);
    }
  }

  /**
   * Call DeepSeek API
   */
  private async callDeepSeekAPI(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        console.error(`DeepSeek API error: ${response.status}`);
        return '';
      }

      const data: DeepSeekResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek API call error:', error);
      return '';
    }
  }

  /**
   * Call DeepSeek API with conversation history
   */
  private async callDeepSeekAPIWithHistory(
    systemPrompt: string,
    messages: DeepSeekMessage[]
  ): Promise<string> {
    try {
      const allMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
      ];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: allMessages,
          temperature: 0.8,
          max_tokens: 1000,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        console.error(`DeepSeek API error: ${response.status}`);
        return '';
      }

      const data: DeepSeekResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek API call error:', error);
      return '';
    }
  }

  /**
   * Parse chatbot response
   */
  private parseChartbotResponse(response: string, userMessage: string): ChatbotResponse {
    // Detect message type
    let type: ChatbotResponse['type'] = 'general';

    const emergencyKeywords = ['chest pain', 'breathless', 'heart attack', 'stroke', 'severe'];
    if (emergencyKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
      type = 'emergency';
    } else if (userMessage.toLowerCase().includes('why') || userMessage.toLowerCase().includes('how')) {
      type = 'educational';
    } else if (userMessage.toLowerCase().includes('my') || userMessage.toLowerCase().includes('i')) {
      type = 'personalized';
    } else if (
      userMessage.toLowerCase().includes('medicine') ||
      userMessage.toLowerCase().includes('medication') ||
      userMessage.toLowerCase().includes('symptom')
    ) {
      type = 'medical';
    }

    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(userMessage, type);

    // Extract sources
    const sources = this.extractSources(response);

    return {
      message: response,
      type,
      followUpQuestions,
      sources
    };
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(
    userMessage: string,
    messageType: ChatbotResponse['type']
  ): string[] {
    const questions: string[] = [];

    if (messageType === 'medical') {
      questions.push('What are the side effects of this medication?');
      questions.push('How long will treatment take?');
      questions.push('Are there any alternatives?');
    } else if (messageType === 'educational') {
      questions.push('Can lifestyle changes help?');
      questions.push('What are warning signs I should watch for?');
      questions.push('When should I see a doctor?');
    } else if (messageType === 'personalized') {
      questions.push('What specific changes should I make?');
      questions.push('How can I track my progress?');
      questions.push('What is my treatment timeline?');
    }

    return questions.slice(0, 3);
  }

  /**
   * Extract sources from response
   */
  private extractSources(response: string): string[] {
    const sources: string[] = [];

    // Look for common medical sources
    if (response.toLowerCase().includes('who') || response.toLowerCase().includes('world health')) {
      sources.push('WHO Guidelines');
    }
    if (response.toLowerCase().includes('icc') || response.toLowerCase().includes('indian college')) {
      sources.push('Indian College of Cardiologists');
    }
    if (response.toLowerCase().includes('study') || response.toLowerCase().includes('trial')) {
      sources.push('Medical Research');
    }
    if (response.toLowerCase().includes('fda')) {
      sources.push('FDA Approval');
    }

    if (sources.length === 0) {
      sources.push('Medical Evidence');
    }

    return sources;
  }

  /**
   * Parse recommendations from text
   */
  private parseRecommendationsFromText(
    text: string,
    riskLevel: string
  ): MedicalRecommendation[] {
    const recommendations: MedicalRecommendation[] = [];

    const lines = text.split('\n').filter(line => line.trim().length > 10);

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      recommendations.push({
        recommendation: line.trim(),
        reasoning: 'Based on cardiac health guidelines',
        source: 'DeepSeek AI Analysis',
        confidence: riskLevel === 'high' ? 'high' : 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Fallback recommendations
   */
  private getFallbackRecommendations(riskLevel: string, age: number): MedicalRecommendation[] {
    const recommendations: MedicalRecommendation[] = [
      {
        recommendation: 'Schedule regular cardiology check-ups',
        reasoning: 'Essential for monitoring cardiac health',
        source: 'Medical Best Practice',
        confidence: 'high'
      },
      {
        recommendation: 'Maintain regular physical activity (150 min/week)',
        reasoning: 'Proven cardiovascular benefit',
        source: 'WHO Guidelines',
        confidence: 'high'
      },
      {
        recommendation: 'Follow heart-healthy diet',
        reasoning: 'Reduces cardiovascular risk',
        source: 'Dietary Guidelines',
        confidence: 'high'
      }
    ];

    if (riskLevel === 'high') {
      recommendations.push({
        recommendation: 'Discuss medications with cardiologist',
        reasoning: 'May require pharmacological intervention',
        source: 'Medical Guidelines',
        confidence: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Fallback chatbot response
   */
  private getFallbackChatResponse(userMessage: string): ChatbotResponse {
    // Check for emergency keywords
    const emergencyKeywords = ['chest pain', 'breathless', 'heart attack', 'stroke'];
    if (emergencyKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
      return {
        message: '🚨 EMERGENCY: Call 108 (India) or 911 (US) immediately! Do not delay. Describe your symptoms to the dispatcher.',
        type: 'emergency',
        followUpQuestions: ['Are you currently in a safe location?', 'Do you have aspirin available?'],
        sources: ['Emergency Protocol']
      };
    }

    return {
      message: 'Thank you for your question. For specific medical advice, please consult with a healthcare professional.',
      type: 'general',
      followUpQuestions: ['What would you like to know more about?', 'Do you have any symptoms I should know about?'],
      sources: ['General Information']
    };
  }

  /**
   * Default education content
   */
  private getDefaultEducationContent(topic: string): string {
    const topics: { [key: string]: string } = {
      'cholesterol': 'Cholesterol is a substance needed for body function. Too much can build up in arteries. Manage it through diet, exercise, and medications if needed.',
      'blood pressure': 'Blood pressure measures force of blood on artery walls. High BP (>130/80) increases heart disease risk. Regular monitoring is important.',
      'diabetes': 'Diabetes affects blood sugar levels and increases cardiac risk. Management includes diet, exercise, monitoring, and medications.',
      'exercise': 'Regular exercise strengthens the heart, lowers BP, and improves overall health. Aim for 150 minutes of moderate activity per week.',
      'diet': 'Heart-healthy diet includes whole grains, vegetables, lean proteins, and healthy fats. Limit salt, sugar, and processed foods.',
      'smoking': 'Smoking damages blood vessels and increases heart disease risk significantly. Quitting provides immediate and long-term benefits.'
    };

    return topics[topic.toLowerCase()] || `Learn more about ${topic} by consulting healthcare professionals or reliable medical websites.`;
  }

  /**
   * Check if DeepSeek is available
   */
  isAvailable(): boolean {
    return this.enabled;
  }

  /**
   * Clear cache (call periodically to manage memory)
   */
  clearCache(): void {
    this.responseCache.clear();
    console.log('DeepSeek cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.responseCache.size;
  }
}

// Export singleton instance
export const deepseekIntegration = new DeepSeekIntegration();
