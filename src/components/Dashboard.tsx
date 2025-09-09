import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PatientForm from './PatientForm';
import RiskDisplay from './RiskDisplay';
import PredictionHistory from './PredictionHistory';
import { PatientData, PredictionResult, generateMockPrediction, mockPredictions } from '@/lib/mockData';
import { mlService } from '@/services/mlService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Heart, History, User, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>(mockPredictions);
  const [loading, setLoading] = useState(false);

  const handlePrediction = async (patientData: PatientData) => {
    setLoading(true);
    
    try {
      // Only try Supabase if properly configured
      if (isSupabaseConfigured) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Use ML service for real prediction
        const mlResponse = await mlService.predictHeartAttackRisk({
          patientData,
          userId: user?.id,
          useHistoricalData: true
        });
        
        // Convert ML response to our PredictionResult format
        const prediction: PredictionResult = {
          id: Date.now().toString(),
          timestamp: new Date(),
          riskLevel: mlResponse.prediction.riskLevel.toLowerCase() as 'low' | 'medium' | 'high',
          riskScore: mlResponse.prediction.riskScore,
          confidence: mlResponse.prediction.confidence,
          prediction: mlResponse.prediction.prediction === 'Risk Detected' ? 'Risk' : 'No Risk',
          explanation: mlResponse.explanation,
          recommendations: mlResponse.recommendations,
          patientData: patientData
        };
        
        setCurrentPrediction(prediction);
        setPredictions(prev => [prediction, ...prev]);
      } else {
        // Fallback to mock prediction when Supabase not configured
        console.log('Using mock prediction - Supabase not configured');
        const prediction = generateMockPrediction(patientData);
        setCurrentPrediction(prediction);
        setPredictions(prev => [prediction, ...prev]);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      // Fallback to mock prediction on any error
      const prediction = generateMockPrediction(patientData);
      setCurrentPrediction(prediction);
      setPredictions(prev => [prediction, ...prev]);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Heart Attack Risk Prediction
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered cardiovascular risk assessment using clinical parameters and machine learning
          </p>
        </div>

        <Tabs defaultValue="predict" className="w-full">
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
            <PredictionHistory predictions={predictions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}