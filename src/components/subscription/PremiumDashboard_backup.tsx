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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    if (data.heartRate < 120) { cardioScore += 15; }

    // Lifestyle factors
    if (data.smoking) { lifestyleScore += 30; recommendations.push('Smoking cessation program recommended'); }
    if (data.exerciseFrequency < 2) { lifestyleScore += 20; recommendations.push('Increase exercise frequency'); }
    if (data.stressLevel > 7) { lifestyleScore += 15; recommendations.push('Stress management techniques'); }
    if (data.sleepQuality < 5) { lifestyleScore += 10; recommendations.push('Improve sleep hygiene'); }

    // Medical factors
    if (data.diabetes) { medicalScore += 25; recommendations.push('Regular diabetes monitoring'); }
    if (data.familyHistory) { medicalScore += 15; insights.push('Family history increases genetic risk'); }
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

  useEffect(() => {
    calculateAdvancedRisk(formData);
  }, [formData]);

  return (
    <div className="space-y-6 p-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Premium Cardiovascular Assessment</h1>
        </div>
        <p className="opacity-90">Advanced AI-powered analysis with unlimited features</p>
      </div>

      {/* Real-time Risk Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Advanced Risk Analysis
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
                <strong>Recommendations:</strong>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="assessment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assessment">Patient Assessment</TabsTrigger>
          <TabsTrigger value="documents">Document Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chestPainType">Chest Pain Type</Label>
                  <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typical">Typical Angina</SelectItem>
                      <SelectItem value="atypical">Atypical Angina</SelectItem>
                      <SelectItem value="non-anginal">Non-Anginal Pain</SelectItem>
                      <SelectItem value="asymptomatic">Asymptomatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Vital Signs & Laboratory Values
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restingBP">Resting Blood Pressure (mmHg)</Label>
                  <Input
                    id="restingBP"
                    type="number"
                    value={formData.restingBP}
                    onChange={(e) => updateField('restingBP', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="cholesterol">Serum Cholesterol (mg/dl)</Label>
                  <Input
                    id="cholesterol"
                    type="number"
                    value={formData.cholesterol}
                    onChange={(e) => updateField('cholesterol', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxHR">Maximum Heart Rate</Label>
                  <Input
                    id="maxHR"
                    type="number"
                    value={formData.maxHR}
                    onChange={(e) => updateField('maxHR', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="oldpeak">ST Depression (Oldpeak)</Label>
                  <Input
                    id="oldpeak"
                    type="number"
                    step="0.1"
                    value={formData.oldpeak}
                    onChange={(e) => updateField('oldpeak', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="diabetes"
                    checked={formData.diabetes}
                    onCheckedChange={(checked) => updateField('diabetes', checked)}
                  />
                  <Label htmlFor="diabetes">Fasting Blood Sugar &gt; 120 mg/dl</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smoking"
                    checked={formData.smoking}
                    onCheckedChange={(checked) => updateField('smoking', checked)}
                  />
                  <Label htmlFor="smoking">Smoking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="exerciseAngina"
                    checked={formData.exerciseAngina}
                    onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                  />
                  <Label htmlFor="exerciseAngina">Exercise Induced Angina</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Lifestyle Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Advanced Lifestyle Assessment
                <Badge variant="secondary" className="ml-2">Premium</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Analysis
                <Badge variant="secondary" className="ml-2">Unlimited</Badge>
              </CardTitle>
              <CardDescription>
                Upload medical documents for AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
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

              {aiProcessing.length > 0 && (
                <Alert className="mt-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Generated Insights
                <Badge variant="secondary" className="ml-2">Premium</Badge>
              </CardTitle>
              <CardDescription>
                Advanced AI analysis and personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
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
                      Generate Advanced Analysis
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}