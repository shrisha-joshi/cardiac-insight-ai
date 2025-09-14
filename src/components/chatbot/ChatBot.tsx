import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { mlService } from '@/services/mlService';
import { enhancedAiService } from '@/services/enhancedAIService';
import { PatientData, PredictionResult } from '@/lib/mockData';
import { MessageCircle, Send, Bot, User, Heart, Stethoscope, Activity } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

interface AssessmentHistory {
  id: string;
  user_id: string;
  assessment_date: string;
  patient_data: PatientData;
  prediction_result: PredictionResult;
  created_at: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Add welcome message with medical disclaimer
    // Add welcome message on component mount
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now().toString(),
      type: 'bot',
      content: `👋 Welcome to your AI Health Assistant!

**⚠️ IMPORTANT MEDICAL DISCLAIMER:**
I'm designed to provide educational information about heart health, but I am **NOT a substitute for professional medical care**. 

**I CANNOT:**
• Diagnose medical conditions
• Provide medical advice or treatment
• Replace consultation with healthcare providers
• Handle medical emergencies

**🚨 FOR EMERGENCIES:** If you're experiencing chest pain, shortness of breath, or other concerning symptoms, **call emergency services immediately** (911, 999, 112).

**What I CAN help with:**
• General heart health education
• Understanding risk factors
• Lifestyle recommendations
• Questions to ask your healthcare provider

**Always consult qualified healthcare professionals for medical advice, diagnosis, and treatment.**

How can I help you learn about heart health today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type: 'user' | 'bot', content: string, data?: Record<string, unknown>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = useCallback((content: string, data?: Record<string, unknown>) => {
    addMessage('bot', content, data);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);
    setLoading(true);

    try {
      const response = await processUserMessage(userMessage);
      addBotMessage(response.content, response.data);
    } catch (error) {
      addBotMessage("I apologize, but I'm having trouble processing your request right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const processUserMessage = async (message: string): Promise<{ content: string; data?: Record<string, unknown> }> => {
    try {
      // Use the enhanced AI service with comprehensive medical disclaimers
      const response = await enhancedAiService.getChatResponse(message, 'user123', { user });
      
      // If user is asking about their medical history and is logged in
      if (user && message.toLowerCase().includes('history')) {
        try {
          const history = await mlService.getMedicalHistory(user.id);
          if (history.length > 0) {
            const recentAssessment = history[0];
            const riskLevel = recentAssessment.prediction_result?.prediction?.riskLevel || 'Unknown';
            const riskScore = recentAssessment.prediction_result?.prediction?.riskScore || 0;
            
            response.content += `\n\n**Your Recent Assessment Data:**\n`;
            response.content += `• Total Assessments: ${history.length}\n`;
            response.content += `• Most Recent Risk Level: ${riskLevel}\n`;
            response.content += `• Most Recent Risk Score: ${riskScore.toFixed(1)}%\n\n`;
            response.content += `**⚠️ MEDICAL DISCLAIMER:** This historical data is for educational review only. Please discuss these results with your healthcare provider for proper medical interpretation and guidance.`;
            
            response.data = { history: history.slice(0, 3) };
          }
        } catch (error) {
          console.error('Error fetching medical history:', error);
        }
      }
      
      return response;
    } catch (error) {
      console.error('AI service error:', error);
      return {
        content: `I apologize, but I'm experiencing technical difficulties. 

**⚠️ MEDICAL DISCLAIMER:** If you're experiencing a medical emergency or have urgent health concerns, please contact emergency services immediately (911, 999, 112) or your healthcare provider.

For general heart health questions, please try asking again in a moment.`
      };
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Health Assistant</h1>
          <p className="text-muted-foreground">
            Get personalized heart health insights and recommendations
          </p>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-medical-primary" />
              Health Assistant Chat
              <Badge variant="secondary" className="ml-auto">
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-medical-primary text-white' 
                        : 'bg-medical-secondary text-white'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className={`flex flex-col max-w-[80%] ${
                      message.type === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-medical-primary text-white'
                          : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                      
                      {message.data && message.data.history && (
                        <div className="mt-2 space-y-2 w-full">
                          <p className="text-xs text-muted-foreground">Recent Assessments:</p>
                          {(message.data.history as AssessmentHistory[]).map((assessment: AssessmentHistory, index: number) => (
                            <div key={index} className="bg-accent/50 p-2 rounded text-xs">
                              <div className="flex justify-between items-center">
                                <span>
                                  {new Date(assessment.assessment_date).toLocaleDateString()}
                                </span>
                                <Badge variant={
                                  assessment.prediction_result?.riskLevel === 'low' ? 'secondary' :
                                  assessment.prediction_result?.riskLevel === 'medium' ? 'default' : 'destructive'
                                }>
                                  {assessment.prediction_result?.riskLevel || 'Unknown'} Risk
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-medical-secondary text-white flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-medical-secondary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-medical-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-medical-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about heart health, risk factors, or your medical history..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={loading || !inputMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Stethoscope className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  This AI assistant provides general health information. Always consult healthcare professionals for medical advice.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}