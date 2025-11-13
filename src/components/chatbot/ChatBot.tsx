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
import { enhancedCardiacChatService } from '@/services/enhancedCardiacChatService';
import { PatientData, PredictionResult } from '@/lib/mockData';
import { MessageCircle, Send, Bot, User, Heart, Stethoscope, Activity, AlertTriangle, Loader2, Copy, Check, Sparkles, TrendingUp, Shield } from 'lucide-react';
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
  const [isTyping, setIsTyping] = useState(false);
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
    setIsTyping(true);

    try {
      // Add slight delay for more natural feel
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await processUserMessage(userMessage);
      setIsTyping(false);
      // Simulate typing effect
      await new Promise(resolve => setTimeout(resolve, 300));
      addBotMessage(response.content, response.data);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Chat error:', error);
      setIsTyping(false);
      addBotMessage("I apologize, but I'm having trouble processing your request right now. Please try again later.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const processUserMessage = async (message: string): Promise<{ content: string; data?: Record<string, unknown> }> => {
    try {
      // Use enhanced cardiac chat service for intelligent, varied responses
      const chatResponse = await enhancedCardiacChatService.processMessage(
        message,
        user?.id,
        undefined, // riskScore - can be fetched from context
        50, // placeholder age
        'unknown' // placeholder gender
      );

      let fullContent = chatResponse.message;

      // Add follow-up questions if provided
      if (chatResponse.followUpQuestions && chatResponse.followUpQuestions.length > 0) {
        fullContent += '\n\n**🤔 You might also want to ask:**\n';
        chatResponse.followUpQuestions.forEach(q => {
          fullContent += `• ${q}\n`;
        });
      }

      // Add references if educational
      if (chatResponse.type === 'educational' && chatResponse.references) {
        fullContent += '\n\n**📚 References:**\n';
        chatResponse.references.forEach(ref => {
          fullContent += `• ${ref}\n`;
        });
      }

      // Add history if user logged in and asking about it
      if (user && message.toLowerCase().includes('history')) {
        try {
          const history = await mlService.getMedicalHistory(user.id);
          if (history.length > 0) {
            fullContent += `\n\n**📊 Your Assessment History:**\nTotal Assessments: ${history.length}`;
          }
        } catch (error) {
          if (import.meta.env.DEV) console.error('Error fetching history:', error);
        }
      }

      return {
        content: fullContent,
        data: {
          type: chatResponse.type,
          timestamp: new Date()
        }
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Cardiac chat service error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4 transition-colors duration-300">
      <div className="container mx-auto max-w-5xl">
        {/* Animated Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-2xl blur-xl opacity-50 dark:opacity-40 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-red-500/20">
                <Heart className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-medical-primary ">
                AI Health Assistant
              </h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                Personalized cardiac health insights powered by advanced AI
              </p>
            </div>
          </div>
        </div>

        {/* Main Chat Container */}
        <Card className="h-[750px] flex flex-col shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500 dark:shadow-slate-950/50">
          {/* Gradient Header */}
          <CardHeader className="pb-4 bg-gradient-to-r from-medical-primary/10 via-purple-50 to-medical-secondary/10 dark:from-medical-primary/20 dark:via-purple-900/20 dark:to-medical-secondary/20 border-b border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-950/50">
                  <MessageCircle className="h-5 w-5 text-medical-primary dark:text-red-400" />
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Health Chat
                </span>
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-300 border-green-200/50 dark:border-green-700/50 shadow-sm px-3 py-1">
                  <div className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 dark:bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600 dark:bg-green-400"></span>
                  </div>
                  AI Active
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          {/* Messages Area with Custom Scrollbar */}
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-950/50">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-3 ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Enhanced Avatar with Gradient Border */}
                    <div className={`relative flex-shrink-0 ${message.type === 'user' ? 'animate-in zoom-in' : 'animate-in zoom-in'}`}>
                      <div className={`absolute inset-0 rounded-full blur-md opacity-50 dark:opacity-40 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700' 
                          : 'bg-gradient-to-r from-purple-400 to-pink-500 dark:from-purple-500 dark:to-pink-600'
                      }`} />
                      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg dark:shadow-slate-950/50 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-medical-primary to-blue-600 dark:from-blue-600 dark:to-blue-800' 
                          : 'bg-gradient-to-br from-medical-secondary via-purple-500 to-pink-500 dark:from-purple-600 dark:via-purple-700 dark:to-pink-600'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Message Bubble */}
                    <div className={`flex flex-col max-w-[70%] gap-2 ${
                      message.type === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`group relative rounded-2xl px-5 py-3 shadow-md transition-all duration-300 hover:shadow-xl dark:shadow-slate-950/50 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-medical-primary to-blue-600 dark:from-blue-600 dark:to-blue-800 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 text-foreground dark:text-slate-100 rounded-bl-sm hover:border-gray-300 dark:hover:border-slate-600'
                      }`}>
                        {/* Message Corner Accent */}
                        <div className={`absolute ${
                          message.type === 'user' ? '-right-1 bottom-0' : '-left-1 bottom-0'
                        } w-4 h-4 ${
                          message.type === 'user' 
                            ? 'bg-blue-600 dark:bg-blue-800' 
                            : 'bg-white dark:bg-slate-800 border-l border-b border-gray-200/50 dark:border-slate-700/50'
                        } transform rotate-45`} />
                        
                        <p className="relative text-sm whitespace-pre-line leading-relaxed break-words">
                          {message.content}
                        </p>
                        
                        {/* Gradient Overlay for Bot Messages */}
                        {message.type === 'bot' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/20 to-pink-50/0 dark:from-purple-500/0 dark:via-purple-500/5 dark:to-pink-500/0 rounded-2xl pointer-events-none" />
                        )}
                      </div>
                      
                      {/* Enhanced History Data Display */}
                      {message.data && message.data.history && (
                        <div className="mt-2 space-y-2 w-full animate-in fade-in slide-in-from-bottom-2">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            Recent Assessments:
                          </p>
                          {(message.data.history as AssessmentHistory[]).map((assessment: AssessmentHistory, idx: number) => (
                            <div 
                              key={idx} 
                              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/50 dark:border-blue-700/50 p-3 rounded-xl text-xs shadow-sm hover:shadow-md dark:shadow-slate-950/50 transition-all duration-300 transform hover:scale-[1.02]"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                  <Activity className="h-3 w-3" />
                                  {new Date(assessment.assessment_date).toLocaleDateString()}
                                </span>
                                <Badge 
                                  variant={
                                    assessment.prediction_result?.riskLevel === 'low' ? 'secondary' :
                                    assessment.prediction_result?.riskLevel === 'medium' ? 'default' : 'destructive'
                                  } 
                                  className="text-xs shadow-sm"
                                >
                                  {assessment.prediction_result?.riskLevel || 'Unknown'} Risk
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Enhanced Message Actions */}
                      <div className="flex items-center gap-3 px-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.type === 'bot' && (
                          <button
                            onClick={() => copyToClipboard(message.id, message.content)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="Copy message"
                          >
                            {message.copied ? (
                              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Enhanced Loading Indicator */}
                {(loading || isTyping) && (
                  <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-r from-purple-400 to-pink-500 dark:from-purple-500 dark:to-pink-600 opacity-50 dark:opacity-40" />
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-medical-secondary via-purple-500 to-pink-500 dark:from-purple-600 dark:via-purple-700 dark:to-pink-600 text-white flex items-center justify-center shadow-lg dark:shadow-slate-950/50">
                        <Bot className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl rounded-bl-sm px-5 py-4 shadow-md dark:shadow-slate-950/50">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-medical-secondary to-purple-500 dark:from-purple-500 dark:to-purple-600 rounded-full animate-bounce" />
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-medical-secondary dark:from-pink-600 dark:to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2 font-medium">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Enhanced Input Area */}
            <div className="border-t border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-5">
              {/* Enhanced Alert Banner */}
              <Alert className="mb-4 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-sm">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs text-blue-900 dark:text-blue-200">
                  <strong className="font-semibold">Medical Disclaimer:</strong> Educational purposes only. For emergencies, call 911/999/112. Always consult healthcare providers.
                </AlertDescription>
              </Alert>

              {/* Enhanced Input Field */}
              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <Input
                    ref={inputRef}
                    placeholder="Ask about heart health, risk factors, or your assessments..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="pr-4 py-6 border-2 border-gray-200 dark:border-slate-700 focus:border-medical-primary dark:focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white rounded-2xl shadow-sm focus:shadow-lg transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  {inputMessage && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Sparkles className="h-4 w-4 text-yellow-500 dark:text-yellow-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={loading || !inputMessage.trim()}
                  size="icon"
                  className="h-[52px] w-[52px] bg-gradient-to-r from-medical-primary to-blue-600 dark:from-blue-600 dark:to-blue-800 hover:from-medical-primary/90 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-900 shadow-lg hover:shadow-xl dark:shadow-blue-950/50 transition-all duration-300 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              {/* Enhanced Footer */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800/50 rounded-full">
                  <Stethoscope className="h-3.5 w-3.5 text-medical-primary dark:text-red-400" />
                  <span className="font-medium">AI-Powered</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>Educational Content</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>Consult Professionals</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}