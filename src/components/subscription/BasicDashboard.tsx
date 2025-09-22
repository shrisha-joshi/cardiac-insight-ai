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
import { Upload, FileText, Heart, Activity, Stethoscope, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
              <span>Checking authentication...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
      alert('Free tier allows maximum 2 documents. Upgrade to Premium for unlimited uploads!');
      return;
    }
    setUploadedFiles(prev => [...prev, ...files]);
    
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
      alert(`Basic Risk Assessment Complete!\nRisk Level: ${riskIndicators.level.toUpperCase()}\nScore: ${riskIndicators.score}/12\n\nUpgrade to Premium for detailed analysis and recommendations!`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <Badge className="mb-3 bg-blue-100 text-blue-800">Free Tier - Basic Assessment</Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Basic Heart Health Check</h1>
          <p className="text-gray-600">Get started with basic cardiovascular risk assessment</p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 Upgrade to <strong>Premium</strong> for advanced analysis or <strong>Professional</strong> for clinical-grade assessment
            </p>
          </div>
        </div>

        {/* Real-time Risk Indicator */}
        {riskIndicators.score > 0 && (
          <Card className="mb-6 border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Basic Risk Assessment
                </h3>
                <Badge variant={riskIndicators.level === 'high' ? 'destructive' : riskIndicators.level === 'medium' ? 'default' : 'secondary'}>
                  {riskIndicators.level.toUpperCase()} RISK
                </Badge>
              </div>
              <Progress value={(riskIndicators.score / 12) * 100} className="mb-3" />
              <p className="text-sm text-muted-foreground mb-2">Risk Score: {riskIndicators.score}/12</p>
              {riskIndicators.factors.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Key Risk Factors:</p>
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

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Heart className="h-6 w-6 text-medical-primary" />
              Basic Heart Health Assessment
            </CardTitle>
            <CardDescription>
              Enter patient details for basic cardiovascular risk evaluation (Free Tier)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Medical Documents Upload - Limited for Free Tier */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                    <Upload className="h-5 w-5" />
                    Medical Documents (Basic Upload)
                  </div>
                  <Badge variant="secondary" className="text-xs">Free: Max 2 files</Badge>
                </div>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Upload basic medical reports (PDF, images) - Max 2 files
                      </div>
                      <div className="text-xs text-blue-600">
                        ⚡ Basic AI extraction • 📊 Limited analysis
                      </div>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Stethoscope className="h-5 w-5" />
                  Basic Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Health Metrics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Activity className="h-5 w-5" />
                  Health Metrics
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Symptoms & Medical History */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Stethoscope className="h-5 w-5" />
                  Symptoms & Medical History
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Lifestyle & Health Conditions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Heart className="h-5 w-5" />
                  Lifestyle & Health Conditions
                </div>
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
              </div>

              {/* Conditional Questions */}
              {(formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                    <Heart className="h-5 w-5" />
                    Additional Medical Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </div>
              )}

              {/* Lifestyle Assessment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Activity className="h-5 w-5" />
                  Lifestyle Assessment
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Upgrade Promotion */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-blue-900 mb-2">🚀 Unlock Advanced Features</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-blue-800">Premium Tier</h4>
                    <ul className="text-blue-700 mt-1 space-y-1">
                      <li>• Advanced AI document analysis</li>
                      <li>• Interactive lifestyle sliders</li>
                      <li>• Detailed risk breakdowns</li>
                      <li>• Unlimited file uploads</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Professional Tier</h4>
                    <ul className="text-green-700 mt-1 space-y-1">
                      <li>• Clinical-grade analysis</li>
                      <li>• Family history tracking</li>
                      <li>• Professional reports</li>
                      <li>• Advanced recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={processingLoading}>
                  {processingLoading ? 'Processing Basic Analysis...' : 'Get Basic Risk Assessment (Free)'}
                </Button>
                <div className="grid md:grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700">
                    Upgrade to Premium
                  </Button>
                  <Button variant="outline" className="w-full bg-green-50 hover:bg-green-100 text-green-700">
                    Go Professional
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}