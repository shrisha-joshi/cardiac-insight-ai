import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  AlertTriangle,
  BarChart3,
  Users,
  Info
} from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PDFService, type PDFReportData } from '@/services/pdfService';
import { enhancedAiService, type EnhancedAIRequest, type EnhancedAIResponse } from '@/services/enhancedAIService';
import type { User } from '@supabase/supabase-js';
import { PDFParseConfirmationModal } from '@/components/PDFParseConfirmationModal';
import { parsePDFForFormData, type ParsedField } from '@/services/pdfParserService';

// Import new dashboard components
import { FormSection, FormFieldGroup } from '@/components/ui/form-section';
import { LoadingState } from '@/components/ui/loading-state';
import { ActionButton } from '@/components/ui/action-button';
import { FormPagination } from '@/components/ui/form-pagination';

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
  const [nameError, setNameError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
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
    extractedData?: {
      fields: ParsedField[];
      extractionMethod: 'text-extraction' | 'ocr';
      documentCount: number;
    };
  } | null>(null);
  
  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<EnhancedAIResponse | null>(null);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
  
  // PDF parsing modal state
  const [pdfParseModalOpen, setPdfParseModalOpen] = useState(false);
  const [currentParsedFields, setCurrentParsedFields] = useState<ParsedField[]>([]);
  const [currentUnmappedData, setCurrentUnmappedData] = useState<string[]>([]);
  const [currentExtractionMethod, setCurrentExtractionMethod] = useState<'text-extraction' | 'ocr'>('text-extraction');
  
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
    return <LoadingState message="Checking authentication..." tier="premium" />;
  }

  // If no user after loading, this shouldn't happen due to redirect, but safety check
  if (!user) {
    return null;
  }

  const updateField = (field: keyof PatientData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return patientName.trim().length >= 2 && !nameError;
      case 2: return formData.age > 0 && formData.restingBP > 0;
      case 3: return true; // Health conditions are optional
      case 4: return true; // Lifestyle is optional
      case 5: return true; // Documents are optional
      default: return true;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check if the first file is a PDF
    const firstFile = files[0];
    if (firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf')) {
      try {
        const parseResult = await parsePDFForFormData(firstFile);
        
        if (parseResult.success && parseResult.parsedFields.length > 0) {
          // Found recognizable fields - show confirmation modal
          setCurrentParsedFields(parseResult.parsedFields);
          setCurrentUnmappedData(parseResult.unmappedData);
          setCurrentExtractionMethod(parseResult.extractionMethod);
          setPdfParseModalOpen(true);
          
          toast({
            title: "PDF Parsed Successfully",
            description: `Found ${parseResult.parsedFields.length} medical field(s). Review and confirm the data.`,
          });
        } else {
          // No recognizable fields found
          toast({
            title: "No Medical Data Found",
            description: "Could not extract recognizable medical data from PDF. Please enter data manually.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error('PDF parsing error:', error);
        toast({
          title: "PDF Parsing Error",
          description: "Failed to parse PDF. Please fill the form manually.",
          variant: "destructive",
        });
      }
    }
    
    setUploadedFiles(prev => [...prev, ...files]);
    
    toast({
      title: "Files Uploaded",
      description: `${files.length} document(s) uploaded successfully.`,
    });
  };

  const handlePDFAccept = () => {
    // Auto-fill form with parsed data
    currentParsedFields.forEach(field => {
      if (!field.unknown_field && field.fieldName in formData) {
        updateField(field.fieldName as keyof PatientData, field.value);
      }
    });

    setPdfParseModalOpen(false);
    toast({
      title: "Form Auto-filled",
      description: `${currentParsedFields.length} field(s) populated from PDF.`,
    });
  };

  const handlePDFReject = () => {
    toast({
      title: "PDF Parsing Cancelled",
      description: "Please fill the form manually.",
    });
    setPdfParseModalOpen(false);
    // Clear parsed data so it won't appear in the report
    setCurrentParsedFields([]);
    setCurrentUnmappedData([]);
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
      timeline: totalRisk > 60 ? '3-6 months' : totalRisk > 30 ? '6-12 months' : '12+ months',
      extractedData: currentParsedFields.length > 0 ? {
        fields: currentParsedFields,
        extractionMethod: currentExtractionMethod,
        documentCount: uploadedFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')).length
      } : undefined
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
      
      const sourceDisplay = suggestions.source === 'gemini' ? '✨ Google Gemini AI' : 
                           suggestions.source === 'openai' ? '🤖 OpenAI GPT' : 
                           '🔬 Medical AI Assistant';
      
      toast({
        title: "AI Recommendations Ready",
        description: `Personalized health suggestions generated by ${sourceDisplay}`,
        duration: 5000,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting AI suggestions:', error);
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
    if (!generatedReport) {
      toast({
        title: "No Report Available",
        description: "Please generate a report first before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reportId = `PRM-${Date.now().toString().slice(-6)}`;
      
      const pdfData: PDFReportData = {
        patientInfo: {
          name: patientName || generatedReport.patientInfo.name,
          age: generatedReport.patientInfo.age,
          gender: generatedReport.patientInfo.gender,
          assessmentDate: generatedReport.patientInfo.assessmentDate
        },
        riskAssessment: {
          overallRisk: generatedReport.riskScore,
          riskLevel: generatedReport.riskLevel,
          factors: generatedReport.keyRiskFactors
        },
        recommendations: {
          medicines: generatedReport.recommendations || [],
          ayurveda: aiSuggestions?.suggestions?.ayurveda || [],
          yoga: aiSuggestions?.suggestions?.yoga || [],
          diet: aiSuggestions?.suggestions?.diet || []
        },
        reportType: 'premium',
        reportId: reportId
      };

      await PDFService.generateReport(pdfData);
      
      toast({
        title: "PDF Downloaded",
        description: "Premium assessment report has been downloaded successfully.",
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating PDF:', error);
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
    setCurrentStep(1); // Reset to step 1
  };

  if (showReport && generatedReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Modern Report Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 dark:from-teal-800 dark:via-emerald-800 dark:to-green-800 text-white rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <Crown className="h-10 w-10" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Premium Cardiovascular Assessment</h1>
                    <p className="text-teal-100 dark:text-teal-200 text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI-Powered Comprehensive Analysis
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20">
                  <div className="text-sm text-teal-200 dark:text-teal-300 mb-1">Report ID</div>
                  <div className="font-mono text-2xl font-bold">CR-{Date.now().toString().slice(-6)}</div>
                  <div className="text-xs text-teal-200 dark:text-teal-300 mt-1">{new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Patient Info & Risk Score */}
            <div className="lg:col-span-1 space-y-6">
              {/* Patient Information Card */}
              <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Name</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{generatedReport.patientInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Age</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{generatedReport.patientInfo.age} years</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Gender</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{generatedReport.patientInfo.gender}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Date</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{generatedReport.patientInfo.assessmentDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Score - Circular Progress */}
              <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      {/* Circular Progress SVG */}
                      <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 88}`}
                          strokeDashoffset={`${2 * Math.PI * 88 * (1 - generatedReport.riskScore / 100)}`}
                          className={`transition-all duration-1000 ${
                            generatedReport.riskScore < 30 ? 'text-emerald-500' :
                            generatedReport.riskScore < 60 ? 'text-amber-500' :
                            generatedReport.riskScore < 80 ? 'text-orange-500' : 'text-rose-500'
                          }`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-5xl font-bold ${
                          generatedReport.riskScore < 30 ? 'text-emerald-600 dark:text-emerald-400' :
                          generatedReport.riskScore < 60 ? 'text-amber-600 dark:text-amber-400' :
                          generatedReport.riskScore < 80 ? 'text-orange-600 dark:text-orange-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {generatedReport.riskScore}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Risk Score</div>
                      </div>
                    </div>
                    <div className={`mt-6 inline-block px-6 py-3 rounded-full text-lg font-semibold ${
                      generatedReport.riskScore < 30 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200' :
                      generatedReport.riskScore < 60 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' :
                      generatedReport.riskScore < 80 ? 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                    }`}>
                      {generatedReport.riskLevel}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Detailed Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Detailed Risk Analysis */}
              <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Risk Factor Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Cardiovascular */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cardiovascular</span>
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{generatedReport.detailedAnalysis.cardiovascular}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.detailedAnalysis.cardiovascular}%` }}
                        />
                      </div>
                    </div>
                    {/* Lifestyle */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Lifestyle</span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{generatedReport.detailedAnalysis.lifestyle}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.detailedAnalysis.lifestyle}%` }}
                        />
                      </div>
                    </div>
                    {/* Metabolic */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Metabolic</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{generatedReport.detailedAnalysis.metabolic}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.detailedAnalysis.metabolic}%` }}
                        />
                      </div>
                    </div>
                    {/* Environmental */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Environmental</span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{generatedReport.detailedAnalysis.environmental}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.detailedAnalysis.environmental}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Risk Factors */}
              <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Key Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {generatedReport.keyRiskFactors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-600 dark:bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{factor}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Extracted Medical Data from PDF/DOCX */}
          {generatedReport.extractedData && generatedReport.extractedData.fields.length > 0 && (
            <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Extracted Medical Data
                  <Badge variant="secondary" className="ml-2">
                    {generatedReport.extractedData.extractionMethod === 'ocr' ? 'OCR Scanned' : 'Text Extracted'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Data automatically extracted from {generatedReport.extractedData.documentCount} uploaded document(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedReport.extractedData.fields.map((field, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-2 ${
                        field.confidence === 'high' 
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
                          : field.confidence === 'medium'
                          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800'
                          : 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {field.label || field.fieldName}
                        </div>
                        <Badge 
                          variant={field.confidence === 'high' ? 'default' : field.confidence === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {field.confidence}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {typeof field.value === 'boolean' 
                          ? (field.value ? 'Yes' : 'No')
                          : field.value}
                      </div>
                      {field.rawText && field.rawText !== field.value && (
                        <div className="text-xs text-gray-500 mt-1 truncate" title={field.rawText}>
                          Source: {field.rawText}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Extraction Method:</strong> {generatedReport.extractedData.extractionMethod === 'ocr' 
                        ? 'OCR (Optical Character Recognition) - Scanned document processed'
                        : 'Text Extraction - Direct text parsing from digital document'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Clinical Recommendations */}
          <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Clinical Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {generatedReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Documents */}
          {uploadedFiles.length > 0 && (
            <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
            <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <span className="dark:text-gray-100">AI-Powered Medical Recommendations</span>
                    {aiSuggestions && (
                      <Badge variant="outline" className="ml-2 text-xs border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300">
                        ✨ {aiSuggestions.source === 'gemini' ? 'Gemini AI' : aiSuggestions.source === 'openai' ? 'OpenAI GPT' : 'AI Assistant'}
                      </Badge>
                    )}
                  </CardTitle>
                  {aiSuggestions && !loadingAISuggestions && generatedReport && (
                    <Button
                      onClick={() => getAISuggestions(
                        generatedReport.riskLevel.toLowerCase().includes('low') ? 'low' :
                        generatedReport.riskLevel.toLowerCase().includes('moderate') ? 'moderate' :
                        generatedReport.riskLevel.toLowerCase().includes('high') ? 'high' : 'critical',
                        formData
                      )}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                    >
                      <Brain className="h-4 w-4" />
                      Regenerate
                    </Button>
                  )}
                </div>
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
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                          <Pill className="h-5 w-5" />
                          Recommended Medicines
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.medicines.map((medicine, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                              <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">{medicine}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ayurveda Section */}
                    {aiSuggestions.suggestions.ayurveda && aiSuggestions.suggestions.ayurveda.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                        <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                          <Leaf className="h-5 w-5" />
                          Ayurvedic Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.ayurveda.map((remedy, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                              <div className="font-semibold text-amber-700 dark:text-amber-300 mb-2">{remedy}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yoga Section */}
                    {aiSuggestions.suggestions.yoga && aiSuggestions.suggestions.yoga.length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                        <h3 className="text-xl font-bold text-purple-800 dark:text-purple-300 mb-4 flex items-center gap-2">
                          <HeartPulse className="h-5 w-5" />
                          Yoga & Exercise Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.yoga.map((yoga, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                              <div className="font-semibold text-purple-700 dark:text-purple-300 mb-2">{yoga}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diet Section */}
                    {aiSuggestions.suggestions.diet && aiSuggestions.suggestions.diet.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                          <Apple className="h-5 w-5" />
                          Dietary Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.diet.map((diet, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
                              <div className="font-semibold text-green-700 dark:text-green-300 mb-2">{diet}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle & General Recommendations */}
                    {aiSuggestions.suggestions.lifestyle && aiSuggestions.suggestions.lifestyle.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Lifestyle Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.lifestyle.map((lifestyle, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-300 mb-1">{lifestyle}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {aiSuggestions.warnings && aiSuggestions.warnings.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Important Warnings
                        </h3>
                        <ul className="space-y-2">
                          {aiSuggestions.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-red-700 dark:text-red-300">{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                            AI Source: {aiSuggestions.source === 'gemini' ? 'Google Gemini' : aiSuggestions.source === 'openai' ? 'OpenAI' : 'Rule-based AI'}
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-line">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button
              onClick={downloadReportAsPDF}
              className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 hover:from-teal-700 hover:via-emerald-700 hover:to-green-700 text-white px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all rounded-xl font-semibold w-full sm:w-auto"
              size="lg"
            >
              <Download className="mr-2 h-6 w-6" />
              Download PDF Report
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all rounded-xl font-semibold w-full sm:w-auto"
            >
              <Activity className="mr-2 h-6 w-6" />
              New Assessment
            </Button>
          </div>

          {/* Modern Footer */}
          <div className="mt-8 p-6 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Medical Disclaimer</span>
            </div>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              This report is generated by AI and should be reviewed by a qualified healthcare professional.
            </p>
            <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-2">
              Report generated on {generatedReport.patientInfo.assessmentDate} • Premium AI Assessment • Confidential
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-teal-900/30">
      {/* Compact Fixed Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-800 dark:to-emerald-800 shadow-lg border-b-2 border-teal-400/30 dark:border-teal-600/30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 dark:bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Premium Dashboard
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    Step {currentStep}/{totalSteps}
                  </Badge>
                </h1>
                <p className="text-xs text-teal-100 dark:text-teal-200">AI-powered cardiovascular analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <FileText className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{uploadedFiles.length} docs</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span className="text-sm font-medium text-white">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pt-6">
        {/* Main Assessment Form */}
        <Card className="shadow-xl border-teal-200/50 dark:border-teal-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 px-6 md:px-8">
            <form className="space-y-8">
            
            {/* Step 1: Patient Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <FormSection
                  title="Patient Information"
                  description="Basic demographic and contact details"
                  icon={Stethoscope}
                  accent="teal"
                  delay={0.1}
                >
              <FormFieldGroup columns={2}>
                <div className="space-y-2.5">
                  <Label htmlFor="patientName" className="text-base font-medium text-gray-700 dark:text-gray-200">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPatientName(value);
                      if (value.trim().length === 0) {
                        setNameError('Patient name is required');
                      } else if (value.trim().length < 2) {
                        setNameError('Name must be at least 2 characters');
                      } else {
                        setNameError('');
                      }
                    }}
                    placeholder="Enter patient name"
                    className={`h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all ${nameError ? 'border-red-500 dark:border-red-500' : ''}`}
                    aria-invalid={nameError ? 'true' : 'false'}
                    aria-describedby={nameError ? 'name-error' : undefined}
                  />
                  {nameError && (
                    <p id="name-error" className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {nameError}
                    </p>
                  )}
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="age" className="text-base font-medium text-gray-700 dark:text-gray-200">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                    min="1"
                    max="120"
                    placeholder="Enter age"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="gender" className="text-base font-medium text-gray-700 dark:text-gray-200">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="male" className="dark:text-gray-100 dark:focus:bg-gray-700">Male</SelectItem>
                      <SelectItem value="female" className="dark:text-gray-100 dark:focus:bg-gray-700">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="chestPainType" className="text-base font-medium text-gray-700 dark:text-gray-200">Chest Pain Type</Label>
                  <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="Select chest pain type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="typical" className="dark:text-gray-100 dark:focus:bg-gray-700">Severe chest pain during physical activity</SelectItem>
                      <SelectItem value="atypical" className="dark:text-gray-100 dark:focus:bg-gray-700">Mild chest discomfort occasionally</SelectItem>
                      <SelectItem value="non-anginal" className="dark:text-gray-100 dark:focus:bg-gray-700">Chest pain not related to heart</SelectItem>
                      <SelectItem value="asymptomatic" className="dark:text-gray-100 dark:focus:bg-gray-700">No chest pain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="height" className="text-base font-medium text-gray-700 dark:text-gray-200">Height (cm) - Optional</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    min="100"
                    max="250"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                  />
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Your height in centimeters</p>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="weight" className="text-base font-medium text-gray-700 dark:text-gray-200">Weight (kg) - Optional</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    min="30"
                    max="300"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                  />
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Your weight in kilograms</p>
                </div>
              </FormFieldGroup>
            </FormSection>
            
            <FormPagination
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNextStep}
              onPrevious={handlePreviousStep}
              canGoNext={canProceedToNext()}
              stepTitles={['Patient Information', 'Vital Signs', 'Health Conditions', 'Lifestyle', 'Documents']}
            />
              </motion.div>
            )}

            {/* Step 2: Vital Signs */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <FormSection
                  title="Vital Signs & Health Metrics"
                  description="Blood pressure, heart rate, and key measurements"
                  icon={Stethoscope}
                  accent="teal"
                  delay={0.2}
                >
              <FormFieldGroup columns={2}>
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Blood Pressure Category</Label>
                  <Select value={formData.restingBP > 140 ? 'high' : formData.restingBP > 120 ? 'elevated' : 'normal'} 
                          onValueChange={(value) => updateField('restingBP', value === 'high' ? 160 : value === 'elevated' ? 130 : 110)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="Select blood pressure range" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="normal" className="dark:text-gray-100 dark:focus:bg-gray-700">Normal (Less than 120/80)</SelectItem>
                      <SelectItem value="elevated" className="dark:text-gray-100 dark:focus:bg-gray-700">Elevated (120-129/Less than 80)</SelectItem>
                      <SelectItem value="high" className="dark:text-gray-100 dark:focus:bg-gray-700">High (130/80 or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Cholesterol Level</Label>
                  <Select value={formData.cholesterol > 240 ? 'high' : formData.cholesterol > 200 ? 'borderline' : 'normal'} 
                          onValueChange={(value) => updateField('cholesterol', value === 'high' ? 280 : value === 'borderline' ? 220 : 180)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="Select cholesterol range" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="normal" className="dark:text-gray-100 dark:focus:bg-gray-700">Normal (Less than 200 mg/dL)</SelectItem>
                      <SelectItem value="borderline" className="dark:text-gray-100 dark:focus:bg-gray-700">Borderline High (200-239 mg/dL)</SelectItem>
                      <SelectItem value="high" className="dark:text-gray-100 dark:focus:bg-gray-700">High (240 mg/dL or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Resting Heart Rate</Label>
                  <Select 
                    value={formData.maxHR < 70 ? 'low' : formData.maxHR > 100 ? 'high' : 'normal'} 
                    onValueChange={(value) => updateField('maxHR', value === 'low' ? 60 : value === 'high' ? 110 : 80)}
                  >
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="Select heart rate range" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="low" className="dark:text-gray-100 dark:focus:bg-gray-700">Low (50-69 bpm) - Athletic/Very Fit</SelectItem>
                      <SelectItem value="normal" className="dark:text-gray-100 dark:focus:bg-gray-700">Normal (70-100 bpm) - Healthy Range</SelectItem>
                      <SelectItem value="high" className="dark:text-gray-100 dark:focus:bg-gray-700">High (100+ bpm) - May Need Attention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Recent ECG Results</Label>
                  <Select value={formData.restingECG} onValueChange={(value) => updateField('restingECG', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="Select ECG result" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="normal" className="dark:text-gray-100 dark:focus:bg-gray-700">Normal - No issues found</SelectItem>
                      <SelectItem value="st-t" className="dark:text-gray-100 dark:focus:bg-gray-700">Abnormal - Minor irregularities detected</SelectItem>
                      <SelectItem value="lvh" className="dark:text-gray-100 dark:focus:bg-gray-700">Abnormal - Heart enlargement detected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Exercise Capacity</Label>
                  <Select value={formData.oldpeak > 2 ? 'low' : formData.oldpeak > 1 ? 'moderate' : 'good'} 
                          onValueChange={(value) => updateField('oldpeak', value === 'low' ? 3 : value === 'moderate' ? 1.5 : 0.5)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="How well can you exercise?" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="good" className="dark:text-gray-100 dark:focus:bg-gray-700">Good - Can exercise vigorously without issues</SelectItem>
                      <SelectItem value="moderate" className="dark:text-gray-100 dark:focus:bg-gray-700">Moderate - Some difficulty with intense exercise</SelectItem>
                      <SelectItem value="low" className="dark:text-gray-100 dark:focus:bg-gray-700">Limited - Difficulty with most physical activities</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Your general ability to perform physical activities</p>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Exercise Test Results</Label>
                  <Select value={formData.stSlope} onValueChange={(value) => updateField('stSlope', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all">
                      <SelectValue placeholder="Select exercise test result" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="up" className="dark:text-gray-100 dark:focus:bg-gray-700">Normal - Heart responds well to exercise</SelectItem>
                      <SelectItem value="flat" className="dark:text-gray-100 dark:focus:bg-gray-700">Mild concern - Flat response to exercise</SelectItem>
                      <SelectItem value="down" className="dark:text-gray-100 dark:focus:bg-gray-700">Concerning - Poor response to exercise</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Results from stress test or exercise ECG (if done)</p>
                </div>
              </FormFieldGroup>
            </FormSection>
            
            <FormPagination
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNextStep}
              onPrevious={handlePreviousStep}
              canGoNext={canProceedToNext()}
              stepTitles={['Patient Information', 'Vital Signs', 'Health Conditions', 'Lifestyle', 'Documents']}
            />
              </motion.div>
            )}

            {/* Step 3: Health Conditions */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <FormSection
                  title="Health Conditions"
                  description="Medical history and existing conditions"
                  icon={Heart}
                  accent="rose"
                  delay={0.3}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                  <div className="flex-1 pr-4">
                    <Label className="text-base font-medium text-gray-800 dark:text-gray-100 cursor-pointer">Diabetes</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Diagnosed with diabetes or high blood sugar</p>
                  </div>
                  <Switch
                    checked={formData.diabetes}
                    onCheckedChange={(checked) => updateField('diabetes', checked)}
                    className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500"
                  />
                </div>
                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                  <div className="flex-1 pr-4">
                    <Label className="text-base font-medium text-gray-800 dark:text-gray-100 cursor-pointer">Smoking</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current or past smoker</p>
                  </div>
                  <Switch
                    checked={formData.smoking}
                    onCheckedChange={(checked) => updateField('smoking', checked)}
                    className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500"
                  />
                </div>
                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                  <div className="flex-1 pr-4">
                    <Label className="text-base font-medium text-gray-800 dark:text-gray-100 cursor-pointer">Exercise Angina</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Chest pain during exercise</p>
                  </div>
                  <Switch
                    checked={formData.exerciseAngina}
                    onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                    className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500"
                  />
                </div>
                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                  <div className="flex-1 pr-4">
                    <Label className="text-base font-medium text-gray-800 dark:text-gray-100 cursor-pointer">Previous Heart Attack</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">History of myocardial infarction</p>
                  </div>
                  <Switch
                    checked={formData.previousHeartAttack}
                    onCheckedChange={(checked) => updateField('previousHeartAttack', checked)}
                    className="data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-500"
                  />
                </div>
              </div>
            </FormSection>
            
            <FormPagination
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNextStep}
              onPrevious={handlePreviousStep}
              canGoNext={canProceedToNext()}
              stepTitles={['Patient Information', 'Vital Signs', 'Health Conditions', 'Lifestyle', 'Documents']}
            />
              </motion.div>
            )}

            {/* Step 4: Lifestyle Assessment */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Conditional Questions */}
                {(formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
                  <>
                    <FormSection
                      title="Additional Medical Information"
                      description="Follow-up questions based on your conditions"
                      icon={Heart}
                      accent="rose"
                      delay={0.4}
                    >
                  <FormFieldGroup columns={2}>
                    {formData.previousHeartAttack && (
                      <div className="space-y-2.5">
                        <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Are you taking cholesterol medication?</Label>
                        <Select value={formData.cholesterolMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('cholesterolMedication', value === 'yes')}>
                          <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-all">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="yes" className="dark:text-gray-100 dark:focus:bg-gray-700">Yes, taking cholesterol medication</SelectItem>
                            <SelectItem value="no" className="dark:text-gray-100 dark:focus:bg-gray-700">No, not taking medication</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.diabetes && (
                      <div className="space-y-2.5">
                        <Label className="text-base font-medium text-gray-700 dark:text-gray-200">What diabetes treatment are you taking?</Label>
                        <Select value={formData.diabetesMedication} onValueChange={(value) => updateField('diabetesMedication', value)}>
                          <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-all">
                            <SelectValue placeholder="Select treatment type" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="insulin" className="dark:text-gray-100 dark:focus:bg-gray-700">Insulin injections</SelectItem>
                            <SelectItem value="tablets" className="dark:text-gray-100 dark:focus:bg-gray-700">Oral tablets/pills</SelectItem>
                            <SelectItem value="both" className="dark:text-gray-100 dark:focus:bg-gray-700">Both insulin and tablets</SelectItem>
                            <SelectItem value="none" className="dark:text-gray-100 dark:focus:bg-gray-700">No medication currently</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.restingBP > 130 && (
                      <>
                        <div className="space-y-2.5">
                          <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Are you taking blood pressure medication?</Label>
                          <Select value={formData.bpMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('bpMedication', value === 'yes')}>
                            <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-all">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              <SelectItem value="yes" className="dark:text-gray-100 dark:focus:bg-gray-700">Yes, taking BP medication</SelectItem>
                              <SelectItem value="no" className="dark:text-gray-100 dark:focus:bg-gray-700">No, not taking medication</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Have you made lifestyle/diet changes recently?</Label>
                          <Select value={formData.lifestyleChanges ? 'yes' : 'no'} onValueChange={(value) => updateField('lifestyleChanges', value === 'yes')}>
                            <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-all">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              <SelectItem value="yes" className="dark:text-gray-100 dark:focus:bg-gray-700">Yes, made significant changes</SelectItem>
                              <SelectItem value="no" className="dark:text-gray-100 dark:focus:bg-gray-700">No, no major changes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </FormFieldGroup>
                </FormSection>
              </>
            )}

            {/* Lifestyle Assessment */}
            <FormSection
              title="Lifestyle Assessment"
              description="Daily habits and wellness metrics (Premium Interactive Sliders)"
              icon={TrendingUp}
              accent="emerald"
              delay={0.5}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Dietary Preference</Label>
                  <Select value={formData.dietType} onValueChange={(value) => updateField('dietType', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all">
                      <SelectValue placeholder="Select diet type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="vegetarian" className="dark:text-gray-100 dark:focus:bg-gray-700">Vegetarian</SelectItem>
                      <SelectItem value="non-vegetarian" className="dark:text-gray-100 dark:focus:bg-gray-700">Non-Vegetarian</SelectItem>
                      <SelectItem value="vegan" className="dark:text-gray-100 dark:focus:bg-gray-700">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-medium text-gray-700 dark:text-gray-200">Physical Activity Level</Label>
                  <Select value={formData.physicalActivity} onValueChange={(value) => updateField('physicalActivity', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all">
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="low" className="dark:text-gray-100 dark:focus:bg-gray-700">Low - Minimal exercise</SelectItem>
                      <SelectItem value="moderate" className="dark:text-gray-100 dark:focus:bg-gray-700">Moderate - Regular light exercise</SelectItem>
                      <SelectItem value="high" className="dark:text-gray-100 dark:focus:bg-gray-700">High - Intensive regular exercise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="sleepHours" className="text-base font-medium text-gray-700 dark:text-gray-200">Average Sleep Hours</Label>
                  <Input
                    id="sleepHours"
                    type="number"
                    value={formData.sleepHours}
                    onChange={(e) => updateField('sleepHours', parseInt(e.target.value) || 7)}
                    min="3"
                    max="12"
                    placeholder="7"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
                  />
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Hours of sleep per night on average</p>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="stressLevelInput" className="text-base font-medium text-gray-700 dark:text-gray-200">Stress Level (1-10)</Label>
                  <Input
                    id="stressLevelInput"
                    type="number"
                    value={formData.stressLevel}
                    onChange={(e) => updateField('stressLevel', parseInt(e.target.value) || 5)}
                    min="1"
                    max="10"
                    placeholder="5"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
                  />
                  <p className="text-sm text-muted-foreground dark:text-gray-400">1 = Very relaxed, 10 = Extremely stressed</p>
                </div>
              </div>
              <div className="space-y-8">
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-emerald-200 dark:border-gray-700">
                  <Label className="text-base font-medium mb-4 block text-gray-800 dark:text-gray-100">Stress Level (1-10) - Interactive</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px] flex items-center gap-1">😌 Low</span>
                    <Slider
                      value={[formData.stressLevel || 5]}
                      onValueChange={(value) => updateField('stressLevel', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1 [&_[role=slider]]:bg-emerald-600 dark:[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-700 dark:[&_[role=slider]]:border-emerald-400"
                    />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px] flex items-center gap-1">😰 High</span>
                    <Badge variant="outline" className="ml-2 bg-white dark:bg-gray-700 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 font-semibold min-w-[50px] justify-center">{formData.stressLevel}/10</Badge>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-blue-200 dark:border-gray-700">
                  <Label className="text-base font-medium mb-4 block text-gray-800 dark:text-gray-100">Sleep Quality (1-10)</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[70px] flex items-center gap-1">😴 Poor</span>
                    <Slider
                      value={[formData.sleepQuality || 7]}
                      onValueChange={(value) => updateField('sleepQuality', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1 [&_[role=slider]]:bg-blue-600 dark:[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-700 dark:[&_[role=slider]]:border-blue-400"
                    />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[90px] flex items-center gap-1">😊 Excellent</span>
                    <Badge variant="outline" className="ml-2 bg-white dark:bg-gray-700 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 font-semibold min-w-[50px] justify-center">{formData.sleepQuality}/10</Badge>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-purple-200 dark:border-gray-700">
                  <Label className="text-base font-medium mb-4 block text-gray-800 dark:text-gray-100">Exercise Frequency (days per week)</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[50px] flex items-center gap-1">🛋️ 0</span>
                    <Slider
                      value={[formData.exerciseFrequency || 3]}
                      onValueChange={(value) => updateField('exerciseFrequency', value[0])}
                      max={7}
                      min={0}
                      step={1}
                      className="flex-1 [&_[role=slider]]:bg-purple-600 dark:[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-700 dark:[&_[role=slider]]:border-purple-400"
                    />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[50px] flex items-center gap-1">💪 7</span>
                    <Badge variant="outline" className="ml-2 bg-white dark:bg-gray-700 border-purple-500 dark:border-purple-400 text-purple-700 dark:text-purple-300 font-semibold min-w-[70px] justify-center">{formData.exerciseFrequency} days</Badge>
                  </div>
                </div>
              </div>
            </FormSection>
            
            <FormPagination
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNextStep}
              onPrevious={handlePreviousStep}
              canGoNext={canProceedToNext()}
              stepTitles={['Patient Information', 'Vital Signs', 'Health Conditions', 'Lifestyle', 'Documents']}
            />
              </motion.div>
            )}

            {/* Step 5: Document Upload & Review */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <FormSection
                  title="Medical Document Upload"
                  description="Upload unlimited medical reports and documents (Premium Feature)"
                  icon={Upload}
                  accent="teal"
                  delay={0.6}
                >
              <div className="relative border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-xl p-10 text-center bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 hover:from-teal-100 hover:to-emerald-100 dark:hover:from-teal-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 cursor-pointer group">
                <Upload className="mx-auto h-16 w-16 text-teal-500 dark:text-teal-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload ECG reports, lab results, medical images, and other relevant documents
                  </p>
                  <p className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-3 inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                    ✨ Premium: Unlimited uploads • Supports all medical file formats
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
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800/30 dark:to-gray-800/20 rounded-xl border border-blue-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Uploaded Documents ({uploadedFiles.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1 text-gray-700 dark:text-gray-200 truncate" title={file.name}>{file.name}</span>
                        <Badge variant="outline" className="text-green-700 dark:text-green-400 border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20 flex-shrink-0">Ready</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FormSection>

            {/* Generate Report Button */}
            <div className="pt-10">
              <ActionButton
                onClick={generateComprehensiveReport}
                loading={processingLoading}
                disabled={!patientName.trim() || nameError !== ''}
                variant="primary"
                size="lg"
                fullWidth
                icon={Brain}
              >
                Generate Premium AI Report
              </ActionButton>
              {(!patientName.trim() || nameError) && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-3 text-center font-medium flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {nameError || 'Please enter patient name to generate report'}
                </p>
              )}
            </div>

            {/* Premium Features Highlight */}
            <div className="bg-gradient-to-r from-teal-100 via-emerald-100 to-teal-100 dark:from-teal-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 p-8 rounded-xl border-2 border-teal-300 dark:border-teal-700/50 shadow-lg mt-8">
              <h4 className="font-bold text-teal-900 dark:text-teal-200 mb-5 text-xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                Your Premium Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Comprehensive AI Analysis</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Unlimited Document Uploads</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Detailed PDF Report</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Clinical Recommendations</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Advanced Risk Stratification</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Personalized Insights</span>
                </div>
              </div>
            </div>
            
            <FormPagination
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNextStep}
              onPrevious={handlePreviousStep}
              canGoNext={canProceedToNext()}
              stepTitles={['Patient Information', 'Vital Signs', 'Health Conditions', 'Lifestyle', 'Documents']}
            />
              </motion.div>
            )}
            </form>
          </CardContent>
        </Card>
      </div>

      <PDFParseConfirmationModal
        open={pdfParseModalOpen}
        onOpenChange={setPdfParseModalOpen}
        parsedFields={currentParsedFields}
        unmappedData={currentUnmappedData}
        extractionMethod={currentExtractionMethod}
        onAccept={handlePDFAccept}
        onReject={handlePDFReject}
      />
    </div>
  );
}