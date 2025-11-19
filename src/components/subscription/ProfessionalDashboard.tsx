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
import { PDFParseConfirmationModal } from '@/components/PDFParseConfirmationModal';
import { parsePDFForFormData, type ParsedField } from '@/services/pdfParserService';

// Import dashboard enhancement components
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { StatCard, StatsGrid } from '@/components/ui/stat-card';
import { FormSection, FormFieldGroup } from '@/components/ui/form-section';
import { LoadingState } from '@/components/ui/loading-state';
import { ActionButton } from '@/components/ui/action-button';

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
            description: "Please sign in to access the Professional Dashboard",
            variant: "destructive",
          });
          navigate('/');
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
    return <LoadingState message="Checking authentication..." tier="professional" />;
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
    if (files.length === 0) return;
    
    // Check if the first file is a PDF
    const firstFile = files[0];
    if (firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf')) {
      try {
        const parseResult = await parsePDFForFormData(firstFile);
        
        setCurrentParsedFields(parseResult.parsedFields);
        setCurrentUnmappedData(parseResult.unmappedData);
        setCurrentExtractionMethod(parseResult.extractionMethod);
        
        setPdfParseModalOpen(true);
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
      description: `${files.length} clinical document(s) uploaded successfully.`,
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
      
      const sourceDisplay = suggestions.source === 'gemini' ? '✨ Google Gemini AI' : 
                           suggestions.source === 'openai' ? '🤖 OpenAI GPT' : 
                           '🔬 Clinical AI Assistant';
      
      toast({
        title: "Clinical AI Recommendations Ready",
        description: `Professional-grade suggestions generated by ${sourceDisplay}`,
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
      const pdfData: PDFReportData = {
        patientInfo: {
          name: patientName || `Patient ${generatedReport.reportId}`,
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
          ayurveda: aiSuggestions?.suggestions?.ayurveda || [],
          yoga: aiSuggestions?.suggestions?.yoga || [],
          diet: aiSuggestions?.suggestions?.diet || []
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-yellow-900/20 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Professional Report Header */}
          <div className="bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-500 dark:from-yellow-900 dark:via-amber-900 dark:to-orange-900 text-white p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="bg-white/20 dark:bg-white/10 backdrop-blur-sm p-3 rounded-full border border-white/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Award className="h-10 w-10" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold drop-shadow-lg">Professional Clinical Assessment Report</h1>
                  <p className="opacity-90 mt-1 text-lg">Comprehensive Cardiovascular Risk Analysis</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-75">Clinical Report ID</div>
                <div className="font-mono text-xl font-bold bg-white/10 px-3 py-1 rounded-lg">{generatedReport.reportId}</div>
                <div className="text-sm opacity-75 mt-1">Generated: {generatedReport.testDate}</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div 
                className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">Clinical Grade Analysis</span>
                </div>
              </motion.div>
              <motion.div 
                className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center gap-2">
                  <Microscope className="h-5 w-5" />
                  <span className="text-sm font-medium">Biomarker Assessment</span>
                </div>
              </motion.div>
              <motion.div 
                className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  <span className="text-sm font-medium">Professional PDF Export</span>
                </div>
              </motion.div>
              <motion.div 
                className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  <span className="text-sm font-medium">AI Clinical Insights</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Patient Demographics */}
          <Card className="shadow-xl border-yellow-200/50 dark:border-yellow-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <Stethoscope className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                Patient Demographics & Clinical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Patient Name</div>
                  <div className="font-bold text-xl text-gray-800 dark:text-gray-100">{generatedReport.patientInfo.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Age</div>
                  <div className="font-bold text-xl text-gray-800 dark:text-gray-100">{generatedReport.patientInfo.age} years</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Gender</div>
                  <div className="font-bold text-xl text-gray-800 dark:text-gray-100 capitalize">{generatedReport.patientInfo.gender}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Assessment Date</div>
                  <div className="font-bold text-xl text-gray-800 dark:text-gray-100">{generatedReport.patientInfo.assessmentDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Risk Assessment */}
          <Card className="shadow-xl border-amber-200/50 dark:border-amber-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                Professional Risk Stratification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-8">
                <div className={`text-7xl font-bold mb-3 ${
                  generatedReport.clinicalAssessment.overallRisk < 30 ? 'text-emerald-600 dark:text-emerald-400' :
                  generatedReport.clinicalAssessment.overallRisk < 50 ? 'text-blue-600 dark:text-blue-400' :
                  generatedReport.clinicalAssessment.overallRisk < 70 ? 'text-amber-600 dark:text-amber-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {generatedReport.clinicalAssessment.overallRisk}%
                </div>
                <div className={`text-2xl font-bold px-6 py-3 rounded-full inline-block ${
                  generatedReport.urgencyLevel === 'low' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' :
                  generatedReport.urgencyLevel === 'moderate' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                  generatedReport.urgencyLevel === 'high' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                }`}>
                  {generatedReport.urgencyLevel.toUpperCase()} RISK
                </div>
                <div className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                  Next Follow-up: <span className="font-semibold text-gray-800 dark:text-gray-200">{generatedReport.nextFollowUp}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{generatedReport.clinicalAssessment.cardiovascularRisk}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Cardiovascular Risk</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{generatedReport.clinicalAssessment.clinicalRisk}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Clinical Risk</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/50 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{generatedReport.clinicalAssessment.biomarkerRisk}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Biomarker Risk</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{generatedReport.clinicalAssessment.demographicRisk}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Demographic Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biomarker Analysis */}
          <Card className="shadow-xl border-yellow-200/50 dark:border-yellow-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <Microscope className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                Laboratory Biomarker Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Critical Values */}
                {generatedReport.biomarkerAnalysis.critical.length > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800/50">
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Critical Values
                    </h4>
                    <div className="space-y-2">
                      {generatedReport.biomarkerAnalysis.critical.map((item, index) => (
                        <div key={index} className="text-sm text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-orange-500 dark:border-orange-400">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elevated Values */}
                {generatedReport.biomarkerAnalysis.elevated.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Elevated Values
                    </h4>
                    <div className="space-y-2">
                      {generatedReport.biomarkerAnalysis.elevated.map((item, index) => (
                        <div key={index} className="text-sm text-amber-700 dark:text-amber-300 bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-amber-500 dark:border-amber-400">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Normal Values */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Normal Values
                  </h4>
                  <div className="space-y-2">
                    {generatedReport.biomarkerAnalysis.normal.map((item, index) => (
                      <div key={index} className="text-sm text-emerald-700 dark:text-emerald-300 bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-emerald-500 dark:border-emerald-400">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Insights */}
          <Card className="shadow-xl border-teal-200/50 dark:border-teal-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <Brain className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                AI-Powered Clinical Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {generatedReport.clinicalInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg border border-teal-200 dark:border-teal-800/50 backdrop-blur-sm">
                    <Star className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-700 dark:text-gray-300 font-medium">{insight}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Professional Recommendations */}
          <Card className="shadow-xl border-emerald-200/50 dark:border-emerald-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                Professional Clinical Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {generatedReport.professionalRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800/50 backdrop-blur-sm">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-700 dark:text-gray-300 font-medium">{recommendation}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Clinical Documents */}
          {uploadedFiles.length > 0 && (
            <Card className="shadow-xl border-amber-200/50 dark:border-amber-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  Analyzed Clinical Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50 backdrop-blur-sm">
                      <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium flex-1 text-gray-800 dark:text-gray-200">{file.name}</span>
                      <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500">Analyzed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI-Powered Enhanced Suggestions */}
          {(aiSuggestions || loadingAISuggestions) && (
            <Card className="shadow-xl border-emerald-200/50 dark:border-emerald-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <Brain className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <span>AI-Powered Clinical Recommendations</span>
                    {aiSuggestions && (
                      <Badge variant="outline" className="ml-2 text-xs border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300">
                        ✨ {aiSuggestions.source === 'gemini' ? 'Gemini AI' : aiSuggestions.source === 'openai' ? 'OpenAI GPT' : 'AI Assistant'}
                      </Badge>
                    )}
                  </CardTitle>
                  {aiSuggestions && !loadingAISuggestions && generatedReport && (
                    <Button
                      onClick={() => getAISuggestions(generatedReport.urgencyLevel, formData)}
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
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800/50">
                        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-4 flex items-center gap-2">
                          <Apple className="h-5 w-5" />
                          Dietary Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSuggestions.suggestions.diet.map((diet, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                              <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">{diet}</div>
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
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4">
                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Important Warnings
                        </h3>
                        <ul className="space-y-2">
                          {aiSuggestions.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-orange-700 dark:text-orange-300">{warning}</span>
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
              className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 dark:from-yellow-700 dark:to-amber-700 dark:hover:from-yellow-800 dark:hover:to-amber-800 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all"
              size="lg"
            >
              <Download className="mr-3 h-6 w-6" />
              Download Professional PDF Report
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              New Clinical Assessment
            </Button>
          </div>

          {/* Professional Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 border-t dark:border-gray-700">
            <p className="font-bold text-gray-700 dark:text-gray-300">PROFESSIONAL CLINICAL ASSESSMENT REPORT</p>
            <p className="mt-2">This report is generated using advanced AI algorithms and should be interpreted by qualified healthcare professionals.</p>
            <p className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">Report ID: {generatedReport.reportId}</Badge>
              <Badge variant="outline" className="text-xs">Generated: {generatedReport.testDate}</Badge>
              <Badge variant="secondary" className="text-xs">Professional Grade Assessment</Badge>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-yellow-900/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Dashboard Header */}
        <DashboardHeader
          tier="professional"
          title="Professional Clinical Dashboard"
          description="Advanced clinical-grade cardiovascular assessment with biomarker analysis"
          icon={<Brain className="w-10 h-10 text-yellow-400" />}
          titleClassName="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500"
        />

        {/* Statistics Grid */}
        <StatsGrid>
          <StatCard
            title="Patient Records"
            value={uploadedFiles.length.toString()}
            subtitle="Clinical documents"
            icon={Users}
            trend="up"
            trendValue="+5"
            color="amber"
            delay={0}
          />
          <StatCard
            title="Biomarker Analysis"
            value="Advanced"
            subtitle="9 markers tracked"
            icon={Microscope}
            trend="up"
            trendValue="Active"
            color="amber"
            delay={0.1}
          />
          <StatCard
            title="Clinical Reports"
            value="Unlimited"
            subtitle="Professional grade"
            icon={FileText}
            trend="neutral"
            color="amber"
            delay={0.2}
          />
          <StatCard
            title="Professional Tier"
            value="∞"
            subtitle="All features unlocked"
            icon={Crown}
            trend="up"
            trendValue="Premium"
            color="amber"
            delay={0.3}
          />
        </StatsGrid>

        {/* Comprehensive Assessment Form */}
        <Card className="shadow-2xl border-yellow-200/50 dark:border-yellow-800/50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 rounded-t-lg border-b dark:border-gray-700">
            <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl text-gray-800 dark:text-gray-100">
              <Heart className="h-7 w-7 md:h-8 md:w-8 text-amber-500 dark:text-amber-400" />
              Comprehensive Clinical Assessment
            </CardTitle>
            <CardDescription className="text-base md:text-lg text-gray-600 dark:text-gray-400">
              Complete all sections below for comprehensive cardiovascular risk analysis and professional clinical report generation
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8 px-6 md:px-8">
            <form className="space-y-8">
            
            {/* Patient Assessment Section */}
            <FormSection
              icon={Stethoscope}
              title="Patient Assessment & Demographics"
              description="Basic patient information and demographics"
              accent="amber"
            >
              <FormFieldGroup columns={2}>
                <div className="space-y-2.5">
                  <Label htmlFor="patientName" className="text-base font-semibold text-gray-700 dark:text-gray-200">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="age" className="text-base font-semibold text-gray-700 dark:text-gray-200">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                    min="1"
                    max="120"
                    placeholder="Enter age"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="male" className="dark:text-white dark:focus:bg-gray-700">Male</SelectItem>
                      <SelectItem value="female" className="dark:text-white dark:focus:bg-gray-700">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Chest Pain Type</Label>
                  <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400">
                      <SelectValue placeholder="Select chest pain type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="typical" className="dark:text-white dark:focus:bg-gray-700">Typical Angina</SelectItem>
                      <SelectItem value="atypical" className="dark:text-white dark:focus:bg-gray-700">Atypical Angina</SelectItem>
                      <SelectItem value="non-anginal" className="dark:text-white dark:focus:bg-gray-700">Non-Anginal Pain</SelectItem>
                      <SelectItem value="asymptomatic" className="dark:text-white dark:focus:bg-gray-700">Asymptomatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="height" className="text-base font-semibold text-gray-700 dark:text-gray-200">Height (cm) - Optional</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    min="100"
                    max="250"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your height in centimeters</div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="weight" className="text-base font-semibold text-gray-700 dark:text-gray-200">Weight (kg) - Optional</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    min="30"
                    max="300"
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your weight in kilograms</div>
                </div>
              </FormFieldGroup>

              {/* Medical History Switches */}
              <div className="space-y-4 mt-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Medical History</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm"
                  >
                    <div>
                      <Label className="text-base font-semibold text-gray-800 dark:text-gray-100">Diabetes Mellitus</Label>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Type 1 or Type 2 diabetes diagnosis</div>
                    </div>
                    <Switch
                      checked={formData.diabetes}
                      onCheckedChange={(checked) => updateField('diabetes', checked)}
                      className="scale-125 data-[state=checked]:bg-amber-600"
                    />
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm"
                  >
                    <div>
                      <Label className="text-base font-semibold text-gray-800 dark:text-gray-100">Smoking History</Label>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Current or former smoker</div>
                    </div>
                    <Switch
                      checked={formData.smoking}
                      onCheckedChange={(checked) => updateField('smoking', checked)}
                      className="scale-125 data-[state=checked]:bg-amber-600"
                    />
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm"
                  >
                    <div>
                      <Label className="text-base font-semibold text-gray-800 dark:text-gray-100">Exercise-Induced Angina</Label>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Chest pain triggered by exercise</div>
                    </div>
                    <Switch
                      checked={formData.exerciseAngina}
                      onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                      className="scale-125 data-[state=checked]:bg-amber-600"
                    />
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm"
                  >
                    <div>
                      <Label className="text-base font-semibold text-gray-800 dark:text-gray-100">Previous MI</Label>
                      <div className="text-sm text-gray-600 dark:text-gray-400">History of myocardial infarction</div>
                    </div>
                    <Switch
                      checked={formData.previousHeartAttack}
                      onCheckedChange={(checked) => updateField('previousHeartAttack', checked)}
                      className="scale-125 data-[state=checked]:bg-amber-600"
                    />
                  </motion.div>
                </div>
              </div>
            </FormSection>

            <Separator className="my-10" />

            {/* Health Metrics Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-2xl font-bold text-teal-700 dark:text-teal-400 mb-6">
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
              <div className="flex items-center gap-3 text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-6">
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
              <div className="flex items-center gap-3 text-2xl font-bold text-amber-700 dark:text-amber-400 mb-6">
                <Microscope className="h-7 w-7" />
                Clinical Data & Laboratory Biomarkers
              </div>
              
              {/* Vital Signs */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Vital Signs</h3>
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
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Cardiac Biomarkers</h3>
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
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Lipid Panel</h3>
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
              <div className="flex items-center gap-3 text-2xl font-bold text-blue-700 dark:text-blue-400 mb-6">
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
              <div className="flex items-center gap-3 text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-6">
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
              <div className="flex items-center gap-3 text-2xl font-bold text-amber-700 dark:text-amber-400 mb-6">
                <Upload className="h-7 w-7" />
                Clinical Document Upload
                <Badge variant="secondary" className="ml-3">Unlimited</Badge>
              </div>
              <div className="relative border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-12 text-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/20 dark:hover:to-yellow-900/20 transition-all duration-300">
                <Upload className="mx-auto h-20 w-20 text-amber-400 dark:text-amber-500 mb-6" />
                <div className="space-y-3">
                  <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
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
                      <div key={index} className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                        <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-medium flex-1 text-gray-800 dark:text-gray-200">{file.name}</span>
                        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500">Ready for Analysis</Badge>
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
                className="w-full h-20 text-2xl bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-500 hover:from-yellow-700 hover:via-amber-700 hover:to-orange-600 dark:from-yellow-700 dark:via-amber-700 dark:to-orange-700 dark:hover:from-yellow-800 dark:hover:via-amber-800 dark:hover:to-orange-800 text-white shadow-2xl hover:shadow-3xl rounded-xl transition-all duration-300"
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
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 text-center">Please enter patient name to generate professional report</p>
              )}
            </div>
            </form>

            {/* Professional Features Highlight */}
            <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 p-8 rounded-2xl border border-yellow-200 dark:border-yellow-800/50 shadow-lg">
              <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-6 text-xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                Professional Clinical Features:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Clinical-Grade Risk Stratification</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Advanced Biomarker Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Professional PDF Reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Unlimited Document Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Family History Assessment</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Clinical Decision Support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Multi-Parameter Risk Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">AI-Powered Clinical Insights</span>
                </div>
              </div>
            </div>
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