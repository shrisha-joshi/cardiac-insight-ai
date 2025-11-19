import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Heart, Activity, Stethoscope, AlertTriangle, CheckCircle, Info, Star, TrendingUp, Users, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { PatientData, defaultPatientData, PredictionResult } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import PredictionHistory from '@/components/PredictionHistory';
import { usePredictionHistory } from '@/hooks/use-prediction-history';

// Import new dashboard components

import { FormSection, FormFieldGroup } from '@/components/ui/form-section';
import { LoadingState } from '@/components/ui/loading-state';
import { ActionButton } from '@/components/ui/action-button';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { EmptyState } from '@/components/ui/empty-state';


export default function BasicDashboard() {
  const MAX_RISK_SCORE = 14; // Maximum possible score: 2+1+2+2+2+3+2 = 14 points
  
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState<PatientData>(defaultPatientData);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [activeTab, setActiveTab] = useState('assess');
  const [riskIndicators, setRiskIndicators] = useState<{score: number, level: string, factors: string[]}>({
    score: 0,
    level: 'low',
    factors: []
  });
  // Stepper (pagination) for Basic assessment
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const handleNextStep = () => { if (currentStep < totalSteps) setCurrentStep((s) => s + 1); };
  const handlePreviousStep = () => { if (currentStep > 1) setCurrentStep((s) => s - 1); };
  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return (formData.age || 0) > 0 && !!formData.gender;
      default:
        return true;
    }
  };
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use custom hook for prediction history management
  const { predictions, addPrediction, addFeedback, getFeedbackStats, userId: historyUserId, isLoading: historyLoading } = usePredictionHistory();

  const checkAuthAndRedirect = useCallback(async () => {
    try {
      // First check if there's a session in progress
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setAuthLoading(false);
        return;
      }
      
      // If no session, check user
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        // Only redirect if we're certain there's no authentication
        if (error?.message !== 'Auth session missing!' && error?.message !== 'JWT expired') {
          toast({
            title: "Authentication Required",
            description: "Please sign in to access the Basic Dashboard",
            variant: "destructive",
          });
          navigate('/login');
        }
        return;
      }
      
      setUser(user);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Auth check error:', error);
      // Don't redirect on network or temporary errors
    } finally {
      setAuthLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    checkAuthAndRedirect();
    
    // Listen for auth state changes to maintain session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setAuthLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuthAndRedirect, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return <LoadingState message="Checking authentication..." tier="basic" />;
  }

  // If no user after loading, this shouldn't happen due to redirect, but safety check
  if (!user) {
    return null;
  }

  const updateField = (field: keyof PatientData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Calculate basic risk indicators in real-time for free tier
    calculateBasicRisk({ ...formData, [field]: value });
  };

  const calculateBasicRisk = (data: PatientData) => {
    let score = 0;
    const factors: string[] = [];

    if (data.age > 55) { score += 2; factors.push('Age over 55'); }
    if (data.gender === 'male') { score += 1; factors.push('Male gender'); }
    if (data.restingBP > 140) { score += 2; factors.push('High blood pressure'); }
    if (data.cholesterol > 240) { score += 2; factors.push('High cholesterol'); }
    if (data.diabetes) { score += 2; factors.push('Diabetes'); }
    if (data.smoking) { score += 3; factors.push('Smoking'); }
    if (data.exerciseAngina) { score += 2; factors.push('Exercise-induced chest pain'); }

    // Defensive bounds check: ensure score doesn't exceed maximum
    score = Math.min(score, MAX_RISK_SCORE);
    
    const level = score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low';
    setRiskIndicators({ score, level, factors });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingLoading(true);
    try {
      // Basic assessment processing (limited compared to premium tiers)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create prediction result for history
      const prediction: PredictionResult = {
        id: `basic-pred-${Date.now()}`,
        patientData: formData,
        riskScore: Math.round((riskIndicators.score / MAX_RISK_SCORE) * 100),
        riskLevel: riskIndicators.level as 'low' | 'medium' | 'high',
        confidence: 75, // Basic tier has lower confidence than premium
        prediction: riskIndicators.level === 'high' ? 'Risk' : 'No Risk',
        explanation: `Basic assessment identified ${riskIndicators.factors.length} risk factors with a score of ${riskIndicators.score}/${MAX_RISK_SCORE}`,
        recommendations: riskIndicators.factors.slice(0, 3).map(f => `Monitor: ${f}`),
        timestamp: new Date()
      };
      
      // Save to prediction history
      setCurrentPrediction(prediction);
      addPrediction(prediction);
      
      toast({
        title: "✅ Basic Risk Assessment Complete!",
        description: (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <Badge variant={riskIndicators.level === 'high' ? 'destructive' : riskIndicators.level === 'medium' ? 'default' : 'secondary'}>
                {riskIndicators.level.toUpperCase()} RISK
              </Badge>
              <span className="text-sm">Score: {riskIndicators.score}/{MAX_RISK_SCORE} ({Math.round((riskIndicators.score / MAX_RISK_SCORE) * 100)}%)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              🚀 Upgrade to Premium for detailed analysis and recommendations!
            </p>
          </div>
        ),
        duration: 6000,
      });
      
      // Switch to history tab to show the new assessment
      setActiveTab('history');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error:', error);
      toast({
        title: "Assessment Error",
        description: "Failed to complete assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/30">
      {/* Compact Fixed Header (Hero) for Basic */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-800 dark:to-cyan-800 shadow-lg border-b-2 border-blue-400/30 dark:border-blue-600/30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Heart className="h-6 w-6" />
              <div>
                <div className="text-sm uppercase tracking-wide opacity-90">Basic Tier</div>
                <div className="font-semibold">Basic Heart Health Check</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-blue-100">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Assessments: {predictions.length}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        




        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
            <TabsTrigger value="assess" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Risk Assessment
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Medical History ({predictions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assess" className="space-y-6">
            {/* Stepper */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                {['Basic Info', 'Health', 'History', 'Lifestyle'].map((label, idx) => (
                  <div key={label} className="flex items-center flex-1">
                    <div className={`flex items-center gap-2 ${idx > 0 ? 'pl-2' : ''}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-lg border-2 transition-all duration-300
                        ${idx + 1 <= currentStep
                          ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 text-white border-blue-300 dark:border-blue-400 shadow-blue-500/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                      >
                        {idx + 1}
                      </div>
                      <span className={`text-sm font-medium hidden sm:block transition-colors duration-300 ${idx + 1 <= currentStep ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>{label}</span>
                    </div>
                    {idx < totalSteps - 1 && (
                      <div className="mx-2 flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 shadow-sm transition-all duration-500 ease-in-out ${idx + 1 < currentStep ? 'w-full' : 'w-0'}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Real-time Risk Indicator */}
            {riskIndicators.score > 0 && (
              <Card className="border-l-4 border-l-blue-500 shadow-xl dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <Heart className="h-5 w-5 text-red-500 dark:text-red-400" />
                  Basic Risk Assessment
                </h3>
                <Badge variant={riskIndicators.level === 'high' ? 'destructive' : riskIndicators.level === 'medium' ? 'default' : 'secondary'}>
                  {riskIndicators.level.toUpperCase()} RISK
                </Badge>
              </div>
              <Progress value={Math.min((riskIndicators.score / MAX_RISK_SCORE) * 100, 100)} className="mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Score: {riskIndicators.score}/{MAX_RISK_SCORE} ({Math.round((riskIndicators.score / MAX_RISK_SCORE) * 100)}%)</p>
              {riskIndicators.factors.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Key Risk Factors:</p>
                  <div className="flex flex-wrap gap-1">
                    {riskIndicators.factors.slice(0, 3).map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                    {riskIndicators.factors.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{riskIndicators.factors.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Assessment Form */}
        <Card className="shadow-xl border-blue-200/50 dark:border-blue-800/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="pt-8 pb-8 px-6 md:px-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Basic Information */}
              {currentStep === 1 && (
              <FormSection
                title="Basic Information"
                description="Personal details and demographics"
                icon={Stethoscope}
                accent="blue"
                delay={0.2}
              >
                <FormFieldGroup columns={2}>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                      min="1"
                      max="120"
                      placeholder="Enter your age"
                      className="focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm) - Optional</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      min="100"
                      max="250"
                    />
                    <div className="text-xs text-muted-foreground">Your height in centimeters</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) - Optional</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      min="30"
                      max="300"
                    />
                      <div className="text-xs text-muted-foreground">Your weight in kilograms</div>
                    </div>
                  </FormFieldGroup>
                </FormSection>
              )}

                {/* Health Metrics */}
                {currentStep === 2 && (
                <FormSection
                  title="Health Metrics"
                  description="Vital signs and measurements"
                  icon={Activity}
                  accent="blue"
                  delay={0.3}
                >
                  <FormFieldGroup columns={2}>
                  <div className="space-y-2">
                    <Label htmlFor="restingBP">Blood Pressure Category</Label>
                    <Select value={formData.restingBP > 140 ? 'high' : formData.restingBP > 120 ? 'elevated' : 'normal'} 
                            onValueChange={(value) => updateField('restingBP', value === 'high' ? 160 : value === 'elevated' ? 130 : 110)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood pressure range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (Less than 120/80)</SelectItem>
                        <SelectItem value="elevated">Elevated (120-129/Less than 80)</SelectItem>
                        <SelectItem value="high">High (130/80 or higher)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">Choose the range that best describes your usual blood pressure</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cholesterol">Cholesterol Level</Label>
                    <Select value={formData.cholesterol > 240 ? 'high' : formData.cholesterol > 200 ? 'borderline' : 'normal'} 
                            onValueChange={(value) => updateField('cholesterol', value === 'high' ? 280 : value === 'borderline' ? 220 : 180)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cholesterol range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (Less than 200 mg/dL)</SelectItem>
                        <SelectItem value="borderline">Borderline High (200-239 mg/dL)</SelectItem>
                        <SelectItem value="high">High (240 mg/dL or higher)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">From your recent blood test results</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heartRate">Resting Heart Rate</Label>
                    <Select 
                      value={formData.maxHR < 70 ? 'low' : formData.maxHR > 100 ? 'high' : 'normal'} 
                      onValueChange={(value) => updateField('maxHR', value === 'low' ? 60 : value === 'high' ? 110 : 80)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select heart rate range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (50-69 bpm) - Athletic/Very Fit</SelectItem>
                        <SelectItem value="normal">Normal (70-100 bpm) - Healthy Range</SelectItem>
                        <SelectItem value="high">High (100+ bpm) - May Need Attention</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">Your typical resting heart rate</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exerciseCapacity">Exercise Capacity</Label>
                    <Select value={formData.oldpeak > 2 ? 'low' : formData.oldpeak > 1 ? 'moderate' : 'good'} 
                            onValueChange={(value) => updateField('oldpeak', value === 'low' ? 3 : value === 'moderate' ? 1.5 : 0.5)}>
                      <SelectTrigger>
                        <SelectValue placeholder="How well can you exercise?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good - Can exercise vigorously without issues</SelectItem>
                        <SelectItem value="moderate">Moderate - Some difficulty with intense exercise</SelectItem>
                        <SelectItem value="low">Limited - Difficulty with most physical activities</SelectItem>
                      </SelectContent>
                    </Select>
                      <div className="text-xs text-muted-foreground">Your general ability to perform physical activities</div>
                    </div>
                  </FormFieldGroup>
                </FormSection>
                )}

                {/* Symptoms & Medical History */}
                {currentStep === 2 && (
                <FormSection
                  title="Symptoms & Medical History"
                  description="Clinical observations and past conditions"
                  icon={Stethoscope}
                  accent="blue"
                  delay={0.4}
                >
                  <FormFieldGroup columns={2}>
                  <div className="space-y-2">
                    <Label htmlFor="chestPainType" className="flex items-center">
                      Chest Pain Type
                      <InfoTooltip content="Different types of chest pain can indicate various heart conditions. Typical angina is the most concerning for heart disease." />
                    </Label>
                    <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select chest pain type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typical">Severe chest pain during physical activity</SelectItem>
                        <SelectItem value="atypical">Mild chest discomfort occasionally</SelectItem>
                        <SelectItem value="non-anginal">Chest pain not related to heart</SelectItem>
                        <SelectItem value="asymptomatic">No chest pain</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">How would you describe your chest pain experience?</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restingECG">Recent Heart Test (ECG/EKG) Results</Label>
                    <Select value={formData.restingECG} onValueChange={(value) => updateField('restingECG', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ECG result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal - No issues found</SelectItem>
                        <SelectItem value="st-t">Abnormal - Minor irregularities detected</SelectItem>
                        <SelectItem value="lvh">Abnormal - Heart enlargement detected</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">From your most recent heart test (if available)</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stSlope">Exercise Test Results</Label>
                    <Select value={formData.stSlope} onValueChange={(value) => updateField('stSlope', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exercise test result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">Normal - Heart responds well to exercise</SelectItem>
                        <SelectItem value="flat">Mild concern - Flat response to exercise</SelectItem>
                        <SelectItem value="down">Concerning - Poor response to exercise</SelectItem>
                      </SelectContent>
                    </Select>
                      <div className="text-xs text-muted-foreground">Results from stress test or exercise ECG (if done)</div>
                    </div>
                  </FormFieldGroup>
                </FormSection>
                )}

                {/* Lifestyle & Health Conditions */}
                {currentStep === 3 && (
                <FormSection
                  title="Lifestyle & Health Conditions"
                  description="Daily habits and existing conditions"
                  icon={Heart}
                  accent="blue"
                  delay={0.5}
                >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label htmlFor="diabetes" className="font-medium">Diabetes/High Blood Sugar</Label>
                      <div className="text-xs text-muted-foreground">Diagnosed with diabetes or high blood sugar</div>
                    </div>
                    <Switch
                      id="diabetes"
                      checked={formData.diabetes}
                      onCheckedChange={(checked) => updateField('diabetes', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label htmlFor="exerciseAngina" className="font-medium">Chest Pain During Exercise</Label>
                      <div className="text-xs text-muted-foreground">Experience chest pain when exercising</div>
                    </div>
                    <Switch
                      id="exerciseAngina"
                      checked={formData.exerciseAngina}
                      onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label htmlFor="smoking" className="font-medium">Smoking</Label>
                      <div className="text-xs text-muted-foreground">Current or past smoker</div>
                    </div>
                    <Switch
                      id="smoking"
                      checked={formData.smoking}
                      onCheckedChange={(checked) => updateField('smoking', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label htmlFor="previousHeartAttack" className="font-medium">Previous Heart Attack</Label>
                      <div className="text-xs text-muted-foreground">History of heart attack or cardiac event</div>
                    </div>
                    <Switch
                      id="previousHeartAttack"
                      checked={formData.previousHeartAttack}
                      onCheckedChange={(checked) => updateField('previousHeartAttack', checked)}
                    />
                  </div>
                </div>
              </FormSection>
              )}

              {/* Conditional Questions */}
              {currentStep === 3 && (formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
                <FormSection
                  title="Additional Medical Information"
                  description="Follow-up questions based on your conditions"
                  icon={Heart}
                  accent="rose"
                  delay={0.6}
                >
                  <FormFieldGroup columns={2}>
                    {formData.previousHeartAttack && (
                      <div className="space-y-2">
                        <Label>Are you taking cholesterol medication?</Label>
                        <Select value={formData.cholesterolMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('cholesterolMedication', value === 'yes')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes, taking cholesterol medication</SelectItem>
                            <SelectItem value="no">No, not taking medication</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.diabetes && (
                      <div className="space-y-2">
                        <Label>What diabetes treatment are you taking?</Label>
                        <Select value={formData.diabetesMedication} onValueChange={(value) => updateField('diabetesMedication', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select treatment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="insulin">Insulin injections</SelectItem>
                            <SelectItem value="tablets">Oral tablets/pills</SelectItem>
                            <SelectItem value="both">Both insulin and tablets</SelectItem>
                            <SelectItem value="none">No medication currently</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.restingBP > 130 && (
                      <>
                        <div className="space-y-2">
                          <Label>Are you taking blood pressure medication?</Label>
                          <Select value={formData.bpMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('bpMedication', value === 'yes')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes, taking BP medication</SelectItem>
                              <SelectItem value="no">No, not taking medication</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Have you made lifestyle/diet changes recently?</Label>
                          <Select value={formData.lifestyleChanges ? 'yes' : 'no'} onValueChange={(value) => updateField('lifestyleChanges', value === 'yes')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes, made significant changes</SelectItem>
                              <SelectItem value="no">No, no major changes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </FormFieldGroup>
                </FormSection>
              )}

              {/* Lifestyle Assessment */}
              {currentStep === 4 && (
              <FormSection
                title="Lifestyle Assessment"
                description="Daily habits and activities"
                icon={Activity}
                accent="emerald"
                delay={0.7}
              >
                <FormFieldGroup columns={2}>
                  <div className="space-y-2">
                    <Label>Dietary Preference</Label>
                    <Select value={formData.dietType} onValueChange={(value) => updateField('dietType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select diet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Physical Activity Level</Label>
                    <Select value={formData.physicalActivity} onValueChange={(value) => updateField('physicalActivity', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Minimal exercise</SelectItem>
                        <SelectItem value="moderate">Moderate - Regular light exercise</SelectItem>
                        <SelectItem value="high">High - Intensive regular exercise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stressLevel">Stress Level (1-10)</Label>
                    <Input
                      id="stressLevel"
                      type="number"
                      value={formData.stressLevel}
                      onChange={(e) => updateField('stressLevel', parseInt(e.target.value) || 5)}
                      min="1"
                      max="10"
                      placeholder="5"
                    />
                    <div className="text-xs text-muted-foreground">1 = Very relaxed, 10 = Extremely stressed</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sleepHours">Average Sleep Hours</Label>
                    <Input
                      id="sleepHours"
                      type="number"
                      value={formData.sleepHours}
                      onChange={(e) => updateField('sleepHours', parseInt(e.target.value) || 7)}
                      min="3"
                      max="12"
                      placeholder="7"
                    />
                    <div className="text-xs text-muted-foreground">Hours of sleep per night on average</div>
                  </div>
                </FormFieldGroup>
              </FormSection>
              )}

              {/* Upgrade Promotion */}
              {currentStep === 4 && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 text-lg">🚀 Unlock Advanced Features</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Premium Tier</h4>
                    <ul className="text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                      <li>• Advanced AI document analysis</li>
                      <li>• Interactive lifestyle sliders</li>
                      <li>• Detailed risk breakdowns</li>
                      <li>• Unlimited file uploads</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Professional Tier</h4>
                    <ul className="text-green-700 dark:text-green-400 mt-1 space-y-1">
                      <li>• Clinical-grade analysis</li>
                      <li>• Family history tracking</li>
                      <li>• Professional reports</li>
                      <li>• Advanced recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>
              )}

              {/* Step Navigation / Submit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePreviousStep} 
                    disabled={currentStep === 1} 
                    className="h-11 w-11 rounded-full p-0 flex items-center justify-center border-2 border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                  </Button>
                  {currentStep < totalSteps ? (
                    <Button 
                      type="button" 
                      onClick={handleNextStep} 
                      disabled={!canProceedToNext()} 
                      className="h-11 w-11 rounded-full p-0 flex items-center justify-center bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-blue-400 dark:border-blue-500 hover:scale-105 active:scale-95"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  ) : (
                    <ActionButton 
                      loading={processingLoading}
                      variant="primary"
                      size="lg"
                      icon={Heart}
                    >
                      Get Basic Risk Assessment (Free)
                    </ActionButton>
                  )}
                </div>
                {currentStep === totalSteps && (
                  <div className="grid md:grid-cols-2 gap-2">
                    <ActionButton 
                      variant="secondary"
                      size="md"
                      fullWidth
                      icon={TrendingUp}
                    >
                      Upgrade to Premium
                    </ActionButton>
                    <ActionButton 
                      variant="success"
                      size="md"
                      fullWidth
                      icon={BarChart3}
                    >
                      Go Professional
                    </ActionButton>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-xl border-blue-200/50 dark:border-blue-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Activity className="h-6 w-6 text-blue-500" />
                  Your Medical History
                </CardTitle>
                <CardDescription>
                  Track your cardiovascular health assessments over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {predictions.length === 0 && !historyLoading ? (
                  <EmptyState
                    icon="history"
                    title="No Assessments Yet"
                    description="Complete your first cardiovascular risk assessment to start tracking your heart health over time."
                    actionLabel="Start Assessment"
                    onAction={() => setActiveTab('assess')}
                  />
                ) : (
                  <PredictionHistory 
                    predictions={predictions}
                    userId={historyUserId}
                    onAddFeedback={addFeedback}
                    feedbackStats={getFeedbackStats()}
                    isLoading={historyLoading}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>


    </div>
  );
}