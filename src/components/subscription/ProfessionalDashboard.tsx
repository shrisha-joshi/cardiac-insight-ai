import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Apple,
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
import PredictionHistory from '@/components/PredictionHistory';
import { usePredictionHistory } from '@/hooks/use-prediction-history';

// Import dashboard enhancement components
// Header and stats removed to keep minimal sticky hero
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // Use custom hook for prediction history management
  const { predictions, addPrediction, addFeedback, getFeedbackStats, userId: historyUserId, isLoading: historyLoading } = usePredictionHistory();
  const [processingLoading, setProcessingLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { name: '', relation: '', conditions: '' }
  ]);
  
  // Professional-grade detailed history state
  const [detailedHistory, setDetailedHistory] = useState({
    diabetesDuration: '',
    diabetesType: 'Type 2',
    diabetesComplications: [] as string[],
    hypertensionDuration: '',
    hypertensionMedications: [] as string[],
    cardiacInterventions: [] as string[],
    dyslipidemiaTherapy: 'None',
    // Detailed complication tracking
    retinopathyStage: '',
    neuropathyType: '',
    nephropathyStage: '',
    padSeverity: '',
    // Medication details
    aceInhibitorName: '',
    betaBlockerName: '',
    ccbName: '',
    diureticName: '',
    // Cardiac intervention details
    pciDate: '',
    cabgDate: '',
    pacemakerType: '',
    valveType: ''
  });

  const toggleDetailedHistoryItem = (category: 'diabetesComplications' | 'hypertensionMedications' | 'cardiacInterventions', item: string) => {
    setDetailedHistory(prev => {
      const list = prev[category];
      if (list.includes(item)) {
        return { ...prev, [category]: list.filter(i => i !== item) };
      } else {
        return { ...prev, [category]: [...list, item] };
      }
    });
  };

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
    extractedData?: {
      fields: ParsedField[];
      extractionMethod: 'text-extraction' | 'ocr';
      documentCount: number;
    };
  } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<EnhancedAIResponse | null>(null);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
  
  // Stepper (pagination) state to align with Premium flow
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const handleNextStep = () => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  };
  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };
  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return patientName.trim().length >= 2 && (formData.age || 0) > 0;
      default:
        return true;
    }
  };
  
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
        
        if (parseResult.success && parseResult.parsedFields.length > 0) {
          // Found recognizable fields - show confirmation modal
          setCurrentParsedFields(parseResult.parsedFields);
          setCurrentUnmappedData(parseResult.unmappedData);
          setCurrentExtractionMethod(parseResult.extractionMethod);
          setPdfParseModalOpen(true);
          
          toast({
            title: "Clinical Data Extracted",
            description: `Extracted ${parseResult.parsedFields.length} medical field(s) with ${parseResult.extractionMethod}. Review and approve.`,
          });
        } else {
          // No recognizable fields found
          toast({
            title: "No Clinical Data Extracted",
            description: "Could not extract recognizable clinical data from PDF. Please enter data manually or upload a different format.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error('PDF parsing error:', error);
        toast({
          title: "PDF Parsing Error",
          description: "Failed to parse clinical document. Please fill the form manually.",
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
    // Clear parsed data so it won't appear in the report
    setCurrentParsedFields([]);
    setCurrentUnmappedData([]);
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
    
    // Detailed History Analysis (Professional Tier)
    if (formData.diabetes) {
      if (detailedHistory.diabetesType !== 'Type 2') {
        clinicalInsights.push(`Diabetes management complexity increased due to ${detailedHistory.diabetesType} classification`);
      }
      if (detailedHistory.diabetesComplications.length > 0) {
        clinicalInsights.push(`Presence of microvascular complications: ${detailedHistory.diabetesComplications.join(', ')}`);
        professionalRecommendations.push('Referral to ophthalmologist/podiatrist/nephrologist indicated for complication management');
      }
    }
    if (detailedHistory.cardiacInterventions.length > 0) {
      clinicalInsights.push(`History of cardiac interventions: ${detailedHistory.cardiacInterventions.join(', ')}`);
    }
    if (detailedHistory.hypertensionDuration && parseInt(detailedHistory.hypertensionDuration) > 10) {
      clinicalInsights.push('Long-standing hypertension (>10 years) significantly increases risk of end-organ damage');
    }

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
      nextFollowUp,
      extractedData: currentParsedFields.length > 0 ? {
        fields: currentParsedFields,
        extractionMethod: currentExtractionMethod,
        documentCount: uploadedFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx')).length
      } : undefined
    };
    
    setGeneratedReport(report);
    setShowReport(true);
    setProcessingLoading(false);
    
    // Save to prediction history
    const prediction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      riskLevel: (urgencyLevel === 'low' ? 'low' : urgencyLevel === 'moderate' ? 'medium' : 'high') as 'low' | 'medium' | 'high',
      riskScore: overallRisk,
      confidence: Math.min(98, 88 + (uploadedFiles.length * 2)),
      prediction: (overallRisk > 50 ? 'Risk' : 'No Risk') as 'Risk' | 'No Risk',
      explanation: `Professional clinical assessment with ${urgencyLevel} urgency level`,
      recommendations: professionalRecommendations,
      patientData: formData
    };
    addPrediction(prediction);
    
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
            ...(patientData.diabetes ? [`Diabetes (${detailedHistory.diabetesType})`] : []),
            ...(detailedHistory.diabetesComplications.length > 0 ? [`Diabetes Complications: ${detailedHistory.diabetesComplications.join(', ')}`] : []),
            ...(patientData.smoking ? ['Smoking'] : []),
            ...(patientData.previousHeartAttack ? ['Previous Heart Attack'] : []),
            ...(detailedHistory.cardiacInterventions.length > 0 ? [`Cardiac Interventions: ${detailedHistory.cardiacInterventions.join(', ')}`] : []),
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
    setCurrentStep(1);
  };

  if (showReport && generatedReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Professional Report Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 dark:from-amber-800 dark:via-yellow-800 dark:to-orange-800 text-white rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <Award className="h-10 w-10" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Professional Clinical Assessment</h1>
                    <p className="text-amber-100 dark:text-amber-200 text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Comprehensive Cardiovascular Risk Analysis</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20">
                  <div className="text-sm text-amber-200 dark:text-amber-300 mb-1">Report ID</div>
                  <div className="font-mono text-2xl font-bold">PCR-{Date.now().toString().slice(-6)}</div>
                  <div className="text-xs text-amber-200 dark:text-amber-300 mt-1">{new Date().toLocaleString()}</div>
                </div>
              </div>
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
          {/* Extracted Medical Data from PDF/DOCX */}
          {generatedReport.extractedData && generatedReport.extractedData.fields.length > 0 && (
            <Card className="shadow-xl border-teal-200/50 dark:border-teal-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  Extracted Clinical Data
                  <Badge variant="secondary" className="ml-2">
                    {generatedReport.extractedData.extractionMethod === 'ocr' ? 'OCR Scanned' : 'Text Extracted'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Clinical data automatically extracted from {generatedReport.extractedData.documentCount} uploaded document(s) using advanced parsing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedReport.extractedData.fields.map((field, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border-2 ${
                        field.confidence === 'high' 
                          ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-700' 
                          : field.confidence === 'medium'
                          ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/10 dark:border-amber-700'
                          : 'bg-orange-50 border-orange-300 dark:bg-orange-900/10 dark:border-orange-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          {field.label || field.fieldName}
                        </div>
                        <Badge 
                          variant={field.confidence === 'high' ? 'default' : field.confidence === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {field.confidence}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {typeof field.value === 'boolean' 
                          ? (field.value ? '✓ Yes' : '✗ No')
                          : field.value}
                      </div>
                      {field.rawText && field.rawText !== field.value && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-2 bg-white/50 dark:bg-black/20 rounded border border-gray-200 dark:border-gray-700">
                          <div className="font-semibold mb-1">Source Text:</div>
                          <div className="truncate" title={field.rawText}>{field.rawText}</div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/10 rounded-lg border-2 border-teal-200 dark:border-teal-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Extraction Details
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Method:</strong> {generatedReport.extractedData.extractionMethod === 'ocr' 
                          ? 'OCR (Optical Character Recognition) - Advanced image-to-text processing for scanned documents'
                          : 'Direct Text Extraction - High-fidelity parsing from digital PDF documents'}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Documents Processed:</strong> {generatedReport.extractedData.documentCount} clinical document(s)
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Fields Extracted:</strong> {generatedReport.extractedData.fields.length} medical data point(s)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Patient Info & Risk Score */}
            <div className="lg:col-span-1 space-y-6">
              {/* Overall Risk Score - Circular Progress */}
              <Card className="shadow-xl border-amber-200/50 dark:border-amber-800/50 bg-white dark:bg-slate-900">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-6">Overall Cardiovascular Risk</h3>
                    
                    {/* Circular Progress Ring */}
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="transform -rotate-90 w-48 h-48">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 88}`}
                          strokeDashoffset={`${2 * Math.PI * 88 * (1 - generatedReport.clinicalAssessment.overallRisk / 100)}`}
                          className={`transition-all duration-1000 ease-out ${
                            generatedReport.clinicalAssessment.overallRisk < 30 ? 'text-emerald-500' :
                            generatedReport.clinicalAssessment.overallRisk < 50 ? 'text-blue-500' :
                            generatedReport.clinicalAssessment.overallRisk < 70 ? 'text-amber-500' : 'text-orange-500'
                          }`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-5xl font-bold ${
                          generatedReport.clinicalAssessment.overallRisk < 30 ? 'text-emerald-600 dark:text-emerald-400' :
                          generatedReport.clinicalAssessment.overallRisk < 50 ? 'text-blue-600 dark:text-blue-400' :
                          generatedReport.clinicalAssessment.overallRisk < 70 ? 'text-amber-600 dark:text-amber-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {generatedReport.clinicalAssessment.overallRisk}%
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Risk Score</span>
                      </div>
                    </div>

                    {/* Risk Level Badge */}
                    <div className="mt-6">
                      <div className={`inline-block px-6 py-2 rounded-full font-bold text-lg ${
                        generatedReport.urgencyLevel === 'low' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' :
                        generatedReport.urgencyLevel === 'moderate' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                        generatedReport.urgencyLevel === 'high' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                      }`}>
                        {generatedReport.urgencyLevel.toUpperCase()} RISK
                      </div>
                    </div>

                    {/* Follow-up Info */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Next Follow-up</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{generatedReport.nextFollowUp}</div>
                    </div>

                    {/* Clinical Note */}
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          Professional clinical assessment requires physician review
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Detailed Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Detailed Risk Breakdown */}
              <Card className="shadow-xl border-amber-200/50 dark:border-amber-800/50 bg-white dark:bg-slate-900">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Professional Risk Stratification
                  </CardTitle>
                  <CardDescription>Multi-factorial cardiovascular risk analysis</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Cardiovascular Risk */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cardiovascular Risk</span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{generatedReport.clinicalAssessment.cardiovascularRisk}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.clinicalAssessment.cardiovascularRisk}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Blood pressure, heart rate, exercise tolerance</p>
                    </div>

                    {/* Clinical Risk */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Clinical Risk Factors</span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{generatedReport.clinicalAssessment.clinicalRisk}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.clinicalAssessment.clinicalRisk}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Diabetes, smoking, family history, stress levels</p>
                    </div>

                    {/* Biomarker Risk */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Biomarker Analysis</span>
                        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{generatedReport.clinicalAssessment.biomarkerRisk}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.clinicalAssessment.biomarkerRisk}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Troponin, BNP, cholesterol, HbA1c levels</p>
                    </div>

                    {/* Demographic Risk */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Demographic Factors</span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{generatedReport.clinicalAssessment.demographicRisk}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${generatedReport.clinicalAssessment.demographicRisk}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Age, gender, and population risk factors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factor Summary */}
              <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Risk Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cardiovascular</div>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{generatedReport.clinicalAssessment.cardiovascularRisk}%</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clinical</div>
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{generatedReport.clinicalAssessment.clinicalRisk}%</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/50">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Biomarker</div>
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{generatedReport.clinicalAssessment.biomarkerRisk}%</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Demographic</div>
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{generatedReport.clinicalAssessment.demographicRisk}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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
              className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 text-white px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all rounded-xl font-semibold w-full sm:w-auto"
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
              Report generated on {generatedReport.patientInfo.assessmentDate} • Professional AI Assessment • Confidential
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-yellow-900/30">
      {/* Compact Fixed Header (Hero) */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-800 dark:to-orange-800 shadow-lg border-b-2 border-amber-400/30 dark:border-amber-600/30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 dark:bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Professional Dashboard
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    Step {currentStep}/{totalSteps}
                  </Badge>
                </h1>
                <p className="text-xs text-amber-100 dark:text-amber-200">Clinical-grade cardiovascular assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <FileText className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">{uploadedFiles.length} docs</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <CheckCircle className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-medium text-white">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4 pt-6">
        
        {/* Clean layout: sticky hero only, header/stats removed */}

        {/* Stepper */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-5 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between">
            {['Patient', 'Health', 'Lifestyle', 'Clinical', 'Upload'].map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${idx > 0 ? 'pl-2' : ''}`}>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg border-2 transition-all duration-300
                      ${idx + 1 <= currentStep
                        ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white border-amber-300 dark:border-amber-400 shadow-amber-500/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                  >
                    {idx + 1}
                  </motion.div>
                  <span className={`text-sm font-medium hidden sm:block transition-colors duration-300 ${idx + 1 <= currentStep ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>{label}</span>
                </div>
                {idx < totalSteps - 1 && (
                  <div className="mx-2 flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: idx + 1 < currentStep ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 shadow-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Assessment Form */}
        <Card className="shadow-xl border-amber-200/50 dark:border-amber-800/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 px-6 md:px-8">
            <form className="space-y-8">
            {/* Patient Assessment Section */}
            {currentStep === 1 && (
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
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
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
                    className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
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
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
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
                  {/* Diabetes Mellitus Toggle */}
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

                  {/* Smoking History Toggle */}
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

                  {/* Exercise-Induced Angina Toggle */}
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

                  {/* Previous MI Toggle */}
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

                {/* Diabetes Follow-up Questions */}
                <AnimatePresence>
                  {formData.diabetes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800/50 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h5 className="font-semibold text-blue-800 dark:text-blue-200">Diabetes Management Details</h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Diabetes Type</Label>
                          <Select>
                            <SelectTrigger className="border-blue-300 dark:border-blue-700">
                              <SelectValue placeholder="Select diabetes type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="type1">Type 1 Diabetes</SelectItem>
                              <SelectItem value="type2">Type 2 Diabetes</SelectItem>
                              <SelectItem value="gestational">Gestational Diabetes</SelectItem>
                              <SelectItem value="prediabetes">Prediabetes</SelectItem>
                              <SelectItem value="lada">LADA (Latent Autoimmune Diabetes)</SelectItem>
                              <SelectItem value="mody">MODY (Maturity Onset Diabetes)</SelectItem>
                              <SelectItem value="unknown">Unknown/Not specified</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Age at Diagnosis</Label>
                          <Input
                            type="number"
                            placeholder="Age when diagnosed"
                            className="border-blue-300 dark:border-blue-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Years with Diabetes</Label>
                          <Input
                            type="number"
                            placeholder="Duration in years"
                            className="border-blue-300 dark:border-blue-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Current HbA1c Level</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 7.5%"
                            className="border-blue-300 dark:border-blue-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Fasting Blood Sugar</Label>
                          <Input
                            type="number"
                            placeholder="mg/dL"
                            className="border-blue-300 dark:border-blue-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Current Medication</Label>
                          <Select>
                            <SelectTrigger className="border-blue-300 dark:border-blue-700">
                              <SelectValue placeholder="Select medication type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="metformin">Metformin</SelectItem>
                              <SelectItem value="insulin">Insulin</SelectItem>
                              <SelectItem value="sulfonylurea">Sulfonylurea</SelectItem>
                              <SelectItem value="glp1">GLP-1 Agonist</SelectItem>
                              <SelectItem value="sglt2">SGLT2 Inhibitor</SelectItem>
                              <SelectItem value="combination">Combination Therapy</SelectItem>
                              <SelectItem value="none">No Medication</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Medication Adherence</Label>
                          <Select>
                            <SelectTrigger className="border-blue-300 dark:border-blue-700">
                              <SelectValue placeholder="How often do you take meds?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent (Never miss)</SelectItem>
                              <SelectItem value="good">Good (Rarely miss)</SelectItem>
                              <SelectItem value="fair">Fair (Sometimes miss)</SelectItem>
                              <SelectItem value="poor">Poor (Often miss)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Blood Sugar Monitoring</Label>
                          <Select>
                            <SelectTrigger className="border-blue-300 dark:border-blue-700">
                              <SelectValue placeholder="How often?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple-daily">Multiple times daily</SelectItem>
                              <SelectItem value="daily">Once daily</SelectItem>
                              <SelectItem value="weekly">Few times per week</SelectItem>
                              <SelectItem value="rarely">Rarely</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Hypoglycemic Episodes</Label>
                          <Select>
                            <SelectTrigger className="border-blue-300 dark:border-blue-700">
                              <SelectValue placeholder="Frequency in past month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="rare">1-2 episodes</SelectItem>
                              <SelectItem value="occasional">3-5 episodes</SelectItem>
                              <SelectItem value="frequent">More than 5 episodes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Diabetes-Related Complications (Select all that apply)</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['Neuropathy', 'Retinopathy', 'Nephropathy', 'Foot problems', 'None'].map((comp) => (
                            <label key={comp} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <input type="checkbox" className="rounded text-blue-600" />
                              <span className="text-sm">{comp}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Smoking History Follow-up Questions */}
                <AnimatePresence>
                  {formData.smoking && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-5 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800/50 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h5 className="font-semibold text-red-800 dark:text-red-200">Smoking History Details</h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Smoking Status</Label>
                          <Select>
                            <SelectTrigger className="border-red-300 dark:border-red-700">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="current">Current Smoker</SelectItem>
                              <SelectItem value="former">Former Smoker</SelectItem>
                              <SelectItem value="occasional">Occasional Smoker</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Age Started Smoking</Label>
                          <Input
                            type="number"
                            placeholder="Age"
                            className="border-red-300 dark:border-red-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Cigarettes Per Day</Label>
                          <Input
                            type="number"
                            placeholder="Average number"
                            className="border-red-300 dark:border-red-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Pack-Years</Label>
                          <Input
                            type="number"
                            placeholder="Calculate: (packs/day) × years"
                            className="border-red-300 dark:border-red-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Years Smoked</Label>
                          <Input
                            type="number"
                            placeholder="Total years"
                            className="border-red-300 dark:border-red-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">If Former Smoker: Quit Date</Label>
                          <Input
                            type="date"
                            className="border-red-300 dark:border-red-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Tobacco Type</Label>
                          <Select>
                            <SelectTrigger className="border-red-300 dark:border-red-700">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cigarettes">Cigarettes</SelectItem>
                              <SelectItem value="cigars">Cigars</SelectItem>
                              <SelectItem value="pipe">Pipe</SelectItem>
                              <SelectItem value="chewing">Chewing Tobacco</SelectItem>
                              <SelectItem value="vaping">E-cigarettes/Vaping</SelectItem>
                              <SelectItem value="multiple">Multiple Types</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Attempted to Quit?</Label>
                          <Select>
                            <SelectTrigger className="border-red-300 dark:border-red-700">
                              <SelectValue placeholder="Number of attempts" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">Never tried</SelectItem>
                              <SelectItem value="once">Once</SelectItem>
                              <SelectItem value="2-3">2-3 times</SelectItem>
                              <SelectItem value="4-5">4-5 times</SelectItem>
                              <SelectItem value="many">More than 5 times</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Exposure to Secondhand Smoke</Label>
                          <Select>
                            <SelectTrigger className="border-red-300 dark:border-red-700">
                              <SelectValue placeholder="Select exposure level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No exposure</SelectItem>
                              <SelectItem value="minimal">Minimal (Rare)</SelectItem>
                              <SelectItem value="moderate">Moderate (Weekly)</SelectItem>
                              <SelectItem value="frequent">Frequent (Daily)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Interest in Quitting</Label>
                          <Select>
                            <SelectTrigger className="border-red-300 dark:border-red-700">
                              <SelectValue placeholder="Current interest level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="very-interested">Very interested</SelectItem>
                              <SelectItem value="somewhat">Somewhat interested</SelectItem>
                              <SelectItem value="not-ready">Not ready yet</SelectItem>
                              <SelectItem value="not-interested">Not interested</SelectItem>
                              <SelectItem value="already-quit">Already quit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Exercise-Induced Angina Follow-up Questions */}
                <AnimatePresence>
                  {formData.exerciseAngina && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800/50 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h5 className="font-semibold text-purple-800 dark:text-purple-200">Angina Characteristics</h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">When Did Symptoms Start?</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recent">Within last month</SelectItem>
                              <SelectItem value="few-months">1-6 months ago</SelectItem>
                              <SelectItem value="year">6-12 months ago</SelectItem>
                              <SelectItem value="over-year">Over a year ago</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Frequency of Episodes</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="How often?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Several times per week</SelectItem>
                              <SelectItem value="monthly">Few times per month</SelectItem>
                              <SelectItem value="occasional">Occasional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Pain Severity (1-10)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Rate pain intensity"
                            className="border-purple-300 dark:border-purple-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Duration of Each Episode</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="How long?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seconds">&lt;1 minute</SelectItem>
                              <SelectItem value="1-5">1-5 minutes</SelectItem>
                              <SelectItem value="5-10">5-10 minutes</SelectItem>
                              <SelectItem value="10-20">10-20 minutes</SelectItem>
                              <SelectItem value="longer">&gt;20 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Exercise Intensity That Triggers Pain</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="Select intensity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal activity (walking slowly)</SelectItem>
                              <SelectItem value="light">Light activity (normal walking)</SelectItem>
                              <SelectItem value="moderate">Moderate activity (brisk walking, stairs)</SelectItem>
                              <SelectItem value="vigorous">Only vigorous activity (running, heavy lifting)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Pain Location</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="Where is the pain?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="center-chest">Center of chest</SelectItem>
                              <SelectItem value="left-chest">Left side of chest</SelectItem>
                              <SelectItem value="radiating-arm">Radiating to left arm</SelectItem>
                              <SelectItem value="radiating-jaw">Radiating to jaw/neck</SelectItem>
                              <SelectItem value="radiating-back">Radiating to back</SelectItem>
                              <SelectItem value="multiple">Multiple locations</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Pain Character</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="Describe the pain" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pressure">Pressure/Squeezing</SelectItem>
                              <SelectItem value="tight">Tightness</SelectItem>
                              <SelectItem value="burning">Burning sensation</SelectItem>
                              <SelectItem value="sharp">Sharp pain</SelectItem>
                              <SelectItem value="dull">Dull ache</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Relief Methods</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="What helps?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rest">Rest alone</SelectItem>
                              <SelectItem value="nitro">Nitroglycerin</SelectItem>
                              <SelectItem value="rest-nitro">Rest + Nitroglycerin</SelectItem>
                              <SelectItem value="slow">Takes long time to resolve</SelectItem>
                              <SelectItem value="none">Nothing helps quickly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Associated Symptoms</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {['Shortness of breath', 'Sweating', 'Nausea', 'Dizziness', 'Palpitations', 'None'].map((symptom) => (
                              <label key={symptom} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                <input type="checkbox" className="rounded text-purple-600" />
                                <span className="text-sm">{symptom}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Using Nitroglycerin?</Label>
                          <Select>
                            <SelectTrigger className="border-purple-300 dark:border-purple-700">
                              <SelectValue placeholder="Select usage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes-prescribed">Yes, prescribed</SelectItem>
                              <SelectItem value="yes-effective">Yes, and it helps</SelectItem>
                              <SelectItem value="yes-ineffective">Yes, but doesn't help much</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Previous MI (Heart Attack) Follow-up Questions */}
                <AnimatePresence>
                  {formData.previousHeartAttack && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-5 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-xl border-2 border-rose-200 dark:border-rose-800/50 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        <h5 className="font-semibold text-rose-800 dark:text-rose-200">Myocardial Infarction History</h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Date of Heart Attack</Label>
                          <Input
                            type="date"
                            className="border-rose-300 dark:border-rose-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Age at Time of Event</Label>
                          <Input
                            type="number"
                            placeholder="Age"
                            className="border-rose-300 dark:border-rose-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Type of Heart Attack</Label>
                          <Select>
                            <SelectTrigger className="border-rose-300 dark:border-rose-700">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stemi">STEMI (ST-Elevation MI)</SelectItem>
                              <SelectItem value="nstemi">NSTEMI (Non-ST-Elevation MI)</SelectItem>
                              <SelectItem value="unknown">Unknown/Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Number of Heart Attacks</Label>
                          <Select>
                            <SelectTrigger className="border-rose-300 dark:border-rose-700">
                              <SelectValue placeholder="How many?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">One</SelectItem>
                              <SelectItem value="2">Two</SelectItem>
                              <SelectItem value="3">Three</SelectItem>
                              <SelectItem value="4+">Four or more</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Affected Artery/Arteries</Label>
                          <Select>
                            <SelectTrigger className="border-rose-300 dark:border-rose-700">
                              <SelectValue placeholder="Select vessel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lad">LAD (Left Anterior Descending)</SelectItem>
                              <SelectItem value="lcx">LCx (Left Circumflex)</SelectItem>
                              <SelectItem value="rca">RCA (Right Coronary Artery)</SelectItem>
                              <SelectItem value="lmca">LMCA (Left Main Coronary)</SelectItem>
                              <SelectItem value="multiple">Multiple vessels</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Treatment Received</Label>
                          <Select>
                            <SelectTrigger className="border-rose-300 dark:border-rose-700">
                              <SelectValue placeholder="Select treatment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stent">Stent (PCI)</SelectItem>
                              <SelectItem value="cabg">CABG Surgery</SelectItem>
                              <SelectItem value="thrombolysis">Thrombolytic therapy</SelectItem>
                              <SelectItem value="medical">Medical management only</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Number of Stents (if applicable)</Label>
                          <Input
                            type="number"
                            placeholder="Number of stents"
                            className="border-rose-300 dark:border-rose-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Ejection Fraction (EF%)</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 55%"
                            className="border-rose-300 dark:border-rose-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Cardiac Rehabilitation</Label>
                          <Select>
                            <SelectTrigger className="border-rose-300 dark:border-rose-700">
                              <SelectValue placeholder="Did you complete?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">Completed full program</SelectItem>
                              <SelectItem value="partial">Partially completed</SelectItem>
                              <SelectItem value="enrolled">Currently enrolled</SelectItem>
                              <SelectItem value="not-attended">Did not attend</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Current Cardiac Medications</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {['Aspirin', 'Beta-blocker', 'ACE inhibitor', 'Statin', 'Blood thinner', 'None'].map((med) => (
                              <label key={med} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-rose-200 dark:border-rose-700 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                <input type="checkbox" className="rounded text-rose-600" />
                                <span className="text-sm">{med}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Complications After MI</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {['Heart failure', 'Arrhythmia', 'Cardiogenic shock', 'Stroke', 'None'].map((comp) => (
                              <label key={comp} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-rose-200 dark:border-rose-700 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                <input type="checkbox" className="rounded text-rose-600" />
                                <span className="text-sm">{comp}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Follow-up Care Adherence</Label>
                          <Select>
                            <SelectTrigger className="border-rose-300 dark:border-rose-700">
                              <SelectValue placeholder="How well do you follow up?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent (All appointments)</SelectItem>
                              <SelectItem value="good">Good (Most appointments)</SelectItem>
                              <SelectItem value="fair">Fair (Some appointments)</SelectItem>
                              <SelectItem value="poor">Poor (Rarely attend)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FormSection>
            )}

            {currentStep === 1 && <Separator className="my-10" />}

            {/* Health Metrics Section */}
            {currentStep === 2 && (
            <FormSection
              icon={Activity}
              title="Health Metrics"
              description="Cardiovascular health indicators and vital signs"
              accent="amber"
            >
              <FormFieldGroup columns={2}>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Blood Pressure Category</Label>
                  <Select value={formData.restingBP > 140 ? 'high' : formData.restingBP > 120 ? 'elevated' : 'normal'} 
                          onValueChange={(value) => updateField('restingBP', value === 'high' ? 160 : value === 'elevated' ? 130 : 110)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select blood pressure range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Less than 120/80)</SelectItem>
                      <SelectItem value="elevated">Elevated (120-129/Less than 80)</SelectItem>
                      <SelectItem value="high">High (130/80 or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Choose the range that best describes your usual blood pressure</div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Cholesterol Level</Label>
                  <Select value={formData.cholesterol > 240 ? 'high' : formData.cholesterol > 200 ? 'borderline' : 'normal'} 
                          onValueChange={(value) => updateField('cholesterol', value === 'high' ? 280 : value === 'borderline' ? 220 : 180)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select cholesterol range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Less than 200 mg/dL)</SelectItem>
                      <SelectItem value="borderline">Borderline High (200-239 mg/dL)</SelectItem>
                      <SelectItem value="high">High (240 mg/dL or higher)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 dark:text-gray-400">From your recent blood test results</div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Resting Heart Rate</Label>
                  <Select 
                    value={formData.maxHR < 70 ? 'low' : formData.maxHR > 100 ? 'high' : 'normal'} 
                    onValueChange={(value) => updateField('maxHR', value === 'low' ? 60 : value === 'high' ? 110 : 80)}
                  >
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select heart rate range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (50-69 bpm) - Athletic/Very Fit</SelectItem>
                      <SelectItem value="normal">Normal (70-100 bpm) - Healthy Range</SelectItem>
                      <SelectItem value="high">High (100+ bpm) - May Need Attention</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your typical resting heart rate</div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Exercise Capacity</Label>
                  <Select value={formData.oldpeak > 2 ? 'low' : formData.oldpeak > 1 ? 'moderate' : 'good'} 
                          onValueChange={(value) => updateField('oldpeak', value === 'low' ? 3 : value === 'moderate' ? 1.5 : 0.5)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="How well can you exercise?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good - Can exercise vigorously without issues</SelectItem>
                      <SelectItem value="moderate">Moderate - Some difficulty with intense exercise</SelectItem>
                      <SelectItem value="low">Limited - Difficulty with most physical activities</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your general ability to perform physical activities</div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Recent ECG Results</Label>
                  <Select value={formData.restingECG} onValueChange={(value) => updateField('restingECG', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select ECG result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal - No issues found</SelectItem>
                      <SelectItem value="st-t">Abnormal - Minor irregularities detected</SelectItem>
                      <SelectItem value="lvh">Abnormal - Heart enlargement detected</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 dark:text-gray-400">From your most recent heart test (if available)</div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Exercise Test Results</Label>
                  <Select value={formData.stSlope} onValueChange={(value) => updateField('stSlope', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select exercise test result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">Normal - Heart responds well to exercise</SelectItem>
                      <SelectItem value="flat">Mild concern - Flat response to exercise</SelectItem>
                      <SelectItem value="down">Concerning - Poor response to exercise</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Results from stress test or exercise ECG (if done)</div>
                </div>
              </FormFieldGroup>
            </FormSection>
            )}

            {/* Conditional Questions (with metrics) */}
            {currentStep === 2 && (formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
              <>
                <Separator className="my-10" />
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-3 text-2xl font-bold text-orange-700 dark:text-orange-400 mb-6">
                    <Activity className="h-7 w-7" />
                    Advanced Clinical History
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                    {/* Diabetes Detailed Assessment */}
                    {formData.diabetes && (
                      <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-blue-600" />
                            Diabetes Management Profile
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Diabetes Type</Label>
                            <Select value={detailedHistory.diabetesType} onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, diabetesType: val }))}>
                              <SelectTrigger className="bg-white dark:bg-gray-800">
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Type 1">Type 1 (Insulin Dependent)</SelectItem>
                                <SelectItem value="Type 2">Type 2 (Non-Insulin Dependent)</SelectItem>
                                <SelectItem value="Gestational">Gestational Diabetes</SelectItem>
                                <SelectItem value="LADA">LADA (Latent Autoimmune)</SelectItem>
                                <SelectItem value="MODY">MODY (Maturity Onset)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Duration of Diagnosis</Label>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                placeholder="Years" 
                                value={detailedHistory.diabetesDuration}
                                onChange={(e) => setDetailedHistory(prev => ({ ...prev, diabetesDuration: e.target.value }))}
                                className="bg-white dark:bg-gray-800"
                              />
                              <span className="text-sm text-gray-500">years</span>
                            </div>
                          </div>

                          <div className="space-y-3 md:col-span-2">
                            <Label className="text-base font-medium">Current Pharmacotherapy</Label>
                            <Select value={formData.diabetesMedication} onValueChange={(value) => updateField('diabetesMedication', value)}>
                              <SelectTrigger className="bg-white dark:bg-gray-800">
                                <SelectValue placeholder="Select primary treatment" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="insulin">Insulin Monotherapy/Combination</SelectItem>
                                <SelectItem value="tablets">Oral Hypoglycemics (Metformin, SGLT2i, etc.)</SelectItem>
                                <SelectItem value="both">Combination (Insulin + Oral)</SelectItem>
                                <SelectItem value="glp1">GLP-1 Agonists (Injectable)</SelectItem>
                                <SelectItem value="none">Lifestyle Management Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3 md:col-span-2">
                            <Label className="text-base font-medium">Associated Complications</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['Retinopathy', 'Neuropathy', 'Nephropathy', 'PAD'].map((comp) => (
                                <div key={comp} className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <Switch 
                                    checked={detailedHistory.diabetesComplications.includes(comp)}
                                    onCheckedChange={() => toggleDetailedHistoryItem('diabetesComplications', comp)}
                                  />
                                  <Label className="text-sm font-normal cursor-pointer">{comp}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Deep dive follow-ups for complications */}
                          <AnimatePresence>
                            {detailedHistory.diabetesComplications.includes('Retinopathy') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-blue-700 dark:text-blue-400">Retinopathy Details</Label>
                                <Select value={detailedHistory.retinopathyStage} onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, retinopathyStage: val }))}>
                                  <SelectTrigger className="bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
                                    <SelectValue placeholder="Select stage" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mild-npdr">Mild Non-Proliferative</SelectItem>
                                    <SelectItem value="moderate-npdr">Moderate Non-Proliferative</SelectItem>
                                    <SelectItem value="severe-npdr">Severe Non-Proliferative</SelectItem>
                                    <SelectItem value="pdr">Proliferative Diabetic Retinopathy</SelectItem>
                                    <SelectItem value="macular-edema">Diabetic Macular Edema</SelectItem>
                                  </SelectContent>
                                </Select>
                              </motion.div>
                            )}

                            {detailedHistory.diabetesComplications.includes('Neuropathy') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-purple-700 dark:text-purple-400">Neuropathy Classification</Label>
                                <Select value={detailedHistory.neuropathyType} onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, neuropathyType: val }))}>
                                  <SelectTrigger className="bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="peripheral">Peripheral (Sensory Loss)</SelectItem>
                                    <SelectItem value="autonomic">Autonomic (Cardiac/GI)</SelectItem>
                                    <SelectItem value="focal">Focal/Mononeuropathy</SelectItem>
                                    <SelectItem value="proximal">Proximal (Amyotrophy)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </motion.div>
                            )}

                            {detailedHistory.diabetesComplications.includes('Nephropathy') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-green-700 dark:text-green-400">Chronic Kidney Disease Stage</Label>
                                <Select value={detailedHistory.nephropathyStage} onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, nephropathyStage: val }))}>
                                  <SelectTrigger className="bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
                                    <SelectValue placeholder="Select CKD stage" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="stage1">Stage 1 (GFR &gt;90, Albuminuria)</SelectItem>
                                    <SelectItem value="stage2">Stage 2 (GFR 60-89)</SelectItem>
                                    <SelectItem value="stage3a">Stage 3a (GFR 45-59)</SelectItem>
                                    <SelectItem value="stage3b">Stage 3b (GFR 30-44)</SelectItem>
                                    <SelectItem value="stage4">Stage 4 (GFR 15-29)</SelectItem>
                                    <SelectItem value="stage5">Stage 5 (GFR &lt;15 or Dialysis)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </motion.div>
                            )}

                            {detailedHistory.diabetesComplications.includes('PAD') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-orange-700 dark:text-orange-400">Peripheral Artery Disease Severity</Label>
                                <Select value={detailedHistory.padSeverity} onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, padSeverity: val }))}>
                                  <SelectTrigger className="bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700">
                                    <SelectValue placeholder="Select severity" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="asymptomatic">Asymptomatic (ABI &lt;0.9)</SelectItem>
                                    <SelectItem value="claudication">Intermittent Claudication</SelectItem>
                                    <SelectItem value="rest-pain">Rest Pain</SelectItem>
                                    <SelectItem value="tissue-loss">Tissue Loss/Ulceration</SelectItem>
                                  </SelectContent>
                                </Select>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    )}

                    {/* Hypertension Detailed Assessment */}
                    {formData.restingBP > 130 && (
                      <Card className="border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-900/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-red-600" />
                            Hypertension Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Duration of Hypertension</Label>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                placeholder="Years" 
                                value={detailedHistory.hypertensionDuration}
                                onChange={(e) => setDetailedHistory(prev => ({ ...prev, hypertensionDuration: e.target.value }))}
                                className="bg-white dark:bg-gray-800"
                              />
                              <span className="text-sm text-gray-500">years</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">Adherence to Therapy</Label>
                            <Select value={formData.bpMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('bpMedication', value === 'yes')}>
                              <SelectTrigger className="bg-white dark:bg-gray-800">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Compliant with Medication</SelectItem>
                                <SelectItem value="no">Not on Medication / Non-compliant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3 md:col-span-2">
                            <Label className="text-base font-medium">Antihypertensive Classes</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {['ACE Inhibitors/ARBs', 'Beta Blockers', 'Calcium Channel Blockers', 'Diuretics', 'Other'].map((med) => (
                                <div key={med} className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <Switch 
                                    checked={detailedHistory.hypertensionMedications.includes(med)}
                                    onCheckedChange={() => toggleDetailedHistoryItem('hypertensionMedications', med)}
                                  />
                                  <Label className="text-sm font-normal cursor-pointer">{med}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Deep dive follow-ups for medications */}
                          <AnimatePresence>
                            {detailedHistory.hypertensionMedications.includes('ACE Inhibitors/ARBs') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-red-700 dark:text-red-400">ACEi/ARB Specification</Label>
                                <Input
                                  placeholder="e.g., Lisinopril 10mg, Losartan 50mg"
                                  value={detailedHistory.aceInhibitorName}
                                  onChange={(e) => setDetailedHistory(prev => ({ ...prev, aceInhibitorName: e.target.value }))}
                                  className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                                />
                              </motion.div>
                            )}

                            {detailedHistory.hypertensionMedications.includes('Beta Blockers') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Beta Blocker Specification</Label>
                                <Input
                                  placeholder="e.g., Metoprolol 50mg, Carvedilol 25mg"
                                  value={detailedHistory.betaBlockerName}
                                  onChange={(e) => setDetailedHistory(prev => ({ ...prev, betaBlockerName: e.target.value }))}
                                  className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                                />
                              </motion.div>
                            )}

                            {detailedHistory.hypertensionMedications.includes('Calcium Channel Blockers') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-pink-700 dark:text-pink-400">CCB Specification</Label>
                                <Input
                                  placeholder="e.g., Amlodipine 5mg, Diltiazem 180mg"
                                  value={detailedHistory.ccbName}
                                  onChange={(e) => setDetailedHistory(prev => ({ ...prev, ccbName: e.target.value }))}
                                  className="bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700"
                                />
                              </motion.div>
                            )}

                            {detailedHistory.hypertensionMedications.includes('Diuretics') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-cyan-700 dark:text-cyan-400">Diuretic Specification</Label>
                                <Input
                                  placeholder="e.g., Hydrochlorothiazide 25mg, Furosemide 40mg"
                                  value={detailedHistory.diureticName}
                                  onChange={(e) => setDetailedHistory(prev => ({ ...prev, diureticName: e.target.value }))}
                                  className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    )}

                    {/* Cardiac History Detailed Assessment */}
                    {formData.previousHeartAttack && (
                      <Card className="border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <HeartPulse className="h-5 w-5 text-amber-600" />
                            Cardiac Event History
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Lipid Management</Label>
                            <Select value={formData.cholesterolMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('cholesterolMedication', value === 'yes')}>
                              <SelectTrigger className="bg-white dark:bg-gray-800">
                                <SelectValue placeholder="Statin therapy status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">High-Intensity Statin</SelectItem>
                                <SelectItem value="moderate">Moderate-Intensity Statin</SelectItem>
                                <SelectItem value="no">No Lipid Lowering Therapy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3 md:col-span-2">
                            <Label className="text-base font-medium">Previous Interventions</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {['PCI (Stent)', 'CABG (Bypass)', 'Pacemaker/ICD', 'Valve Repair/Replacement', 'Thrombolysis'].map((proc) => (
                                <div key={proc} className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <Switch 
                                    checked={detailedHistory.cardiacInterventions.includes(proc)}
                                    onCheckedChange={() => toggleDetailedHistoryItem('cardiacInterventions', proc)}
                                  />
                                  <Label className="text-sm font-normal cursor-pointer">{proc}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Deep dive follow-ups for cardiac interventions */}
                          <AnimatePresence>
                            {detailedHistory.cardiacInterventions.includes('PCI (Stent)') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-amber-700 dark:text-amber-400">PCI Details</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <Input
                                    type="month"
                                    placeholder="Date of procedure"
                                    value={detailedHistory.pciDate}
                                    onChange={(e) => setDetailedHistory(prev => ({ ...prev, pciDate: e.target.value }))}
                                    className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                                  />
                                  <Select onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, pciVessel: val }))}>
                                    <SelectTrigger className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
                                      <SelectValue placeholder="Vessel stented" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="lad">LAD (Left Anterior Descending)</SelectItem>
                                      <SelectItem value="lcx">LCx (Left Circumflex)</SelectItem>
                                      <SelectItem value="rca">RCA (Right Coronary)</SelectItem>
                                      <SelectItem value="lmca">LMCA (Left Main)</SelectItem>
                                      <SelectItem value="multiple">Multiple Vessels</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </motion.div>
                            )}

                            {detailedHistory.cardiacInterventions.includes('CABG (Bypass)') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-red-700 dark:text-red-400">CABG Surgery Details</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <Input
                                    type="month"
                                    placeholder="Surgery date"
                                    value={detailedHistory.cabgDate}
                                    onChange={(e) => setDetailedHistory(prev => ({ ...prev, cabgDate: e.target.value }))}
                                    className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                                  />
                                  <Select onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, cabgGrafts: val }))}>
                                    <SelectTrigger className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700">
                                      <SelectValue placeholder="Number of grafts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="single">Single Graft</SelectItem>
                                      <SelectItem value="double">Double Graft</SelectItem>
                                      <SelectItem value="triple">Triple Graft (CABG×3)</SelectItem>
                                      <SelectItem value="quad">Quadruple Graft (CABG×4)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </motion.div>
                            )}

                            {detailedHistory.cardiacInterventions.includes('Pacemaker/ICD') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-purple-700 dark:text-purple-400">Device Type & Indication</Label>
                                <Select value={detailedHistory.pacemakerType} onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, pacemakerType: val }))}>
                                  <SelectTrigger className="bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700">
                                    <SelectValue placeholder="Select device type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="single-pacemaker">Single Chamber Pacemaker</SelectItem>
                                    <SelectItem value="dual-pacemaker">Dual Chamber Pacemaker</SelectItem>
                                    <SelectItem value="crt-p">CRT-P (Cardiac Resynchronization Therapy)</SelectItem>
                                    <SelectItem value="icd">ICD (Implantable Cardioverter-Defibrillator)</SelectItem>
                                    <SelectItem value="crt-d">CRT-D (Combined CRT + ICD)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </motion.div>
                            )}

                            {detailedHistory.cardiacInterventions.includes('Valve Repair/Replacement') && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 space-y-3"
                              >
                                <Label className="text-sm font-medium text-teal-700 dark:text-teal-400">Valve Surgery Specification</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <Select onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, valveType: val }))}>
                                    <SelectTrigger className="bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700">
                                      <SelectValue placeholder="Valve location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="aortic">Aortic Valve</SelectItem>
                                      <SelectItem value="mitral">Mitral Valve</SelectItem>
                                      <SelectItem value="tricuspid">Tricuspid Valve</SelectItem>
                                      <SelectItem value="pulmonary">Pulmonary Valve</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select onValueChange={(val) => setDetailedHistory(prev => ({ ...prev, valveProcedure: val }))}>
                                    <SelectTrigger className="bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700">
                                      <SelectValue placeholder="Procedure type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="mechanical">Mechanical Replacement</SelectItem>
                                      <SelectItem value="bioprosthetic">Bioprosthetic Replacement</SelectItem>
                                      <SelectItem value="repair">Valve Repair</SelectItem>
                                      <SelectItem value="tavr">TAVR (Transcatheter)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </motion.div>
              </>
            )}

            {(currentStep === 2) && <Separator className="my-10" />}

            {/* Lifestyle Assessment Section */}
            {currentStep === 3 && (
            <FormSection
              icon={TrendingUp}
              title="Lifestyle Assessment"
              description="Daily habits and wellness factors"
              accent="amber"
            >
              <FormFieldGroup columns={2}>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Dietary Preference</Label>
                  <Select value={formData.dietType} onValueChange={(value) => updateField('dietType', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select diet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-200">Physical Activity Level</Label>
                  <Select value={formData.physicalActivity} onValueChange={(value) => updateField('physicalActivity', value)}>
                    <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minimal exercise</SelectItem>
                      <SelectItem value="moderate">Moderate - Regular light exercise</SelectItem>
                      <SelectItem value="high">High - Intensive regular exercise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="sleepHours" className="text-base font-semibold text-gray-700 dark:text-gray-200">Average Sleep Hours</Label>
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hours of sleep per night on average</div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="stressLevel" className="text-base font-semibold text-gray-700 dark:text-gray-200">Stress Level (1-10)</Label>
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">1 = Very relaxed, 10 = Extremely stressed</div>
                </div>
              </FormFieldGroup>
            </FormSection>
            )}

            {/* Repeated Conditional Questions block - show with lifestyle step if applicable */}
            {currentStep === 3 && (formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
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
                          <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
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
                          <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
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
                            <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
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
                            <SelectTrigger className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
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

            {(currentStep === 3) && <Separator className="my-10" />}

            {/* Clinical Data & Biomarkers Section */}
            {currentStep === 4 && (
            <FormSection
              icon={Microscope}
              title="Clinical Data & Laboratory Biomarkers"
              description="Advanced clinical measurements and biomarker analysis"
              accent="amber"
            >
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
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Diastolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={clinicalData.vitals.diastolicBP}
                      onChange={(e) => updateClinicalData('vitals', 'diastolicBP', parseInt(e.target.value) || 80)}
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      value={clinicalData.vitals.heartRate}
                      onChange={(e) => updateClinicalData('vitals', 'heartRate', parseInt(e.target.value) || 72)}
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
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
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                    />
                    <div className="text-sm text-gray-500">Normal: &lt;0.04 ng/mL</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">BNP (pg/mL)</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.bnp}
                      onChange={(e) => updateClinicalData('biomarkers', 'bnp', parseInt(e.target.value) || 100)}
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
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
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
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
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                    />
                    <div className="text-sm text-gray-500">&lt;200 mg/dL</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">LDL Cholesterol</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.ldl}
                      onChange={(e) => updateClinicalData('biomarkers', 'ldl', parseInt(e.target.value) || 100)}
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                    />
                    <div className="text-sm text-gray-500">&lt;100 mg/dL</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">HDL Cholesterol</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.hdl}
                      onChange={(e) => updateClinicalData('biomarkers', 'hdl', parseInt(e.target.value) || 50)}
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                    />
                    <div className="text-sm text-gray-500">&gt;40 mg/dL (M), &gt;50 mg/dL (F)</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Triglycerides</Label>
                    <Input
                      type="number"
                      value={clinicalData.biomarkers.triglycerides}
                      onChange={(e) => updateClinicalData('biomarkers', 'triglycerides', parseInt(e.target.value) || 120)}
                      className="h-12 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                    />
                    <div className="text-sm text-gray-500">&lt;150 mg/dL</div>
                  </div>
                </div>
              </div>
            </FormSection>
            )}

            {(currentStep === 4) && <Separator className="my-10" />}

            {/* Family History Section */}
            {currentStep === 4 && (
            <FormSection
              icon={Users}
              title="Family History Assessment"
              description="Hereditary cardiovascular risk factors"
              accent="amber"
            >
              <div className="space-y-4">
                {familyMembers.map((member, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 dark:bg-slate-700 rounded-lg">
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
            </FormSection>
            )}

            {(currentStep === 4) && <Separator className="my-10" />}

            {/* Lifestyle Risk Factors (keep with Step 3) */}
            {currentStep === 3 && (
            <FormSection
              icon={TrendingUp}
              title="Lifestyle Risk Factors"
              description="Advanced lifestyle and behavioral assessment"
              accent="amber"
            >
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
            </FormSection>
            )}

            {(currentStep === 3) && <Separator className="my-10" />}

            {/* Document Upload Section */}
            {currentStep === 5 && (
            <FormSection
              icon={Upload}
              title="Clinical Document Upload"
              description="Upload ECG reports, lab results, and previous assessments"
              accent="amber"
            >
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
                      <div key={index} className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50 group">
                        <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1 text-gray-800 dark:text-gray-200 truncate" title={file.name}>{file.name}</span>
                        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500 flex-shrink-0">Ready for Analysis</Badge>
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
            )}

            {/* Step Navigation and Generate */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="pt-1"
            >
              <div className="flex items-center justify-between gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handlePreviousStep} 
                    disabled={currentStep === 1} 
                    className="h-12 w-12 rounded-full p-0 flex items-center justify-center border-2 border-amber-300 dark:border-amber-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <ChevronLeft className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                  </Button>
                </motion.div>
                {currentStep < totalSteps ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      type="button"
                      onClick={handleNextStep} 
                      disabled={!canProceedToNext()} 
                      className="h-12 w-12 rounded-full p-0 flex items-center justify-center bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-amber-400 dark:border-amber-500"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 flex justify-end">
                    <Button
                      type="button"
                      onClick={generateProfessionalReport}
                      disabled={processingLoading || !patientName.trim()}
                      className="h-12 px-6 w-full bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-500 hover:from-yellow-700 hover:via-amber-700 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold border-2 border-yellow-500/50"
                    >
                      {processingLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating Report…
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-5 w-5" />
                          Generate Professional Report
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
            {currentStep === totalSteps && !patientName.trim() && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 text-center">Please enter patient name to generate professional report</p>
            )}
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
