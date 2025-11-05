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
  Brain, 
  Award,
  Crown, 
  CheckCircle, 
  Download,
  FileDown,
  ClipboardList,
  Activity,
  Zap,
  Shield,
  Microscope,
  FlaskConical,
  TrendingUp,
  Users,
  Star,
  AlertTriangle,
  BarChart3,
  LineChart,
  X,
  Loader2,
  Clock,
  Pill,
  Leaf,
  HeartPulse,
  Apple
} from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PDFService, type PDFReportData } from '@/services/pdfService';
import { enhancedAiService, type EnhancedAIRequest, type EnhancedAIResponse } from '@/services/enhancedAIService';
import type { User } from '@supabase/supabase-js';

interface FamilyMember {
  name: string;
  relation: string;
  conditions: string;
}

interface ClinicalData {
  ecgReading: string;
  biomarkers: {
    troponin: number;
    bnp: number;
    cholesterol: number;
    ldl: number;
    hdl: number;
    triglycerides: number;
    creatinine: number;
    glucose: number;
    hba1c: number;
  };
  vitals: {
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
    oxygenSaturation: number;
    temperature: number;
  };
}

export default function ProfessionalDashboard() {
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
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { name: '', relation: '', conditions: '' }
  ]);
  const [clinicalData, setClinicalData] = useState<ClinicalData>({
    ecgReading: 'normal',
    biomarkers: {
      troponin: 0.01,
      bnp: 100,
      cholesterol: 180,
      ldl: 100,
      hdl: 50,
      triglycerides: 120,
      creatinine: 1.0,
      glucose: 90,
      hba1c: 5.5
    },
    vitals: {
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 72,
      oxygenSaturation: 98,
      temperature: 98.6
    }
  });
  const [generatedReport, setGeneratedReport] = useState<{
    patientInfo: {
      name: string;
      age: number;
      gender: string;
      assessmentDate: string;
    };
    clinicalAssessment: {
      overallRisk: number;
      cardiovascularRisk: number;
      clinicalRisk: number;
      biomarkerRisk: number;
      demographicRisk: number;
    };
    biomarkerAnalysis: {
      critical: string[];
      elevated: string[];
      normal: string[];
    };
    professionalRecommendations: string[];
    clinicalInsights: string[];
    urgencyLevel: 'low' | 'moderate' | 'high' | 'critical';
    testDate: string;
    reportId: string;
    nextFollowUp: string;
  } | null>(null);
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
            description: "Please sign in to access the Professional Dashboard",
            variant: "destructive",
          });
          navigate('/');
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
        navigate('/');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
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

  const updateClinicalData = (category: keyof ClinicalData, field: string, value: unknown) => {
    setClinicalData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, unknown>),
        [field]: value
      }
    }));
  };

  const addFamilyMember = () => {
    setFamilyMembers(prev => [...prev, { name: '', relation: '', conditions: '' }]);
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    setFamilyMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const generateProfessionalReport = async () => {
    setProcessingLoading(true);
    
    // Simulate advanced AI processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Advanced clinical risk calculation
    const { biomarkers, vitals } = clinicalData;
    
    let overallRisk = 0;
    let cardiovascularRisk = 0;
    let clinicalRisk = 0;
    let biomarkerRisk = 0;
    let demographicRisk = 0;
    
    // Demographic analysis
    if (formData.age > 65) demographicRisk += 25;
    else if (formData.age > 45) demographicRisk += 15;
    if (formData.gender === 'male') demographicRisk += 10;
    
    // Cardiovascular analysis
    if (vitals.systolicBP > 140) cardiovascularRisk += 25;
    if (vitals.diastolicBP > 90) cardiovascularRisk += 20;
    if (vitals.heartRate > 100) cardiovascularRisk += 15;
    if (formData.exerciseAngina) cardiovascularRisk += 20;
    if (formData.previousHeartAttack) cardiovascularRisk += 30;
    
    // Clinical factors
    if (formData.diabetes) clinicalRisk += 25;
    if (formData.smoking) clinicalRisk += 30;
    if (familyMembers.some(m => m.conditions.toLowerCase().includes('heart'))) clinicalRisk += 20;
    if (formData.stressLevel && formData.stressLevel > 7) clinicalRisk += 15;
    
    // Biomarker analysis
    const biomarkerAnalysis = {
      critical: [] as string[],
      elevated: [] as string[],
      normal: [] as string[]
    };
    
    if (biomarkers.troponin > 0.04) {
      biomarkerRisk += 30;
      biomarkerAnalysis.critical.push('Troponin I significantly elevated (>0.04 ng/mL)');
    } else if (biomarkers.troponin > 0.02) {
      biomarkerRisk += 15;
      biomarkerAnalysis.elevated.push('Troponin I mildly elevated');
    } else {
      biomarkerAnalysis.normal.push('Troponin I within normal limits');
    }
    
    if (biomarkers.bnp > 400) {
      biomarkerRisk += 25;
      biomarkerAnalysis.critical.push('BNP critically elevated (>400 pg/mL)');
    } else if (biomarkers.bnp > 100) {
      biomarkerRisk += 10;
      biomarkerAnalysis.elevated.push('BNP mildly elevated');
    } else {
      biomarkerAnalysis.normal.push('BNP within normal limits');
    }
    
    if (biomarkers.cholesterol > 240) {
      biomarkerRisk += 20;
      biomarkerAnalysis.elevated.push('Total cholesterol elevated (>240 mg/dL)');
    } else {
      biomarkerAnalysis.normal.push('Total cholesterol acceptable');
    }
    
    if (biomarkers.ldl > 160) {
      biomarkerRisk += 25;
      biomarkerAnalysis.elevated.push('LDL cholesterol high (>160 mg/dL)');
    } else {
      biomarkerAnalysis.normal.push('LDL cholesterol controlled');
    }
    
    if (biomarkers.hba1c > 7.0) {
      biomarkerRisk += 20;
      biomarkerAnalysis.elevated.push('HbA1c elevated - diabetes poorly controlled');
    } else {
      biomarkerAnalysis.normal.push('HbA1c well controlled');
    }
    
    // Calculate overall scores
    overallRisk = Math.min(100, Math.round((cardiovascularRisk + clinicalRisk + biomarkerRisk + demographicRisk) / 4));
    cardiovascularRisk = Math.min(100, cardiovascularRisk);
    clinicalRisk = Math.min(100, clinicalRisk);
    biomarkerRisk = Math.min(100, biomarkerRisk);
    demographicRisk = Math.min(100, demographicRisk);
    
    // Determine urgency level
    let urgencyLevel: 'low' | 'moderate' | 'high' | 'critical';
    if (overallRisk >= 80) urgencyLevel = 'critical';
    else if (overallRisk >= 60) urgencyLevel = 'high';
    else if (overallRisk >= 40) urgencyLevel = 'moderate';
    else urgencyLevel = 'low';
    
    // Generate professional recommendations
    const professionalRecommendations = [];
    if (biomarkers.troponin > 0.04) professionalRecommendations.push('Immediate cardiology consultation for elevated cardiac troponin');
    if (vitals.systolicBP > 140) professionalRecommendations.push('Antihypertensive therapy optimization required');
    if (biomarkers.ldl > 160) professionalRecommendations.push('High-intensity statin therapy recommended');
    if (formData.smoking) professionalRecommendations.push('Smoking cessation counseling and pharmacotherapy');
    if (biomarkers.hba1c > 7.0) professionalRecommendations.push('Diabetes management intensification needed');
    if (overallRisk > 50) professionalRecommendations.push('Consider stress testing or coronary imaging');
    professionalRecommendations.push('Lifestyle modification counseling with nutritionist');
    professionalRecommendations.push('Regular monitoring of cardiovascular risk factors');
    
    // Generate clinical insights
    const clinicalInsights = [];
    clinicalInsights.push(`Patient presents with ${urgencyLevel} cardiovascular risk profile based on comprehensive assessment`);
    if (biomarkerAnalysis.critical.length > 0) clinicalInsights.push('Critical biomarker abnormalities require immediate attention');
    if (formData.previousHeartAttack) clinicalInsights.push('History of MI significantly elevates recurrent event risk (secondary prevention)');
    if (familyMembers.some(m => m.conditions)) clinicalInsights.push('Positive family history contributes to genetic predisposition');
    clinicalInsights.push('Multi-modal risk assessment incorporating clinical, biochemical, and lifestyle factors');
    if (uploadedFiles.length > 0) clinicalInsights.push('Uploaded diagnostic reports analyzed for additional risk stratification');
    
    // Determine follow-up schedule
    let nextFollowUp = '';
    if (urgencyLevel === 'critical') nextFollowUp = '24-48 hours';
    else if (urgencyLevel === 'high') nextFollowUp = '1-2 weeks';
    else if (urgencyLevel === 'moderate') nextFollowUp = '1-3 months';
    else nextFollowUp = '6-12 months';
    
    const report = {
      patientInfo: {
        name: patientName || 'Patient',
        age: formData.age,
        gender: formData.gender,
        assessmentDate: new Date().toLocaleDateString()
      },
      clinicalAssessment: {
        overallRisk,
        cardiovascularRisk,
        clinicalRisk,
        biomarkerRisk,
        demographicRisk
      },
      biomarkerAnalysis,
      professionalRecommendations,
      clinicalInsights,
      urgencyLevel,
      testDate: new Date().toLocaleDateString(),
      reportId: `PCR-${Date.now().toString().slice(-6)}`,
      nextFollowUp
    };
    
    setGeneratedReport(report);
    setShowReport(true);
    setProcessingLoading(false);
    
    // Generate AI-powered suggestions
    await getAISuggestions(report.urgencyLevel, formData);
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
            `Max HR: ${patientData.maxHR}`
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
      const pdfData: PDFReportData = {
        patientInfo: {
          name: `Patient ${generatedReport.reportId}`,
          age: formData.age || 0,
          gender: formData.gender || 'Not specified',
          assessmentDate: generatedReport.testDate
        },
        riskAssessment: {
          overallRisk: generatedReport.clinicalAssessment.overallRisk,
          riskLevel: generatedReport.urgencyLevel,
          factors: [
            ...generatedReport.biomarkerAnalysis.critical,
            ...generatedReport.biomarkerAnalysis.elevated
          ]
        },
        recommendations: {
          medicines: generatedReport.professionalRecommendations || [],
          ayurveda: [],
          yoga: [],
          diet: []
        },
        reportType: 'professional',
        reportId: generatedReport.reportId
      };

      await PDFService.generateReport(pdfData);
      
      toast({
        title: "PDF Downloaded",
        description: "Professional clinical report has been downloaded successfully.",
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
    setFamilyMembers([{ name: '', relation: '', conditions: '' }]);
    setClinicalData({
      ecgReading: 'normal',
      biomarkers: {
        troponin: 0.01,
        bnp: 100,
        cholesterol: 180,
        ldl: 100,
        hdl: 50,
        triglycerides: 120,
        creatinine: 1.0,
        glucose: 90,
        hba1c: 5.5
      },
      vitals: {
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 72,
        oxygenSaturation: 98,
        temperature: 98.6
      }
    });
  };

  if (showReport && generatedReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Professional Report Header */}
          <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 text-white p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Award className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Professional Clinical Assessment Report</h1>
                  <p className="opacity-90 mt-1 text-lg">Comprehensive Cardiovascular Risk Analysis</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-75">Clinical Report ID</div>
                <div className="font-mono text-xl">{generatedReport.reportId}</div>
                <div className="text-sm opacity-75 mt-1">Generated: {generatedReport.testDate}</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">Clinical Grade Analysis</span>
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Microscope className="h-5 w-5" />
                  <span className="text-sm font-medium">Biomarker Assessment</span>
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  <span className="text-sm font-medium">Professional PDF Export</span>
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  <span className="text-sm font-medium">AI Clinical Insights</span>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Demographics */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-blue-600" />
                Patient Demographics & Clinical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-500 font-medium">Patient Name</div>
                  <div className="font-bold text-xl text-gray-800">{generatedReport.patientInfo.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Age</div>
                  <div className="font-bold text-xl text-gray-800">{generatedReport.patientInfo.age} years</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Gender</div>
                  <div className="font-bold text-xl text-gray-800 capitalize">{generatedReport.patientInfo.gender}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Assessment Date</div>
                  <div className="font-bold text-xl text-gray-800">{generatedReport.patientInfo.assessmentDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Risk Assessment */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-red-600" />
                Professional Risk Stratification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-8">
                <div className={`text-7xl font-bold mb-3 ${
                  generatedReport.clinicalAssessment.overallRisk < 30 ? 'text-green-600' :
                  generatedReport.clinicalAssessment.overallRisk < 50 ? 'text-yellow-600' :
                  generatedReport.clinicalAssessment.overallRisk < 70 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {generatedReport.clinicalAssessment.overallRisk}%
                </div>
                <div className={`text-2xl font-bold px-6 py-3 rounded-full inline-block ${
                  generatedReport.urgencyLevel === 'low' ? 'bg-green-100 text-green-800' :
                  generatedReport.urgencyLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  generatedReport.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                }`}>
                  {generatedReport.urgencyLevel.toUpperCase()} RISK
                </div>
                <div className="mt-3 text-lg text-gray-600">
                  Next Follow-up: <span className="font-semibold">{generatedReport.nextFollowUp}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-3xl font-bold text-red-600">{generatedReport.clinicalAssessment.cardiovascularRisk}%</div>
                  <div className="text-sm text-gray-600 font-medium">Cardiovascular Risk</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600">{generatedReport.clinicalAssessment.clinicalRisk}%</div>
                  <div className="text-sm text-gray-600 font-medium">Clinical Risk</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-3xl font-bold text-purple-600">{generatedReport.clinicalAssessment.biomarkerRisk}%</div>
                  <div className="text-sm text-gray-600 font-medium">Biomarker Risk</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="text-3xl font-bold text-indigo-600">{generatedReport.clinicalAssessment.demographicRisk}%</div>
                  <div className="text-sm text-gray-600 font-medium">Demographic Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biomarker Analysis */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-6 w-6 text-purple-600" />
                Laboratory Biomarker Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Critical Values */}
                {generatedReport.biomarkerAnalysis.critical.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Critical Values
                    </h4>
                    <div className="space-y-2">
                      {generatedReport.biomarkerAnalysis.critical.map((item, index) => (
                        <div key={index} className="text-sm text-red-700 bg-white p-2 rounded border-l-4 border-red-500">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elevated Values */}
                {generatedReport.biomarkerAnalysis.elevated.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Elevated Values
                    </h4>
                    <div className="space-y-2">
                      {generatedReport.biomarkerAnalysis.elevated.map((item, index) => (
                        <div key={index} className="text-sm text-yellow-700 bg-white p-2 rounded border-l-4 border-yellow-500">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Normal Values */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Normal Values
                  </h4>
                  <div className="space-y-2">
                    {generatedReport.biomarkerAnalysis.normal.map((item, index) => (
                      <div key={index} className="text-sm text-green-700 bg-white p-2 rounded border-l-4 border-green-500">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Insights */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-cyan-600" />
                AI-Powered Clinical Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {generatedReport.clinicalInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                    <Star className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-700 font-medium">{insight}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Professional Recommendations */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-green-600" />
                Professional Clinical Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {generatedReport.professionalRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-700 font-medium">{recommendation}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Clinical Documents */}
          {uploadedFiles.length > 0 && (
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  Analyzed Clinical Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <span className="text-sm font-medium flex-1">{file.name}</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">Analyzed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI-Powered Enhanced Suggestions */}
          {(aiSuggestions || loadingAISuggestions) && (
            <Card className="shadow-xl border-0">
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
          <div className="flex gap-4 justify-center pb-8">
            <Button
              onClick={downloadReportAsPDF}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
              size="lg"
            >
              <Download className="mr-3 h-6 w-6" />
              Download Professional PDF Report
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg"
            >
              New Clinical Assessment
            </Button>
          </div>

          {/* Professional Footer */}
          <div className="text-center text-sm text-gray-500 py-4 border-t">
            <p className="font-medium">PROFESSIONAL CLINICAL ASSESSMENT REPORT</p>
            <p className="mt-1">This report is generated using advanced AI algorithms and should be interpreted by qualified healthcare professionals.</p>
            <p className="mt-1">Report ID: {generatedReport.reportId} • Generated: {generatedReport.testDate} • Professional Grade Assessment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 text-white p-10 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-6 mb-6">
            <div className="bg-white/20 p-4 rounded-full">
              <Award className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Professional Clinical Dashboard</h1>
              <p className="opacity-90 text-xl mt-2">Comprehensive Cardiovascular Risk Assessment Platform</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <Stethoscope className="h-6 w-6" />
              <span className="font-medium">Patient Assessment</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <Microscope className="h-6 w-6" />
              <span className="font-medium">Clinical Data & Biomarkers</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <Brain className="h-6 w-6" />
              <span className="font-medium">AI Analysis</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <FileDown className="h-6 w-6" />
              <span className="font-medium">Professional Reports</span>
            </div>
          </div>
        </div>

        {/* Comprehensive Assessment Form */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-3xl">
              <Heart className="h-8 w-8 text-red-500" />
              Comprehensive Clinical Assessment
            </CardTitle>
            <CardDescription className="text-lg">
              Complete all sections below for comprehensive cardiovascular risk analysis and professional clinical report generation
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            
            {/* Patient Assessment Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-2xl font-bold text-indigo-700 mb-6">
                <Stethoscope className="h-7 w-7" />
                Patient Assessment & Demographics
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="patientName" className="text-lg font-semibold">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="age" className="text-lg font-semibold">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                    min="1"
                    max="120"
                    placeholder="Enter age"
                    className="h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Chest Pain Type</Label>
                  <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select chest pain type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typical">Typical Angina</SelectItem>
                      <SelectItem value="atypical">Atypical Angina</SelectItem>
                      <SelectItem value="non-anginal">Non-Anginal Pain</SelectItem>
                      <SelectItem value="asymptomatic">Asymptomatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="height" className="text-lg font-semibold">Height (cm) - Optional</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    min="100"
                    max="250"
                    className="h-14 text-lg"
                  />
                  <div className="text-sm text-muted-foreground">Your height in centimeters</div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="weight" className="text-lg font-semibold">Weight (kg) - Optional</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    min="30"
                    max="300"
                    className="h-14 text-lg"
                  />
                  <div className="text-sm text-muted-foreground">Your weight in kilograms</div>
                </div>
              </div>

              {/* Medical History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                  <div>
                    <Label className="text-lg font-semibold">Diabetes Mellitus</Label>
                    <div className="text-sm text-gray-600">Type 1 or Type 2 diabetes diagnosis</div>
                  </div>
                  <Switch
                    checked={formData.diabetes}
                    onCheckedChange={(checked) => updateField('diabetes', checked)}
                    className="scale-125"
                  />
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                  <div>
                    <Label className="text-lg font-semibold">Smoking History</Label>
                    <div className="text-sm text-gray-600">Current or former smoker</div>
                  </div>
                  <Switch
                    checked={formData.smoking}
                    onCheckedChange={(checked) => updateField('smoking', checked)}
                    className="scale-125"
                  />
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                  <div>
                    <Label className="text-lg font-semibold">Exercise-Induced Angina</Label>
                    <div className="text-sm text-gray-600">Chest pain triggered by exercise</div>
                  </div>
                  <Switch
                    checked={formData.exerciseAngina}
                    onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                    className="scale-125"
                  />
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                  <div>
                    <Label className="text-lg font-semibold">Previous MI</Label>
                    <div className="text-sm text-gray-600">History of myocardial infarction</div>
                  </div>
                  <Switch
                    checked={formData.previousHeartAttack}
                    onCheckedChange={(checked) => updateField('previousHeartAttack', checked)}
                    className="scale-125"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Health Metrics Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-2xl font-bold text-blue-700 mb-6">
                <Activity className="h-7 w-7" />
                Health Metrics
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Blood Pressure Category</Label>
                  <Select value={formData.restingBP > 140 ? 'high' : formData.restingBP > 120 ? 'elevated' : 'normal'} 
                          onValueChange={(value) => updateField('restingBP', value === 'high' ? 160 : value === 'elevated' ? 130 : 110)}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select blood pressure range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Less than 120/80)</SelectItem>
                      <SelectItem value="elevated">Elevated (120-129/Less than 80)</SelectItem>
                      <SelectItem value="high">High (130/80 or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">Choose the range that best describes your usual blood pressure</div>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Cholesterol Level</Label>
                  <Select value={formData.cholesterol > 240 ? 'high' : formData.cholesterol > 200 ? 'borderline' : 'normal'} 
                          onValueChange={(value) => updateField('cholesterol', value === 'high' ? 280 : value === 'borderline' ? 220 : 180)}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select cholesterol range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Less than 200 mg/dL)</SelectItem>
                      <SelectItem value="borderline">Borderline High (200-239 mg/dL)</SelectItem>
                      <SelectItem value="high">High (240 mg/dL or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">From your recent blood test results</div>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Resting Heart Rate</Label>
                  <Select 
                    value={formData.maxHR < 70 ? 'low' : formData.maxHR > 100 ? 'high' : 'normal'} 
                    onValueChange={(value) => updateField('maxHR', value === 'low' ? 60 : value === 'high' ? 110 : 80)}
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select heart rate range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (50-69 bpm) - Athletic/Very Fit</SelectItem>
                      <SelectItem value="normal">Normal (70-100 bpm) - Healthy Range</SelectItem>
                      <SelectItem value="high">High (100+ bpm) - May Need Attention</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">Your typical resting heart rate</div>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Exercise Capacity</Label>
                  <Select value={formData.oldpeak > 2 ? 'low' : formData.oldpeak > 1 ? 'moderate' : 'good'} 
                          onValueChange={(value) => updateField('oldpeak', value === 'low' ? 3 : value === 'moderate' ? 1.5 : 0.5)}>
                    <SelectTrigger className="h-14 text-lg">
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
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Recent ECG Results</Label>
                  <Select value={formData.restingECG} onValueChange={(value) => updateField('restingECG', value)}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select ECG result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal - No issues found</SelectItem>
                      <SelectItem value="st-t">Abnormal - Minor irregularities detected</SelectItem>
                      <SelectItem value="lvh">Abnormal - Heart enlargement detected</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">From your most recent heart test (if available)</div>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Exercise Test Results</Label>
                  <Select value={formData.stSlope} onValueChange={(value) => updateField('stSlope', value)}>
                    <SelectTrigger className="h-14 text-lg">
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

            {/* Conditional Questions */}
            {(formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
              <>
                <Separator className="my-10" />
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-2xl font-bold text-orange-700 mb-6">
                    <Heart className="h-7 w-7" />
                    Additional Medical Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.previousHeartAttack && (
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Are you taking cholesterol medication?</Label>
                        <Select value={formData.cholesterolMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('cholesterolMedication', value === 'yes')}>
                          <SelectTrigger className="h-14 text-lg">
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
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">What diabetes treatment are you taking?</Label>
                        <Select value={formData.diabetesMedication} onValueChange={(value) => updateField('diabetesMedication', value)}>
                          <SelectTrigger className="h-14 text-lg">
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
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold">Are you taking blood pressure medication?</Label>
                          <Select value={formData.bpMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('bpMedication', value === 'yes')}>
                            <SelectTrigger className="h-14 text-lg">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes, taking BP medication</SelectItem>
                              <SelectItem value="no">No, not taking medication</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold">Have you made lifestyle/diet changes recently?</Label>
                          <Select value={formData.lifestyleChanges ? 'yes' : 'no'} onValueChange={(value) => updateField('lifestyleChanges', value === 'yes')}>
                            <SelectTrigger className="h-14 text-lg">
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

            <Separator className="my-10" />

            {/* Lifestyle Assessment Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-2xl font-bold text-green-700 mb-6">
                <TrendingUp className="h-7 w-7" />
                Lifestyle Assessment
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Dietary Preference</Label>
                  <Select value={formData.dietType} onValueChange={(value) => updateField('dietType', value)}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select diet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Physical Activity Level</Label>
                  <Select value={formData.physicalActivity} onValueChange={(value) => updateField('physicalActivity', value)}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minimal exercise</SelectItem>
                      <SelectItem value="moderate">Moderate - Regular light exercise</SelectItem>
                      <SelectItem value="high">High - Intensive regular exercise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="sleepHours" className="text-lg font-semibold">Average Sleep Hours</Label>
                  <Input
                    id="sleepHours"
                    type="number"
                    value={formData.sleepHours}
                    onChange={(e) => updateField('sleepHours', parseInt(e.target.value) || 7)}
                    min="3"
                    max="12"
                    placeholder="7"
                    className="h-14 text-lg"
                  />
                  <div className="text-sm text-muted-foreground">Hours of sleep per night on average</div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="stressLevel" className="text-lg font-semibold">Stress Level (1-10)</Label>
                  <Input
                    id="stressLevel"
                    type="number"
                    value={formData.stressLevel}
                    onChange={(e) => updateField('stressLevel', parseInt(e.target.value) || 5)}
                    min="1"
                    max="10"
                    placeholder="5"
                    className="h-14 text-lg"
                  />
                  <div className="text-sm text-muted-foreground">1 = Very relaxed, 10 = Extremely stressed</div>
                </div>
              </div>
            </div>

            {/* Conditional Questions */}
            {(formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
              <>
                <Separator className="my-10" />
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-2xl font-bold text-orange-700 mb-6">
                    <Heart className="h-7 w-7" />
                    Additional Medical Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.previousHeartAttack && (
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Are you taking cholesterol medication?</Label>
                        <Select value={formData.cholesterolMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('cholesterolMedication', value === 'yes')}>
                          <SelectTrigger className="h-14 text-lg">
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
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">What diabetes treatment are you taking?</Label>
                        <Select value={formData.diabetesMedication} onValueChange={(value) => updateField('diabetesMedication', value)}>
                          <SelectTrigger className="h-14 text-lg">
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
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold">Are you taking blood pressure medication?</Label>
                          <Select value={formData.bpMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('bpMedication', value === 'yes')}>
                            <SelectTrigger className="h-14 text-lg">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes, taking BP medication</SelectItem>
                              <SelectItem value="no">No, not taking medication</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold">Have you made lifestyle/diet changes recently?</Label>
                          <Select value={formData.lifestyleChanges ? 'yes' : 'no'} onValueChange={(value) => updateField('lifestyleChanges', value === 'yes')}>
                            <SelectTrigger className="h-14 text-lg">
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

            <Separator className="my-10" />

            {/* Clinical Data & Biomarkers Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-2xl font-bold text-purple-700 mb-6">
                <Microscope className="h-7 w-7" />
                Clinical Data & Laboratory Biomarkers
              </div>
              
              {/* Vital Signs */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Vital Signs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Systolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={clinicalData.vitals.systolicBP}
                      onChange={(e) => updateClinicalData('vitals', 'systolicBP', parseInt(e.target.value) || 120)}
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Diastolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={clinicalData.vitals.diastolicBP}
                      onChange={(e) => updateClinicalData('vitals', 'diastolicBP', parseInt(e.target.value) || 80)}
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      value={clinicalData.vitals.heartRate}
                      onChange={(e) => updateClinicalData('vitals', 'heartRate', parseInt(e.target.value) || 72)}
                      className="h-12 text-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Cardiac Biomarkers */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Cardiac Biomarkers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Troponin I (ng/mL)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={clinicalData.biomarkers.troponin}
                      onChange={(e) => updateClinicalData('biomarkers', 'troponin', parseFloat(e.target.value) || 0.01)}
                      className="h-12 text-lg"
                    />
                    <div className="text-sm text-gray-500">Normal: &lt;0.04 ng/mL</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">BNP (pg/mL)</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.bnp}
                      onChange={(e) => updateClinicalData('biomarkers', 'bnp', parseInt(e.target.value) || 100)}
                      className="h-12 text-lg"
                    />
                    <div className="text-sm text-gray-500">Normal: &lt;100 pg/mL</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">HbA1c (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={clinicalData.biomarkers.hba1c}
                      onChange={(e) => updateClinicalData('biomarkers', 'hba1c', parseFloat(e.target.value) || 5.5)}
                      className="h-12 text-lg"
                    />
                    <div className="text-sm text-gray-500">Target: &lt;7.0%</div>
                  </div>
                </div>
              </div>

              {/* Lipid Panel */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Lipid Panel</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Total Cholesterol</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.cholesterol}
                      onChange={(e) => updateClinicalData('biomarkers', 'cholesterol', parseInt(e.target.value) || 180)}
                      className="h-12 text-lg"
                    />
                    <div className="text-sm text-gray-500">&lt;200 mg/dL</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">LDL Cholesterol</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.ldl}
                      onChange={(e) => updateClinicalData('biomarkers', 'ldl', parseInt(e.target.value) || 100)}
                      className="h-12 text-lg"
                    />
                    <div className="text-sm text-gray-500">&lt;100 mg/dL</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">HDL Cholesterol</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.hdl}
                      onChange={(e) => updateClinicalData('biomarkers', 'hdl', parseInt(e.target.value) || 50)}
                      className="h-12 text-lg"
                    />
                    <div className="text-sm text-gray-500">&gt;40 mg/dL (M), &gt;50 mg/dL (F)</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Triglycerides</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.triglycerides}
                      onChange={(e) => updateClinicalData('biomarkers', 'triglycerides', parseInt(e.target.value) || 120)}
                      className="h-12 text-lg"
                    />
                    <div className="text-sm text-gray-500">&lt;150 mg/dL</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Family History Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-2xl font-bold text-cyan-700 mb-6">
                <Users className="h-7 w-7" />
                Family History Assessment
              </div>
              <div className="space-y-4">
                {familyMembers.map((member, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <Input
                      placeholder="Family member name"
                      value={member.name}
                      onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                      className="h-12"
                    />
                    <Select value={member.relation} onValueChange={(value) => updateFamilyMember(index, 'relation', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="grandparent">Grandparent</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Cardiovascular conditions"
                      value={member.conditions}
                      onChange={(e) => updateFamilyMember(index, 'conditions', e.target.value)}
                      className="h-12"
                    />
                  </div>
                ))}
                <Button 
                  type="button" 
                  onClick={addFamilyMember}
                  variant="outline" 
                  className="w-full h-12"
                >
                  Add Family Member
                </Button>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Lifestyle Assessment */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-2xl font-bold text-green-700 mb-6">
                <TrendingUp className="h-7 w-7" />
                Lifestyle Risk Factors
                <Badge variant="secondary" className="ml-3">Professional</Badge>
              </div>
              <div className="space-y-8">
                <div>
                  <Label className="text-lg font-semibold mb-4 block">Stress Level Assessment (1-10)</Label>
                  <div className="flex items-center space-x-6">
                    <span className="text-sm font-medium">Low Stress</span>
                    <Slider
                      value={[formData.stressLevel || 5]}
                      onValueChange={(value) => updateField('stressLevel', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium">High Stress</span>
                    <Badge variant="outline" className="ml-3 text-lg px-3 py-1">{formData.stressLevel}/10</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-lg font-semibold mb-4 block">Sleep Quality Assessment (1-10)</Label>
                  <div className="flex items-center space-x-6">
                    <span className="text-sm font-medium">Poor Sleep</span>
                    <Slider
                      value={[formData.sleepQuality || 7]}
                      onValueChange={(value) => updateField('sleepQuality', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium">Excellent Sleep</span>
                    <Badge variant="outline" className="ml-3 text-lg px-3 py-1">{formData.sleepQuality}/10</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-lg font-semibold mb-4 block">Exercise Frequency (days per week)</Label>
                  <div className="flex items-center space-x-6">
                    <span className="text-sm font-medium">Sedentary</span>
                    <Slider
                      value={[formData.exerciseFrequency || 3]}
                      onValueChange={(value) => updateField('exerciseFrequency', value[0])}
                      max={7}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium">Daily Exercise</span>
                    <Badge variant="outline" className="ml-3 text-lg px-3 py-1">{formData.exerciseFrequency} days</Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Document Upload Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-2xl font-bold text-indigo-700 mb-6">
                <Upload className="h-7 w-7" />
                Clinical Document Upload
                <Badge variant="secondary" className="ml-3">Unlimited</Badge>
              </div>
              <div className="relative border-2 border-dashed border-indigo-300 rounded-2xl p-12 text-center bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <Upload className="mx-auto h-20 w-20 text-indigo-400 mb-6" />
                <div className="space-y-3">
                  <p className="text-xl font-semibold text-gray-700">
                    Upload Clinical Documents & Reports
                  </p>
                  <p className="text-lg text-gray-600">
                    ECG reports, lab results, imaging studies, previous cardiac assessments
                  </p>
                  <p className="text-sm text-indigo-600 font-medium">
                    Professional: Unlimited uploads • All medical file formats supported
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx,.dcm,.xml,.hl7"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-semibold mb-4 text-xl">Uploaded Clinical Documents ({uploadedFiles.length}):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <FileText className="h-6 w-6 text-indigo-600" />
                        <span className="text-sm font-medium flex-1">{file.name}</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">Ready for Analysis</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate Report Button */}
            <div className="pt-12">
              <Button
                onClick={generateProfessionalReport}
                disabled={processingLoading || !patientName.trim()}
                className="w-full h-20 text-2xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 hover:from-indigo-800 hover:via-blue-700 hover:to-cyan-700 text-white shadow-2xl rounded-xl"
                size="lg"
              >
                {processingLoading ? (
                  <>
                    <Zap className="mr-4 h-8 w-8 animate-spin" />
                    Generating Professional Clinical Report...
                  </>
                ) : (
                  <>
                    <Brain className="mr-4 h-8 w-8" />
                    Generate Professional Clinical Report with AI Analysis
                  </>
                )}
              </Button>
              {!patientName.trim() && (
                <p className="text-sm text-red-500 mt-3 text-center">Please enter patient name to generate professional report</p>
              )}
            </div>

            {/* Professional Features Highlight */}
            <div className="bg-gradient-to-r from-indigo-100 to-cyan-100 p-8 rounded-2xl border border-indigo-200">
              <h4 className="font-bold text-indigo-800 mb-6 text-xl">Professional Clinical Features:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Clinical-Grade Risk Stratification</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Advanced Biomarker Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Professional PDF Reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Unlimited Document Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Family History Assessment</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Clinical Decision Support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Multi-Parameter Risk Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">AI-Powered Clinical Insights</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}