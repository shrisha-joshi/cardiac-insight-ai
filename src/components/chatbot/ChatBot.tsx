import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { mlService } from '@/services/mlService';
import { MessageCircle, Send, Bot, User, Heart, Stethoscope, Activity } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Add welcome message
    addBotMessage(
      "Hello! I'm your AI Health Assistant. I can help you understand heart health, analyze your medical history, and provide personalized recommendations. How can I help you today?"
    );
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type: 'user' | 'bot', content: string, data?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = (content: string, data?: any) => {
    addMessage('bot', content, data);
  };

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

  const processUserMessage = async (message: string): Promise<{ content: string; data?: any }> => {
    const lowerMessage = message.toLowerCase();

    // Health assessment questions
    if (lowerMessage.includes('risk') || lowerMessage.includes('assessment') || lowerMessage.includes('heart attack')) {
      return {
        content: "I can help you understand heart attack risk factors. Based on medical literature, key factors include:\n\n• Age (risk increases with age)\n• High blood pressure\n• High cholesterol\n• Smoking\n• Diabetes\n• Family history\n• Obesity\n• Sedentary lifestyle\n\nWould you like me to analyze your recent assessments or help you schedule a new evaluation?"
      };
    }

    // Medical history inquiry
    if (lowerMessage.includes('history') || lowerMessage.includes('previous') || lowerMessage.includes('past')) {
      if (!user) {
        return {
          content: "To access your medical history, please log in to your account. I can provide general health information without login if you prefer."
        };
      }

      try {
        const history = await mlService.getMedicalHistory(user.id);
        if (history.length === 0) {
          return {
            content: "I don't see any previous assessments in your records. Would you like to take your first heart health assessment? It only takes a few minutes and provides valuable insights."
          };
        }

        const recentAssessment = history[0];
        const riskLevel = recentAssessment.prediction_result?.prediction?.riskLevel || 'Unknown';
        const riskScore = recentAssessment.prediction_result?.prediction?.riskScore || 0;

        return {
          content: `I found ${history.length} previous assessment(s) in your records. Your most recent assessment showed a ${riskLevel.toLowerCase()} risk level with a score of ${riskScore.toFixed(1)}%. \n\nWould you like me to explain what this means or provide recommendations based on your history?`,
          data: { history: history.slice(0, 3) }
        };
      } catch (error) {
        return {
          content: "I had trouble accessing your medical history. Please try again or contact support if the issue persists."
        };
      }
    }

    // Symptom inquiries
    if (lowerMessage.includes('symptom') || lowerMessage.includes('chest pain') || lowerMessage.includes('shortness of breath')) {
      return {
        content: "⚠️ **Important:** If you're experiencing chest pain, shortness of breath, or other concerning symptoms, please seek immediate medical attention or call emergency services.\n\nCommon heart attack symptoms include:\n• Chest pain or discomfort\n• Shortness of breath\n• Pain in arms, back, neck, jaw, or stomach\n• Cold sweat, nausea, or lightheadedness\n\nFor non-emergency health questions, I'm here to help with information and prevention strategies."
      };
    }

    // Lifestyle recommendations
    if (lowerMessage.includes('prevent') || lowerMessage.includes('improve') || lowerMessage.includes('lifestyle') || lowerMessage.includes('diet') || lowerMessage.includes('exercise')) {
      return {
        content: "Here are evidence-based recommendations for heart health:\n\n**Diet:**\n• Follow a Mediterranean-style diet\n• Limit saturated fats and trans fats\n• Increase omega-3 fatty acids\n• Eat plenty of fruits and vegetables\n\n**Exercise:**\n• 150 minutes of moderate aerobic activity weekly\n• Include strength training 2+ days per week\n• Start gradually if you're new to exercise\n\n**Lifestyle:**\n• Don't smoke or quit if you do\n• Limit alcohol consumption\n• Manage stress through relaxation techniques\n• Get 7-9 hours of quality sleep\n\nWould you like specific advice for any of these areas?"
      };
    }

    // Medication and treatment questions
    if (lowerMessage.includes('medication') || lowerMessage.includes('treatment') || lowerMessage.includes('doctor')) {
      return {
        content: "I can provide general information about heart health, but I cannot give specific medical advice or recommend treatments. For questions about:\n\n• Medications and dosages\n• Treatment plans\n• Specific medical conditions\n• Symptom diagnosis\n\nPlease consult with your healthcare provider. They have access to your complete medical history and can provide personalized care.\n\nIs there general heart health information I can help you with instead?"
      };
    }

    // Data interpretation
    if (lowerMessage.includes('cholesterol') || lowerMessage.includes('blood pressure') || lowerMessage.includes('numbers')) {
      return {
        content: "I can help you understand common heart health measurements:\n\n**Blood Pressure:**\n• Normal: Less than 120/80 mmHg\n• Elevated: 120-129 systolic, less than 80 diastolic\n• Stage 1 High: 130-139/80-89 mmHg\n• Stage 2 High: 140/90 mmHg or higher\n\n**Cholesterol:**\n• Total: Less than 200 mg/dL (optimal)\n• LDL: Less than 100 mg/dL (optimal)\n• HDL: 40+ mg/dL (men), 50+ mg/dL (women)\n\n**Other Key Metrics:**\n• Resting heart rate: 60-100 bpm\n• BMI: 18.5-24.9 (normal range)\n\nRemember, these are general guidelines. Your doctor can interpret your specific results in context."
      };
    }

    // Default response with suggestions
    return {
      content: "I'm here to help with heart health questions! I can assist with:\n\n• Understanding risk factors and prevention\n• Explaining assessment results\n• Lifestyle recommendations\n• General health information\n• Reviewing your medical history\n\nWhat specific aspect of heart health would you like to know more about?"
    };
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
                          {message.data.history.map((assessment: any, index: number) => (
                            <div key={index} className="bg-accent/50 p-2 rounded text-xs">
                              <div className="flex justify-between items-center">
                                <span>
                                  {new Date(assessment.assessment_date).toLocaleDateString()}
                                </span>
                                <Badge variant={
                                  assessment.prediction_result?.prediction?.riskLevel === 'Low' ? 'secondary' :
                                  assessment.prediction_result?.prediction?.riskLevel === 'Medium' ? 'default' : 'destructive'
                                }>
                                  {assessment.prediction_result?.prediction?.riskLevel || 'Unknown'} Risk
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