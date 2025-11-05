import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { mlService } from '@/services/mlService';
import { cardiacChatService } from '@/services/cardiacChatService';
import { PatientData, PredictionResult } from '@/lib/mockData';
import { MessageCircle, Send, Bot, User, Heart, Stethoscope, Activity, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  status?: 'sending' | 'sent' | 'error';
  copied?: boolean;
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Add welcome message with medical disclaimer
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
      timestamp: new Date(),
      status: 'sent'
    };
    setMessages([welcomeMessage]);
    
    // Focus input field
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type: 'user' | 'bot', content: string, data?: Record<string, unknown>, status: 'sending' | 'sent' | 'error' = 'sent') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data,
      status
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = useCallback((content: string, data?: Record<string, unknown>) => {
    addMessage('bot', content, data, 'sent');
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage, undefined, 'sent');
    setLoading(true);

    try {
      const response = await processUserMessage(userMessage);
      addBotMessage(response.content, response.data);
    } catch (error) {
      console.error('Chat error:', error);
      addBotMessage("I apologize, but I'm having trouble processing your request right now. Please try again later.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const processUserMessage = async (message: string): Promise<{ content: string; data?: Record<string, unknown> }> => {
    try {
      // Check for emergencies
      if (cardiacChatService.detectEmergency(message)) {
        return {
          content: `🚨 **MEDICAL EMERGENCY DETECTED**

If you're experiencing chest pain, shortness of breath, or other severe symptoms:

**CALL EMERGENCY SERVICES IMMEDIATELY:**
- 🇺🇸 USA: Call 911
- 🇬🇧 UK: Call 999  
- 🇪🇺 Europe: Call 112
- 🇮🇳 India: Call 108 or 102

**Do not wait. Do not delay. Seek emergency help now.**

If this is not an emergency, I'm here to provide cardiac health information.`
        };
      }

      // Get cardiac-specific response
      const cardiacResponse = await cardiacChatService.getCardiacResponse(message, {
        age: user ? 50 : undefined,
        gender: user ? 'male' : undefined,
        riskLevel: 'medium'
      });
      
      // If user asking about history and is logged in
      if (user && message.toLowerCase().includes('history')) {
        try {
          const history = await mlService.getMedicalHistory(user.id);
          if (history.length > 0) {
            const recentAssessment = history[0];
            const riskLevel = recentAssessment.prediction_result?.prediction?.riskLevel || 'Unknown';
            const riskScore = recentAssessment.prediction_result?.prediction?.riskScore || 0;
            
            return {
              content: cardiacResponse + `\n\n**📊 Your Recent Assessment Data:**\n• Total Assessments: ${history.length}\n• Most Recent Risk Level: ${riskLevel}\n• Most Recent Risk Score: ${riskScore.toFixed(1)}%\n\n**⚠️ MEDICAL DISCLAIMER:** This historical data is for educational review only. Please discuss these results with your healthcare provider for proper medical interpretation and guidance.`,
              data: { history: history.slice(0, 3) }
            };
          }
        } catch (error) {
          console.error('Error fetching medical history:', error);
        }
      }
      
      return {
        content: cardiacResponse
      };
    } catch (error) {
      console.error('Cardiac chat service error:', error);
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

  const copyToClipboard = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, copied: true } : msg
    ));
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, copied: false } : msg
      ));
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-medical-primary rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Health Assistant</h1>
              <p className="text-muted-foreground text-sm">
                Personalized cardiac health insights & guidance
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[700px] flex flex-col shadow-lg border-0">
          {/* Header */}
          <CardHeader className="pb-3 bg-gradient-to-r from-medical-primary/5 to-medical-secondary/5 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-medical-primary" />
                Health Assistant Chat
              </CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Online
              </Badge>
            </div>
          </CardHeader>
          
          {/* Messages Area */}
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-medical-primary' 
                        : 'bg-medical-secondary'
                    } shadow-sm`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-xs gap-1 ${
                      message.type === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`rounded-lg px-4 py-3 shadow-sm transition-all ${
                        message.type === 'user'
                          ? 'bg-medical-primary text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-foreground rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-line leading-relaxed break-words">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* History Data Display */}
                      {message.data && message.data.history && (
                        <div className="mt-2 space-y-2 w-full max-w-sm">
                          <p className="text-xs font-semibold text-muted-foreground px-1">Recent Assessments:</p>
                          {(message.data.history as AssessmentHistory[]).map((assessment: AssessmentHistory, index: number) => (
                            <div key={index} className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-2 rounded text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-blue-900">
                                  {new Date(assessment.assessment_date).toLocaleDateString()}
                                </span>
                                <Badge variant={
                                  assessment.prediction_result?.riskLevel === 'low' ? 'secondary' :
                                  assessment.prediction_result?.riskLevel === 'medium' ? 'default' : 'destructive'
                                } className="text-xs">
                                  {assessment.prediction_result?.riskLevel || 'Unknown'} Risk
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Message Actions */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.type === 'bot' && (
                          <button
                            onClick={() => copyToClipboard(message.id, message.content)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy message"
                          >
                            {message.copied ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading Indicator */}
                {loading && (
                  <div className="flex items-start gap-3 animate-in fade-in">
                    <div className="w-8 h-8 rounded-full bg-medical-secondary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-medical-secondary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-medical-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-medical-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="text-sm text-muted-foreground ml-1">Processing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Input Area */}
            <div className="border-t bg-white p-4">
              {/* Alert Banner */}
              <Alert className="mb-3 border-blue-200 bg-blue-50 text-blue-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Medical Disclaimer:</strong> This is educational only. For emergencies, call 911/999/112. Always consult healthcare providers.
                </AlertDescription>
              </Alert>

              {/* Input Field */}
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask about heart health, risk factors, or your assessments..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1 border-gray-300 focus:border-medical-primary"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={loading || !inputMessage.trim()}
                  size="icon"
                  className="bg-medical-primary hover:bg-medical-primary/90"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Footer */}
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Stethoscope className="h-3 w-3" />
                <span>
                  Powered by AI • Educational information • Always consult healthcare professionals
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Heart className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1">Ask About Risks</p>
                  <p className="text-muted-foreground text-xs">Learn about heart disease risk factors and prevention</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Activity className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1">Lifestyle Tips</p>
                  <p className="text-muted-foreground text-xs">Get personalized recommendations for heart health</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Stethoscope className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1">Your History</p>
                  <p className="text-muted-foreground text-xs">Review your past assessments and progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}