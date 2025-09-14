import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Heart, Activity, User, Stethoscope, TrendingUp, Brain, Zap, Star, Crown, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';

export default function PremiumDashboard() {
  const [formData, setFormData] = useState<PatientData>({
    ...defaultPatientData,
    stressLevel: 5,
    sleepQuality: 7,
    exerciseFrequency: 3
  });
  const [patientName, setPatientName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<{
    overall: number;
    cardiovascular: number;
    lifestyle: number;
    medical: number;
    recommendations: string[];
    insights: string[];
  }>({
    overall: 0,
    cardiovascular: 0,
    lifestyle: 0,
    medical: 0,
    recommendations: [],
    insights: []
  });
  const [aiProcessing, setAiProcessing] = useState<string[]>([]);

  const updateField = (field: keyof PatientData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Advanced real-time risk calculation for premium tier
    calculateAdvancedRisk({ ...formData, [field]: value });
  };

  const calculateAdvancedRisk = (data: PatientData) => {
    // Advanced risk calculation with multiple categories
    let cardioScore = 0;
    let lifestyleScore = 0;
    let medicalScore = 0;
    
    const recommendations: string[] = [];
    const insights: string[] = [];

    // Cardiovascular factors
    if (data.age > 50) { cardioScore += 15; }
    if (data.gender === 'male') { cardioScore += 10; }
    if (data.restingBP > 140) { cardioScore += 25; recommendations.push('Monitor blood pressure daily'); }
    if (data.cholesterol > 240) { cardioScore += 20; recommendations.push('Consider cholesterol medication'); }
    if (data.heartRate && data.heartRate < 120) { cardioScore += 15; }

    // Lifestyle factors
    if (data.smoking) { lifestyleScore += 30; recommendations.push('Smoking cessation program recommended'); }
    if (data.exerciseFrequency && data.exerciseFrequency < 2) { lifestyleScore += 20; recommendations.push('Increase exercise frequency'); }
    if (data.stressLevel && data.stressLevel > 7) { lifestyleScore += 15; recommendations.push('Stress management techniques'); }
    if (data.sleepQuality && data.sleepQuality < 5) { lifestyleScore += 10; recommendations.push('Improve sleep hygiene'); }

    // Medical factors
    if (data.diabetes) { medicalScore += 25; recommendations.push('Regular diabetes monitoring'); }
    if (data.previousHeartAttack) { medicalScore += 15; insights.push('Previous heart attack increases risk profile'); }
    if (data.exerciseAngina) { medicalScore += 20; recommendations.push('Cardiac stress test recommended'); }

    const overall = Math.min(100, Math.round((cardioScore + lifestyleScore + medicalScore) / 3));
    
    // Premium insights
    if (overall > 70) {
      insights.push('High-risk profile detected - immediate medical consultation recommended');
    } else if (overall > 40) {
      insights.push('Moderate risk - lifestyle modifications can significantly improve outcomes');
    } else {
      insights.push('Low risk profile - maintain current healthy habits');
    }

    setRiskAnalysis({
      overall,
      cardiovascular: Math.min(100, cardioScore),
      lifestyle: Math.min(100, lifestyleScore),
      medical: Math.min(100, medicalScore),
      recommendations: recommendations.slice(0, 5),
      insights
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Premium AI processing simulation
    setLoading(true);
    setAiProcessing(prev => [...prev, 'Processing uploaded documents...']);
    
    setTimeout(() => {
      setAiProcessing(prev => [...prev, 'Advanced AI analysis complete']);
      setLoading(false);
    }, 2000);
  };

  const generateInsights = () => {
    setLoading(true);
    setAiProcessing(['Analyzing patient data...', 'Generating premium insights...']);
    
    setTimeout(() => {
      const newInsights = [
        'ECG pattern analysis suggests normal sinus rhythm',
        'Blood pressure trends indicate pre-hypertensive state',
        'Recommended follow-up in 3 months',
        'Consider lipid panel recheck'
      ];
      setRiskAnalysis(prev => ({
        ...prev,
        insights: [...prev.insights, ...newInsights]
      }));
      setAiProcessing(prev => [...prev, 'Premium analysis complete']);
      setLoading(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Premium assessment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      generateInsights();
      alert(`Premium Risk Assessment Complete!\nOverall Risk: ${riskAnalysis.overall}%\nDetailed analysis available below!`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateAdvancedRisk(formData);
  }, [formData]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Premium Cardiovascular Assessment</h1>
          </div>
          <p className="opacity-90">Advanced AI-powered analysis with unlimited features - All-in-One Dashboard</p>
        </div>

        {/* Real-time Risk Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Advanced Risk Analysis Dashboard
            </CardTitle>
            <CardDescription>
              Real-time multi-category risk assessment with AI insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{riskAnalysis.overall}%</div>
                <div className="text-sm text-gray-600">Overall Risk</div>
                <Progress value={riskAnalysis.overall} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{riskAnalysis.cardiovascular}%</div>
                <div className="text-sm text-gray-600">Cardiovascular</div>
                <Progress value={riskAnalysis.cardiovascular} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{riskAnalysis.lifestyle}%</div>
                <div className="text-sm text-gray-600">Lifestyle</div>
                <Progress value={riskAnalysis.lifestyle} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{riskAnalysis.medical}%</div>
                <div className="text-sm text-gray-600">Medical</div>
                <Progress value={riskAnalysis.medical} className="mt-2" />
              </div>
            </div>

            {riskAnalysis.recommendations.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Premium Recommendations:</strong>
                  <ul className="mt-2 space-y-1">
                    {riskAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Comprehensive Premium Assessment Form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Heart className="h-6 w-6 text-medical-primary" />
              Premium All-in-One Assessment
            </CardTitle>
            <CardDescription>
              Complete cardiovascular assessment with patient information, document analysis, and AI insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Patient Name */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <User className="h-5 w-5" />
                  Patient Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter patient name"
                    />
                  </div>
                  <div>
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
                  <div>
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
                  <div>
                    <Label htmlFor="chestPainType">Chest Pain Type</Label>
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
                  </div>
                  <div>
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
                  <div>
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
                  <Stethoscope className="h-5 w-5" />
                  Vital Signs & Laboratory Values
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
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
                  <div>
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
                  <div>
                    <Label htmlFor="maxHR">Resting Heart Rate</Label>
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
                  <div>
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
                  <div>
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
                  <div>
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

              {/* Health Conditions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Heart className="h-5 w-5" />
                  Health Conditions & Lifestyle
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

              {/* Conditional Medical Questions */}
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

              {/* Lifestyle Assessment with Premium Sliders */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <TrendingUp className="h-5 w-5" />
                  Advanced Lifestyle Assessment
                  <Badge variant="secondary" className="ml-2">Premium</Badge>
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

                {/* Premium Lifestyle Sliders */}
                <div className="space-y-6">
                  <div>
                    <Label>Stress Level (1-10)</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <span>1</span>
                      <Slider
                        value={[formData.stressLevel || 5]}
                        onValueChange={(value) => updateField('stressLevel', value[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <span>10</span>
                      <Badge variant="outline">{formData.stressLevel}/10</Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Sleep Quality (1-10)</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <span>1</span>
                      <Slider
                        value={[formData.sleepQuality || 7]}
                        onValueChange={(value) => updateField('sleepQuality', value[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <span>10</span>
                      <Badge variant="outline">{formData.sleepQuality}/10</Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Exercise Frequency (days per week)</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <span>0</span>
                      <Slider
                        value={[formData.exerciseFrequency || 3]}
                        onValueChange={(value) => updateField('exerciseFrequency', value[0])}
                        max={7}
                        min={0}
                        step={1}
                        className="flex-1"
                      />
                      <span>7</span>
                      <Badge variant="outline">{formData.exerciseFrequency} days</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Upload className="h-5 w-5" />
                  Document Analysis
                  <Badge variant="secondary" className="ml-2">Unlimited</Badge>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="text-xs text-gray-500">
                      Premium: Unlimited uploads • Supports ECG, Lab reports, Medical images
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Uploaded Files:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="outline" className="ml-auto">AI Analyzed</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Processing Status */}
              {aiProcessing.length > 0 && (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {aiProcessing.map((process, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {process}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* AI Insights Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                  <Brain className="h-5 w-5" />
                  AI-Generated Insights
                  <Badge variant="secondary" className="ml-2">Premium</Badge>
                </div>
                
                <Button 
                  type="button"
                  onClick={generateInsights} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? (
                    <>
                      <Zap className="mr-2 h-4 w-4 animate-spin" />
                      Generating Premium Insights...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Advanced AI Analysis
                    </>
                  )}
                </Button>

                {riskAnalysis.insights.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Clinical Insights
                    </h4>
                    {riskAnalysis.insights.map((insight, index) => (
                      <Alert key={index}>
                        <Info className="h-4 w-4" />
                        <AlertDescription>{insight}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Premium Features Active:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Multi-category risk analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Unlimited document uploads
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Advanced AI insights
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Real-time risk monitoring
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Interactive lifestyle sliders
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      All-in-one assessment
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Processing Premium Analysis...' : 'Complete Premium Assessment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}