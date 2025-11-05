import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Heart, Activity, Stethoscope, AlertTriangle, CheckCircle, Info, Star, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

// Import new dashboard components
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { StatsGrid, StatCard } from '@/components/ui/stat-card';
import { FormSection, FormFieldGroup } from '@/components/ui/form-section';
import { LoadingState } from '@/components/ui/loading-state';
import { ActionButton } from '@/components/ui/action-button';

export default function BasicDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState<PatientData>(defaultPatientData);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [riskIndicators, setRiskIndicators] = useState<{score: number, level: string, factors: string[]}>({
    score: 0,
    level: 'low',
    factors: []
  });
  const navigate = useNavigate();
  const { toast } = useToast();

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
      console.error('Auth check error:', error);
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

    const level = score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low';
    setRiskIndicators({ score, level, factors });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedFiles.length > 2) {
      toast({
        title: "Upload Limit Reached",
        description: "Free tier allows maximum 2 documents. Upgrade to Premium for unlimited uploads!",
        variant: "destructive",
      });
      return;
    }
    setUploadedFiles(prev => [...prev, ...files]);
    
    toast({
      title: "Files Uploaded",
      description: `${files.length} document(s) uploaded successfully.`,
    });
    
    // Basic document processing for free tier (limited features)
    for (const file of files) {
      console.log('Basic processing:', file.name);
      if (file.name.toLowerCase().includes('blood')) {
        // Basic data extraction - limited compared to premium
        updateField('cholesterol', 200);
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingLoading(true);
    try {
      // Basic assessment processing (limited compared to premium tiers)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "✅ Basic Risk Assessment Complete!",
        description: (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <Badge variant={riskIndicators.level === 'high' ? 'destructive' : riskIndicators.level === 'medium' ? 'default' : 'secondary'}>
                {riskIndicators.level.toUpperCase()} RISK
              </Badge>
              <span className="text-sm">Score: {riskIndicators.score}/12</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              🚀 Upgrade to Premium for detailed analysis and recommendations!
            </p>
          </div>
        ),
        duration: 6000,
      });
    } catch (error) {
      console.error('Error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Dashboard Header */}
        <DashboardHeader
          tier="basic"
          title="Basic Heart Health Check"
          description="Get started with foundational cardiovascular risk assessment"
          icon={<Heart className="w-10 h-10 text-white" />}
        />

        {/* Statistics Grid */}
        <StatsGrid>
          <StatCard
            title="Total Assessments"
            value={uploadedFiles.length.toString()}
            subtitle="Documents uploaded"
            icon={FileText}
            trend="neutral"
            color="blue"
            delay={0}
          />
          <StatCard
            title="Risk Score"
            value={riskIndicators.score > 0 ? `${riskIndicators.score}/12` : "—"}
            subtitle="Current risk level"
            icon={Activity}
            trend={riskIndicators.level === 'high' ? 'down' : riskIndicators.level === 'medium' ? 'neutral' : 'up'}
            trendValue={riskIndicators.level.toUpperCase()}
            color={riskIndicators.level === 'high' ? 'rose' : riskIndicators.level === 'medium' ? 'amber' : 'emerald'}
            delay={0.1}
          />
          <StatCard
            title="Risk Factors"
            value={riskIndicators.factors.length.toString()}
            subtitle="Key factors identified"
            icon={AlertTriangle}
            trend="neutral"
            color="blue"
            delay={0.2}
          />
          <StatCard
            title="Free Tier"
            value="2/2"
            subtitle="File upload limit"
            icon={Star}
            trend="neutral"
            color="purple"
            delay={0.3}
          />
        </StatsGrid>

        {/* Real-time Risk Indicator */}
        {riskIndicators.score > 0 && (
          <Card className="border-l-4 border-l-blue-500 shadow-xl dark:bg-gray-800/50 backdrop-blur-sm">
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
              <Progress value={(riskIndicators.score / 12) * 100} className="mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Score: {riskIndicators.score}/12</p>
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
        <Card className="shadow-xl border-blue-200/50 dark:border-blue-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 px-6 md:px-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Medical Documents Upload */}
              <FormSection
                title="Medical Documents"
                description="Upload basic medical reports (Max 2 files)"
                icon={Upload}
                accent="blue"
                delay={0.1}
              >
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center bg-blue-50/30 dark:bg-blue-900/10">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="text-sm text-muted-foreground">
                        Upload basic medical reports (PDF, images) - Max 2 files
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        ⚡ Basic AI extraction • 📊 Limited analysis
                      </div>
                      <Input
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileUpload}
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" className="mt-2">
                          Choose Files
                        </Button>
                      </Label>
                    </div>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Uploaded Files ({uploadedFiles.length}/2):</div>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">{file.name}</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Basic Processing</span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Free Tier</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      {uploadedFiles.length >= 2 && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Free tier limit reached. Upgrade to Premium for unlimited uploads and advanced AI analysis!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </FormSection>

              {/* Basic Information */}
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

                {/* Health Metrics */}
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

                {/* Symptoms & Medical History */}
                <FormSection
                  title="Symptoms & Medical History"
                  description="Clinical observations and past conditions"
                  icon={Stethoscope}
                  accent="blue"
                  delay={0.4}
                >
                  <FormFieldGroup columns={2}>
                  <div className="space-y-2">
                    <Label htmlFor="chestPainType">Chest Pain Experience</Label>
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

                {/* Lifestyle & Health Conditions */}
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

              {/* Conditional Questions */}
              {(formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
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

              {/* Upgrade Promotion */}
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

              <div className="space-y-3">
                <ActionButton 
                  loading={processingLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={Heart}
                >
                  Get Basic Risk Assessment (Free)
                </ActionButton>
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}