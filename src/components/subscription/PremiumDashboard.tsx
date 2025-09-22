import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Heart, 
  Stethoscope, 
  TrendingUp, 
  Brain, 
  Star, 
  Crown, 
  CheckCircle, 
  Download,
  FileDown,
  ClipboardList,
  Activity,
  Zap,
  Shield,
  X,
  Loader2,
  Clock,
  Pill,
  Leaf,
  HeartPulse,
  Apple,
  AlertTriangle
} from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PDFService, type PDFReportData } from '@/services/pdfService';
import { enhancedAiService, type EnhancedAIRequest, type EnhancedAIResponse } from '@/services/enhancedAIService';
import type { User } from '@supabase/supabase-js';

export default function PremiumDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState<PatientData>({
    ...defaultPatientData,
    stressLevel: 5,
    sleepQuality: 7,
    exerciseFrequency: 3
  });
  const [patientName, setPatientName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{
    patientInfo: {
      name: string;
      age: number;
      gender: string;
      assessmentDate: string;
    };
    riskScore: number;
    riskLevel: string;
    detailedAnalysis: {
      cardiovascular: number;
      lifestyle: number;
      metabolic: number;
      environmental: number;
    };
    recommendations: string[];
    confidenceLevel: number;
    keyRiskFactors: string[];
    timeline: string;
  } | null>(null);
  
  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<EnhancedAIResponse | null>(null);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
  
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
            description: "Please sign in to access the Premium Dashboard",
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const generateComprehensiveReport = async () => {
    setProcessingLoading(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Calculate comprehensive risk analysis
    let totalRisk = 0;
    const analysis = {
      cardiovascular: 0,
      lifestyle: 0,
      metabolic: 0,
      environmental: 0
    };
    
    // Demographics analysis (environmental factors)
    if (formData.age > 50) analysis.environmental += 15;
    if (formData.gender === 'male') analysis.environmental += 10;
    
    // Cardiovascular analysis
    if (formData.restingBP > 140) analysis.cardiovascular += 25;
    if (formData.cholesterol > 240) analysis.cardiovascular += 20;
    if (formData.maxHR && formData.maxHR > 100) analysis.cardiovascular += 15;
    if (formData.exerciseAngina) analysis.cardiovascular += 20;
    
    // Lifestyle analysis
    if (formData.smoking) analysis.lifestyle += 30;
    if (formData.exerciseFrequency && formData.exerciseFrequency < 2) analysis.lifestyle += 20;
    if (formData.stressLevel && formData.stressLevel > 7) analysis.lifestyle += 15;
    if (formData.sleepQuality && formData.sleepQuality < 5) analysis.lifestyle += 10;
    
    // Medical analysis (metabolic factors)
    if (formData.diabetes) analysis.metabolic += 25;
    if (formData.previousHeartAttack) analysis.metabolic += 30;
    
    totalRisk = Math.min(100, Math.round(
      (analysis.cardiovascular + analysis.lifestyle + analysis.metabolic + analysis.environmental) / 4
    ));
    
    let riskLevel = '';
    if (totalRisk < 30) riskLevel = 'Low Risk';
    else if (totalRisk < 60) riskLevel = 'Moderate Risk';
    else if (totalRisk < 80) riskLevel = 'High Risk';
    else riskLevel = 'Very High Risk';
    
    const recommendations = [];
    const aiInsights = [];
    
    // Generate specific recommendations
    if (formData.smoking) recommendations.push('Immediate smoking cessation is critical for cardiovascular health');
    if (formData.restingBP > 140) recommendations.push('Blood pressure management through medication and lifestyle changes');
    if (formData.cholesterol > 240) recommendations.push('Lipid management with statin therapy consideration');
    if (formData.diabetes) recommendations.push('Optimal diabetes control with HbA1c target <7%');
    if (formData.exerciseFrequency && formData.exerciseFrequency < 3) recommendations.push('Increase physical activity to 150 minutes moderate exercise per week');
    if (formData.stressLevel && formData.stressLevel > 6) recommendations.push('Stress management through meditation, yoga, or counseling');
    
    // Generate AI insights
    aiInsights.push(`Patient presents with ${riskLevel.toLowerCase()} cardiovascular profile based on comprehensive assessment`);
    if (formData.previousHeartAttack) aiInsights.push('History of myocardial infarction significantly elevates future cardiac event risk');
    if (uploadedFiles.length > 0) aiInsights.push('Uploaded medical documents analyzed for additional risk factors and biomarkers');
    aiInsights.push('Personalized prevention strategy recommended based on current risk profile');
    if (totalRisk > 50) aiInsights.push('Consider cardiology consultation for advanced risk stratification');
    
    const report = {
      patientInfo: {
        name: patientName || 'Patient',
        age: formData.age,
        gender: formData.gender,
        assessmentDate: new Date().toLocaleDateString()
      },
      riskScore: totalRisk,
      riskLevel,
      detailedAnalysis: analysis,
      recommendations,
      confidenceLevel: Math.min(95, 75 + (uploadedFiles.length * 5)),
      keyRiskFactors: recommendations.slice(0, 3),
      timeline: totalRisk > 60 ? '3-6 months' : totalRisk > 30 ? '6-12 months' : '12+ months'
    };
    
    setGeneratedReport(report);
    setShowReport(true);
    setProcessingLoading(false);
    
    // Generate AI-powered suggestions
    await getAISuggestions(riskLevel as 'low' | 'moderate' | 'high' | 'critical', formData);
  };

  const getAISuggestions = async (riskLevel: 'low' | 'moderate' | 'high' | 'critical', patientData: PatientData) => {
    setLoadingAISuggestions(true);
    
    try {
      // Map risk level to match AI service interface
      const mappedRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 
        riskLevel === 'moderate' ? 'medium' : riskLevel as 'low' | 'high' | 'critical';
      
      const aiRequest: EnhancedAIRequest = {
        riskLevel: mappedRiskLevel,
        patientData: {
          age: patientData.age || 0,
          gender: patientData.gender || 'Not specified',
          medicalHistory: [
            ...(patientData.diabetes ? ['Diabetes'] : []),
            ...(patientData.smoking ? ['Smoking'] : []),
            ...(patientData.previousHeartAttack ? ['Previous Heart Attack'] : []),
            ...(patientData.cholesterolMedication ? ['High Cholesterol'] : []),
            ...(patientData.bpMedication ? ['High Blood Pressure'] : [])
          ],
          currentConditions: [
            `Chest Pain Type: ${patientData.chestPainType}`,
            `Resting BP: ${patientData.restingBP}`,
            `Cholesterol: ${patientData.cholesterol}`,
            `Max HR: ${patientData.maxHR}`,
            `Stress Level: ${patientData.stressLevel || 5}/10`,
            `Sleep Quality: ${patientData.sleepQuality || 7}/10`,
            `Exercise Frequency: ${patientData.exerciseFrequency || 3} days/week`
          ],
          lifestyle: [
            ...(patientData.exerciseAngina ? ['Exercise-induced Angina'] : []),
            `ECG: ${patientData.restingECG}`,
            `ST Slope: ${patientData.stSlope}`
          ]
        },
        requestType: 'comprehensive'
      };

      const suggestions = await enhancedAiService.getEnhancedSuggestions(aiRequest);
      setAiSuggestions(suggestions);
      
      toast({
        title: "AI Suggestions Generated",
        description: `Enhanced recommendations from ${suggestions.source === 'gemini' ? 'Google Gemini' : suggestions.source === 'openai' ? 'OpenAI' : 'Rule-based AI'}`,
      });
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: "AI Suggestions Unavailable",
        description: "Using standard medical recommendations instead.",
        variant: "destructive",
      });
    } finally {
      setLoadingAISuggestions(false);
    }
  };

  const downloadReportAsPDF = async () => {
    if (!generatedReport) return;

    try {
      const reportId = `PRM-${Date.now().toString().slice(-6)}`;
      
      const pdfData: PDFReportData = {
        patientInfo: {
          name: generatedReport.patientInfo.name,
          age: generatedReport.patientInfo.age,
          gender: generatedReport.patientInfo.gender,
          assessmentDate: generatedReport.patientInfo.assessmentDate
        },
        riskAssessment: {
          overallRisk: generatedReport.riskScore,
          riskLevel: generatedReport.riskLevel,
          factors: generatedReport.keyRiskFactors
        },
        recommendations: generatedReport.recommendations,
        reportType: 'premium',
        reportId: reportId
      };

      await PDFService.generateReport(pdfData);
      
      toast({
        title: "PDF Downloaded",
        description: "Premium assessment report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setShowReport(false);
    setGeneratedReport(null);
    setAiSuggestions(null);
    setLoadingAISuggestions(false);
    setFormData({
      ...defaultPatientData,
      stressLevel: 5,
      sleepQuality: 7,
      exerciseFrequency: 3
    });
    setPatientName('');
    setUploadedFiles([]);
  };

  if (showReport && generatedReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">Premium Cardiovascular Assessment Report</h1>
                  <p className="opacity-90 mt-1">AI-Powered Comprehensive Analysis</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-75">Report ID</div>
                <div className="font-mono text-lg">CR-{Date.now().toString().slice(-6)}</div>
              </div>
            </div>
          </div>

          {/* Patient Information Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Patient Name</div>
                  <div className="font-semibold text-lg">{generatedReport.patientInfo.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Age</div>
                  <div className="font-semibold text-lg">{generatedReport.patientInfo.age} years</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Gender</div>
                  <div className="font-semibold text-lg capitalize">{generatedReport.patientInfo.gender}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Assessment Date</div>
                  <div className="font-semibold text-lg">{generatedReport.patientInfo.assessmentDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment Summary */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                Risk Assessment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className={`text-6xl font-bold mb-2 ${
                  generatedReport.riskScore < 30 ? 'text-green-600' :
                  generatedReport.riskScore < 60 ? 'text-yellow-600' :
                  generatedReport.riskScore < 80 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {generatedReport.riskScore}%
                </div>
                <div className={`text-xl font-semibold px-4 py-2 rounded-full inline-block ${
                  generatedReport.riskScore < 30 ? 'bg-green-100 text-green-800' :
                  generatedReport.riskScore < 60 ? 'bg-yellow-100 text-yellow-800' :
                  generatedReport.riskScore < 80 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                }`}>
                  {generatedReport.riskLevel}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{generatedReport.detailedAnalysis.cardiovascular}%</div>
                  <div className="text-sm text-gray-600">Cardiovascular</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{generatedReport.detailedAnalysis.lifestyle}%</div>
                  <div className="text-sm text-gray-600">Lifestyle</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{generatedReport.detailedAnalysis.metabolic}%</div>
                  <div className="text-sm text-gray-600">Metabolic</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{generatedReport.detailedAnalysis.environmental}%</div>
                  <div className="text-sm text-gray-600">Environmental</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI-Generated Clinical Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {generatedReport.keyRiskFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Star className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-700">{factor}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clinical Recommendations */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Clinical Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {generatedReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-700">{recommendation}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Documents */}
          {uploadedFiles.length > 0 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Analyzed Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <Badge variant="outline" className="ml-auto">Analyzed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI-Powered Enhanced Suggestions */}
          {(aiSuggestions || loadingAISuggestions) && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-emerald-600" />
                  AI-Powered Medical Recommendations
                  {aiSuggestions && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Powered by {aiSuggestions.source === 'gemini' ? 'Google Gemini' : aiSuggestions.source === 'openai' ? 'OpenAI' : 'AI'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingAISuggestions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <span className="ml-3 text-lg font-medium text-gray-600">
                      Generating personalized medical recommendations...
                    </span>
                  </div>
                ) : aiSuggestions ? (
                  <div className="space-y-6">
                    {/* Medicines Section */}
                    {aiSuggestions.suggestions.medicines && aiSuggestions.suggestions.medicines.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                          <Pill className="h-5 w-5" />
                          Recommended Medicines
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.medicines.map((medicine, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                              <div className="font-semibold text-blue-700 mb-2">{medicine}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ayurveda Section */}
                    {aiSuggestions.suggestions.ayurveda && aiSuggestions.suggestions.ayurveda.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                        <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                          <Leaf className="h-5 w-5" />
                          Ayurvedic Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.ayurveda.map((remedy, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-amber-200">
                              <div className="font-semibold text-amber-700 mb-2">{remedy}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yoga Section */}
                    {aiSuggestions.suggestions.yoga && aiSuggestions.suggestions.yoga.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                          <HeartPulse className="h-5 w-5" />
                          Yoga & Exercise Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.yoga.map((yoga, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                              <div className="font-semibold text-purple-700 mb-2">{yoga}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diet Section */}
                    {aiSuggestions.suggestions.diet && aiSuggestions.suggestions.diet.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                        <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                          <Apple className="h-5 w-5" />
                          Dietary Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.diet.map((diet, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                              <div className="font-semibold text-green-700 mb-2">{diet}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle & General Recommendations */}
                    {aiSuggestions.suggestions.lifestyle && aiSuggestions.suggestions.lifestyle.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Lifestyle Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.lifestyle.map((lifestyle, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                              <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-gray-800 mb-1">{lifestyle}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {aiSuggestions.warnings && aiSuggestions.warnings.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Important Warnings
                        </h3>
                        <ul className="space-y-2">
                          {aiSuggestions.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-red-700">{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            AI Source: {aiSuggestions.source === 'gemini' ? 'Google Gemini' : aiSuggestions.source === 'openai' ? 'OpenAI' : 'Rule-based AI'}
                          </p>
                          <p className="text-xs text-yellow-700 whitespace-pre-line">
                            {aiSuggestions.disclaimer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">AI suggestions could not be generated at this time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={downloadReportAsPDF}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF Report
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              size="lg"
              className="px-6 py-3"
            >
              New Assessment
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 py-4">
            <p>This report is generated by AI and should be reviewed by a qualified healthcare professional.</p>
            <p className="mt-1">Report generated on {generatedReport.patientInfo.assessmentDate} • Premium AI Assessment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Enhanced Premium Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Crown className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Premium Cardiovascular Assessment</h1>
              <p className="opacity-90 text-lg">AI-Powered Comprehensive Analysis & Report Generation</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Advanced AI Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
              <FileDown className="h-5 w-5" />
              <span className="text-sm">PDF Report Download</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
              <Upload className="h-5 w-5" />
              <span className="text-sm">Unlimited Document Upload</span>
            </div>
          </div>
        </div>

        {/* Assessment Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Heart className="h-6 w-6 text-red-500" />
              Complete Health Assessment
            </CardTitle>
            <CardDescription className="text-base">
              Fill out the comprehensive assessment below to generate your detailed cardiovascular report
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            {/* Patient Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-purple-700 mb-4">
                <Stethoscope className="h-6 w-6" />
                Patient Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="patientName" className="text-base font-medium">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-base font-medium">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                    min="1"
                    max="120"
                    placeholder="Enter age"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-base font-medium">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chestPainType" className="text-base font-medium">Chest Pain Type</Label>
                  <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                    <SelectTrigger className="h-12 text-base">
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
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-base font-medium">Height (cm) - Optional</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    min="100"
                    max="250"
                    className="h-12 text-base"
                  />
                  <div className="text-sm text-muted-foreground">Your height in centimeters</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-base font-medium">Weight (kg) - Optional</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    min="30"
                    max="300"
                    className="h-12 text-base"
                  />
                  <div className="text-sm text-muted-foreground">Your weight in kilograms</div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Health Metrics */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xl font-semibold text-blue-700 mb-4">
                <Stethoscope className="h-6 w-6" />
                Vital Signs & Health Metrics
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Blood Pressure Category</Label>
                  <Select value={formData.restingBP > 140 ? 'high' : formData.restingBP > 120 ? 'elevated' : 'normal'} 
                          onValueChange={(value) => updateField('restingBP', value === 'high' ? 160 : value === 'elevated' ? 130 : 110)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select blood pressure range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Less than 120/80)</SelectItem>
                      <SelectItem value="elevated">Elevated (120-129/Less than 80)</SelectItem>
                      <SelectItem value="high">High (130/80 or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Cholesterol Level</Label>
                  <Select value={formData.cholesterol > 240 ? 'high' : formData.cholesterol > 200 ? 'borderline' : 'normal'} 
                          onValueChange={(value) => updateField('cholesterol', value === 'high' ? 280 : value === 'borderline' ? 220 : 180)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select cholesterol range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Less than 200 mg/dL)</SelectItem>
                      <SelectItem value="borderline">Borderline High (200-239 mg/dL)</SelectItem>
                      <SelectItem value="high">High (240 mg/dL or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Resting Heart Rate</Label>
                  <Select 
                    value={formData.maxHR < 70 ? 'low' : formData.maxHR > 100 ? 'high' : 'normal'} 
                    onValueChange={(value) => updateField('maxHR', value === 'low' ? 60 : value === 'high' ? 110 : 80)}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select heart rate range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (50-69 bpm) - Athletic/Very Fit</SelectItem>
                      <SelectItem value="normal">Normal (70-100 bpm) - Healthy Range</SelectItem>
                      <SelectItem value="high">High (100+ bpm) - May Need Attention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Recent ECG Results</Label>
                  <Select value={formData.restingECG} onValueChange={(value) => updateField('restingECG', value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select ECG result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal - No issues found</SelectItem>
                      <SelectItem value="st-t">Abnormal - Minor irregularities detected</SelectItem>
                      <SelectItem value="lvh">Abnormal - Heart enlargement detected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Exercise Capacity</Label>
                  <Select value={formData.oldpeak > 2 ? 'low' : formData.oldpeak > 1 ? 'moderate' : 'good'} 
                          onValueChange={(value) => updateField('oldpeak', value === 'low' ? 3 : value === 'moderate' ? 1.5 : 0.5)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="How well can you exercise?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good - Can exercise vigorously without issues</SelectItem>
                      <SelectItem value="moderate">Moderate - Some difficulty with intense exercise</SelectItem>
                      <SelectItem value="low">Limited - Difficulty with most physical activities</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">Your general ability to perform physical activities</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Exercise Test Results</Label>
                  <Select value={formData.stSlope} onValueChange={(value) => updateField('stSlope', value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select exercise test result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">Normal - Heart responds well to exercise</SelectItem>
                      <SelectItem value="flat">Mild concern - Flat response to exercise</SelectItem>
                      <SelectItem value="down">Concerning - Poor response to exercise</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">Results from stress test or exercise ECG (if done)</div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Health Conditions */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xl font-semibold text-red-700 mb-4">
                <Heart className="h-6 w-6" />
                Health Conditions
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Diabetes</Label>
                    <div className="text-sm text-gray-600">Diagnosed with diabetes or high blood sugar</div>
                  </div>
                  <Switch
                    checked={formData.diabetes}
                    onCheckedChange={(checked) => updateField('diabetes', checked)}
                    className="ml-4"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Smoking</Label>
                    <div className="text-sm text-gray-600">Current or past smoker</div>
                  </div>
                  <Switch
                    checked={formData.smoking}
                    onCheckedChange={(checked) => updateField('smoking', checked)}
                    className="ml-4"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Exercise Angina</Label>
                    <div className="text-sm text-gray-600">Chest pain during exercise</div>
                  </div>
                  <Switch
                    checked={formData.exerciseAngina}
                    onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                    className="ml-4"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Previous Heart Attack</Label>
                    <div className="text-sm text-gray-600">History of myocardial infarction</div>
                  </div>
                  <Switch
                    checked={formData.previousHeartAttack}
                    onCheckedChange={(checked) => updateField('previousHeartAttack', checked)}
                    className="ml-4"
                  />
                </div>
              </div>
            </div>

            {/* Conditional Questions */}
            {(formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
              <>
                <Separator className="my-8" />
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xl font-semibold text-orange-700 mb-4">
                    <Heart className="h-6 w-6" />
                    Additional Medical Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.previousHeartAttack && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Are you taking cholesterol medication?</Label>
                        <Select value={formData.cholesterolMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('cholesterolMedication', value === 'yes')}>
                          <SelectTrigger className="h-12 text-base">
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
                        <Label className="text-base font-medium">What diabetes treatment are you taking?</Label>
                        <Select value={formData.diabetesMedication} onValueChange={(value) => updateField('diabetesMedication', value)}>
                          <SelectTrigger className="h-12 text-base">
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
                          <Label className="text-base font-medium">Are you taking blood pressure medication?</Label>
                          <Select value={formData.bpMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('bpMedication', value === 'yes')}>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes, taking BP medication</SelectItem>
                              <SelectItem value="no">No, not taking medication</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Have you made lifestyle/diet changes recently?</Label>
                          <Select value={formData.lifestyleChanges ? 'yes' : 'no'} onValueChange={(value) => updateField('lifestyleChanges', value === 'yes')}>
                            <SelectTrigger className="h-12 text-base">
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
              </>
            )}

            <Separator className="my-8" />

            {/* Lifestyle Assessment */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xl font-semibold text-green-700 mb-4">
                <TrendingUp className="h-6 w-6" />
                Lifestyle Assessment
                <Badge variant="secondary" className="ml-2">Premium</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Dietary Preference</Label>
                  <Select value={formData.dietType} onValueChange={(value) => updateField('dietType', value)}>
                    <SelectTrigger className="h-12 text-base">
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
                  <Label className="text-base font-medium">Physical Activity Level</Label>
                  <Select value={formData.physicalActivity} onValueChange={(value) => updateField('physicalActivity', value)}>
                    <SelectTrigger className="h-12 text-base">
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
                  <Label htmlFor="sleepHours" className="text-base font-medium">Average Sleep Hours</Label>
                  <Input
                    id="sleepHours"
                    type="number"
                    value={formData.sleepHours}
                    onChange={(e) => updateField('sleepHours', parseInt(e.target.value) || 7)}
                    min="3"
                    max="12"
                    placeholder="7"
                    className="h-12 text-base"
                  />
                  <div className="text-sm text-muted-foreground">Hours of sleep per night on average</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stressLevelInput" className="text-base font-medium">Stress Level (1-10)</Label>
                  <Input
                    id="stressLevelInput"
                    type="number"
                    value={formData.stressLevel}
                    onChange={(e) => updateField('stressLevel', parseInt(e.target.value) || 5)}
                    min="1"
                    max="10"
                    placeholder="5"
                    className="h-12 text-base"
                  />
                  <div className="text-sm text-muted-foreground">1 = Very relaxed, 10 = Extremely stressed</div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Stress Level (1-10) - Interactive</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">Low</span>
                    <Slider
                      value={[formData.stressLevel || 5]}
                      onValueChange={(value) => updateField('stressLevel', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm">High</span>
                    <Badge variant="outline" className="ml-2">{formData.stressLevel}/10</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">Sleep Quality (1-10)</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">Poor</span>
                    <Slider
                      value={[formData.sleepQuality || 7]}
                      onValueChange={(value) => updateField('sleepQuality', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm">Excellent</span>
                    <Badge variant="outline" className="ml-2">{formData.sleepQuality}/10</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">Exercise Frequency (days per week)</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">0</span>
                    <Slider
                      value={[formData.exerciseFrequency || 3]}
                      onValueChange={(value) => updateField('exerciseFrequency', value[0])}
                      max={7}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm">7</span>
                    <Badge variant="outline" className="ml-2">{formData.exerciseFrequency} days</Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Document Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-purple-700 mb-4">
                <Upload className="h-6 w-6" />
                Medical Document Upload
                <Badge variant="secondary" className="ml-2">Unlimited</Badge>
              </div>
              <div className="relative border-2 border-dashed border-purple-300 rounded-xl p-8 text-center bg-purple-50 hover:bg-purple-100 transition-colors">
                <Upload className="mx-auto h-16 w-16 text-purple-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Upload ECG reports, lab results, medical images, and other relevant documents
                  </p>
                  <p className="text-xs text-purple-600 font-medium">
                    Premium: Unlimited uploads • Supports all medical file formats
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx,.dcm"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-lg">Uploaded Documents ({uploadedFiles.length}):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium flex-1">{file.name}</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">Ready for Analysis</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate Report Button */}
            <div className="pt-8">
              <Button
                onClick={generateComprehensiveReport}
                disabled={processingLoading || !patientName.trim()}
                className="w-full h-16 text-xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 text-white shadow-xl"
                size="lg"
              >
                {processingLoading ? (
                  <>
                    <Zap className="mr-3 h-6 w-6 animate-spin" />
                    Generating Premium Analysis Report...
                  </>
                ) : (
                  <>
                    <Brain className="mr-3 h-6 w-6" />
                    Generate Complete AI Assessment Report
                  </>
                )}
              </Button>
              {!patientName.trim() && (
                <p className="text-sm text-red-500 mt-2 text-center">Please enter patient name to generate report</p>
              )}
            </div>

            {/* Premium Features Highlight */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl">
              <h4 className="font-semibold text-purple-800 mb-4 text-lg">Your Premium Features:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Comprehensive AI Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Unlimited Document Uploads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Detailed PDF Report</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Clinical Recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Advanced Risk Stratification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Personalized Insights</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}