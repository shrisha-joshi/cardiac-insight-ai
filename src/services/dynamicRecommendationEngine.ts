/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DYNAMIC RECOMMENDATION ENGINE - PERSONALIZED & RISK-STRATIFIED
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 GOAL: Generate recommendations that CHANGE based on:
 *    1. Risk Level (low/medium/high/very-high)
 *    2. Individual Patient Factors
 *    3. Urgency & Priority
 *    4. Expected Impact on Risk Reduction
 * 
 * 🚨 PROBLEM SOLVED: Previous system gave SAME recommendations to all patients
 * ✅ NEW SYSTEM: 100% personalized, risk-stratified, prioritized recommendations
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { PatientData } from '@/lib/mockData';
import { ComprehensiveFeatures } from './comprehensiveInputUtilization';

interface Recommendation {
  priority: 1 | 2 | 3 | 4 | 5; // 1 = URGENT, 5 = Preventive
  category: 'medical' | 'lifestyle' | 'diet' | 'exercise' | 'monitoring' | 'medication' | 'emergency';
  title: string;
  description: string;
  action: string;
  expectedImpact: string; // e.g., "50% risk reduction"
  timeline: string; // e.g., "Immediate", "Within 1 week", "Within 1 month"
  urgencyLevel: 'emergency' | 'urgent' | 'important' | 'routine' | 'preventive';
  specificToPatient: boolean;
  reasoning: string;
}

interface DynamicRecommendationResult {
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  riskScore: number;
  totalRecommendations: number;
  emergencyRecommendations: number;
  urgentRecommendations: number;
  recommendations: Recommendation[];
  overallStrategy: string;
  keyPriorities: string[];
  estimatedRiskReduction: string;
  followUpSchedule: string;
}

class DynamicRecommendationEngine {

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * MAIN ENTRY - GENERATE RISK-STRATIFIED RECOMMENDATIONS
   * ═══════════════════════════════════════════════════════════════════════════
   */
  async generateDynamicRecommendations(
    riskScore: number,
    riskLevel: 'low' | 'medium' | 'high' | 'very-high',
    data: PatientData,
    features: ComprehensiveFeatures
  ): Promise<DynamicRecommendationResult> {
    if (import.meta.env.DEV) console.log(`🎯 DYNAMIC RECOMMENDATIONS: Risk Level = ${riskLevel} (${riskScore}%)`);
    
    const recommendations: Recommendation[] = [];

    // STRATEGY 1: RISK-STRATIFIED BASE RECOMMENDATIONS
    if (riskLevel === 'very-high') {
      recommendations.push(...this.getVeryHighRiskRecommendations(data, features));
    } else if (riskLevel === 'high') {
      recommendations.push(...this.getHighRiskRecommendations(data, features));
    } else if (riskLevel === 'medium') {
      recommendations.push(...this.getMediumRiskRecommendations(data, features));
    } else {
      recommendations.push(...this.getLowRiskRecommendations(data, features));
    }

    // STRATEGY 2: PATIENT-SPECIFIC URGENT FACTORS
    recommendations.push(...this.getPatientSpecificRecommendations(data, features, riskLevel));

    // STRATEGY 3: MODIFIABLE RISK FACTOR INTERVENTIONS
    recommendations.push(...this.getModifiableRiskFactorRecommendations(data, features, riskLevel));

    // STRATEGY 4: BIOMARKER-SPECIFIC INTERVENTIONS
    recommendations.push(...this.getBiomarkerRecommendations(data, features, riskLevel));

    // STRATEGY 5: INDIAN POPULATION-SPECIFIC
    recommendations.push(...this.getIndianSpecificRecommendations(data, features, riskLevel));

    // Sort by priority (most urgent first)
    recommendations.sort((a, b) => a.priority - b.priority);

    // Calculate statistics
    const emergencyRecs = recommendations.filter(r => r.urgencyLevel === 'emergency').length;
    const urgentRecs = recommendations.filter(r => r.urgencyLevel === 'urgent').length;

    // Determine overall strategy
    const overallStrategy = this.determineOverallStrategy(riskLevel, riskScore);
    const keyPriorities = this.extractKeyPriorities(recommendations);
    const estimatedRiskReduction = this.calculateEstimatedRiskReduction(recommendations);
    const followUpSchedule = this.determineFollowUpSchedule(riskLevel);

    if (import.meta.env.DEV) console.log(`✅ Generated ${recommendations.length} personalized recommendations`);
    if (import.meta.env.DEV) console.log(`   Emergency: ${emergencyRecs}, Urgent: ${urgentRecs}`);
    if (import.meta.env.DEV) console.log(`   Estimated Risk Reduction: ${estimatedRiskReduction}`);

    return {
      riskLevel,
      riskScore,
      totalRecommendations: recommendations.length,
      emergencyRecommendations: emergencyRecs,
      urgentRecommendations: urgentRecs,
      recommendations,
      overallStrategy,
      keyPriorities,
      estimatedRiskReduction,
      followUpSchedule
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * RISK-STRATIFIED BASE RECOMMENDATIONS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  private getVeryHighRiskRecommendations(data: PatientData, features: ComprehensiveFeatures): Recommendation[] {
    return [
      {
        priority: 1,
        category: 'emergency',
        title: '🚨 EMERGENCY: Immediate Medical Attention Required',
        description: 'Your risk score indicates VERY HIGH risk (>60%). Immediate medical intervention needed.',
        action: 'Visit emergency room or consult cardiologist within 24 hours. Do NOT delay.',
        expectedImpact: 'Life-saving intervention',
        timeline: 'IMMEDIATE (Within 24 hours)',
        urgencyLevel: 'emergency',
        specificToPatient: false,
        reasoning: 'Very high risk requires urgent medical evaluation to prevent cardiac event'
      },
      {
        priority: 1,
        category: 'medical',
        title: '💊 Start Aggressive Medical Therapy',
        description: 'High-intensity statin, antiplatelet therapy, and BP control medications needed immediately.',
        action: 'Cardiologist will prescribe: High-dose statin (Atorvastatin 80mg), Aspirin, ACE inhibitor/ARB, Beta-blocker',
        expectedImpact: '40-50% risk reduction with optimal medical therapy',
        timeline: 'Start within 48 hours',
        urgencyLevel: 'emergency',
        specificToPatient: false,
        reasoning: 'Proven therapies that significantly reduce cardiovascular events'
      },
      {
        priority: 1,
        category: 'monitoring',
        title: '📊 Intensive Monitoring Protocol',
        description: 'Weekly medical follow-ups and daily home BP monitoring required.',
        action: 'Schedule weekly cardiologist visits for first month, then bi-weekly. Daily BP log, monthly blood tests.',
        expectedImpact: 'Early detection of deterioration',
        timeline: 'Start immediately',
        urgencyLevel: 'urgent',
        specificToPatient: false,
        reasoning: 'Very high risk requires close monitoring to adjust treatment and prevent events'
      },
      {
        priority: 2,
        category: 'lifestyle',
        title: '🚭 CRITICAL: Immediate Lifestyle Modifications',
        description: 'All modifiable risk factors must be addressed immediately under medical supervision.',
        action: 'Complete smoking cessation, restricted sodium diet (<1500mg/day), supervised exercise program',
        expectedImpact: '25-35% risk reduction',
        timeline: 'Start within 1 week',
        urgencyLevel: 'urgent',
        specificToPatient: false,
        reasoning: 'Lifestyle changes complement medical therapy for maximum risk reduction'
      }
    ];
  }

  private getHighRiskRecommendations(data: PatientData, features: ComprehensiveFeatures): Recommendation[] {
    return [
      {
        priority: 1,
        category: 'medical',
        title: '⚠️ URGENT: Cardiologist Consultation Required',
        description: 'Your risk score indicates HIGH risk (40-60%). Medical evaluation needed urgently.',
        action: 'Schedule cardiologist appointment within 7 days. Do not wait for routine appointment.',
        expectedImpact: 'Prevent progression to very high risk',
        timeline: 'Within 1 week',
        urgencyLevel: 'urgent',
        specificToPatient: false,
        reasoning: 'High risk requires prompt medical assessment and treatment initiation'
      },
      {
        priority: 1,
        category: 'medication',
        title: '💊 Start Preventive Medications',
        description: 'Statin therapy, BP control, and potentially antiplatelet therapy recommended.',
        action: 'Discuss with doctor: Moderate-high intensity statin, BP medication if >130/80, consider low-dose aspirin',
        expectedImpact: '30-40% risk reduction',
        timeline: 'Within 2 weeks',
        urgencyLevel: 'urgent',
        specificToPatient: false,
        reasoning: 'Medications proven to reduce cardiovascular events in high-risk patients'
      },
      {
        priority: 2,
        category: 'monitoring',
        title: '📈 Enhanced Monitoring Schedule',
        description: 'Bi-weekly follow-ups initially, then monthly monitoring.',
        action: 'Bi-weekly medical checks for first 2 months, then monthly. Home BP monitoring 2x daily.',
        expectedImpact: 'Track treatment response and adjust therapy',
        timeline: 'Start within 1 week',
        urgencyLevel: 'important',
        specificToPatient: false,
        reasoning: 'Regular monitoring ensures treatment effectiveness and early problem detection'
      },
      {
        priority: 2,
        category: 'lifestyle',
        title: '🏃 Aggressive Lifestyle Intervention Program',
        description: 'Structured lifestyle modification program with professional guidance.',
        action: 'Enroll in cardiac rehab/lifestyle program. Target: Exercise 250+ min/week, DASH diet, stress management.',
        expectedImpact: '20-30% risk reduction',
        timeline: 'Start within 2 weeks',
        urgencyLevel: 'important',
        specificToPatient: false,
        reasoning: 'Intensive lifestyle changes significantly improve outcomes in high-risk patients'
      }
    ];
  }

  private getMediumRiskRecommendations(data: PatientData, features: ComprehensiveFeatures): Recommendation[] {
    return [
      {
        priority: 2,
        category: 'medical',
        title: '🏥 Medical Evaluation Recommended',
        description: 'Your risk score indicates MEDIUM risk (20-40%). Professional assessment recommended.',
        action: 'Schedule comprehensive cardiovascular evaluation within 1 month with primary care or cardiologist.',
        expectedImpact: 'Identify specific risk factors and optimize treatment',
        timeline: 'Within 1 month',
        urgencyLevel: 'important',
        specificToPatient: false,
        reasoning: 'Medium risk benefits from medical assessment to prevent progression'
      },
      {
        priority: 2,
        category: 'medication',
        title: '💊 Consider Preventive Therapy',
        description: 'Statin therapy may be beneficial depending on your specific risk factors.',
        action: 'Discuss with doctor: Consider moderate-intensity statin if LDL >100, BP medication if >130/80',
        expectedImpact: '20-30% risk reduction if medications started',
        timeline: 'Within 6 weeks',
        urgencyLevel: 'important',
        specificToPatient: false,
        reasoning: 'Selected patients at medium risk benefit from preventive medications'
      },
      {
        priority: 3,
        category: 'monitoring',
        title: '📊 Regular Monitoring Schedule',
        description: 'Bi-monthly check-ups and quarterly lab tests recommended.',
        action: 'Medical check-up every 2 months, lipid panel and glucose every 3 months, annual comprehensive screening.',
        expectedImpact: 'Track risk factor trends and adjust interventions',
        timeline: 'Start within 6 weeks',
        urgencyLevel: 'routine',
        specificToPatient: false,
        reasoning: 'Regular monitoring helps maintain control and prevents risk escalation'
      },
      {
        priority: 3,
        category: 'lifestyle',
        title: '🥗 Structured Lifestyle Modification',
        description: 'Active lifestyle changes can prevent progression and potentially reverse risk.',
        action: 'Target: 150-200 min/week exercise, Mediterranean/DASH diet, weight loss if BMI >25, stress reduction.',
        expectedImpact: '15-25% risk reduction',
        timeline: 'Start within 1 month',
        urgencyLevel: 'routine',
        specificToPatient: false,
        reasoning: 'Lifestyle changes are first-line intervention for medium risk'
      }
    ];
  }

  private getLowRiskRecommendations(data: PatientData, features: ComprehensiveFeatures): Recommendation[] {
    return [
      {
        priority: 4,
        category: 'monitoring',
        title: '✅ Maintain Healthy Status',
        description: 'Your risk score is LOW (<10%). Continue your current healthy lifestyle.',
        action: 'Annual health check-up, lipid panel every 2 years (or yearly if age >40), BP check every 6 months.',
        expectedImpact: 'Maintain low risk status',
        timeline: 'Ongoing',
        urgencyLevel: 'preventive',
        specificToPatient: false,
        reasoning: 'Low risk still benefits from monitoring to detect early changes'
      },
      {
        priority: 4,
        category: 'lifestyle',
        title: '🏃 Preventive Lifestyle Optimization',
        description: 'Continue healthy habits to maintain low risk and prevent future risk increase.',
        action: 'Target: 150+ min/week moderate exercise, heart-healthy diet, maintain healthy weight, no smoking.',
        expectedImpact: 'Stay low risk throughout life',
        timeline: 'Ongoing',
        urgencyLevel: 'preventive',
        specificToPatient: false,
        reasoning: 'Prevention is the best strategy - maintain healthy habits'
      },
      {
        priority: 5,
        category: 'diet',
        title: '🥗 Heart-Healthy Diet Maintenance',
        description: 'Continue balanced diet rich in fruits, vegetables, whole grains, and healthy fats.',
        action: 'Mediterranean or DASH diet pattern, limit saturated fat, plenty of fiber, moderate sodium.',
        expectedImpact: 'Maintain optimal cholesterol and BP',
        timeline: 'Ongoing',
        urgencyLevel: 'preventive',
        specificToPatient: false,
        reasoning: 'Healthy diet is foundation of cardiovascular health'
      },
      {
        priority: 5,
        category: 'exercise',
        title: '💪 Regular Physical Activity',
        description: 'Maintain or increase physical activity for continued cardiovascular fitness.',
        action: '150 min/week moderate activity (brisk walking) or 75 min/week vigorous activity, plus strength training 2x/week.',
        expectedImpact: 'Maintain cardiovascular fitness and healthy weight',
        timeline: 'Ongoing',
        urgencyLevel: 'preventive',
        specificToPatient: false,
        reasoning: 'Regular exercise is proven to reduce cardiovascular risk'
      }
    ];
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PATIENT-SPECIFIC URGENT RECOMMENDATIONS
   * ═══════════════════════════════════════════════════════════════════════════
   */
  private getPatientSpecificRecommendations(
    data: PatientData,
    features: ComprehensiveFeatures,
    riskLevel: string
  ): Recommendation[] {
    const recs: Recommendation[] = [];

    // SMOKING - HIGHEST IMPACT
    if (features.isSmoker) {
      const priority = riskLevel === 'very-high' || riskLevel === 'high' ? 1 : 2;
      recs.push({
        priority: priority as 1 | 2,
        category: 'lifestyle',
        title: '🚭 URGENT: Smoking Cessation Required',
        description: `Smoking is your #1 modifiable risk factor. Quitting will reduce your risk by 50% within 1 year.`,
        action: 'Start smoking cessation program IMMEDIATELY. Options: Nicotine replacement, Varenicline (Champix), counseling, support groups.',
        expectedImpact: '50% risk reduction within 1 year',
        timeline: priority === 1 ? 'START TODAY' : 'Within 1 week',
        urgencyLevel: priority === 1 ? 'urgent' : 'important',
        specificToPatient: true,
        reasoning: 'Smoking is the single most important modifiable risk factor - quitting has immediate benefits'
      });
    }

    // DIABETES - CRITICAL CONTROL
    if (features.hasDiabetes) {
      const isUncontrolled = features.diabetesControlScore < 60;
      if (isUncontrolled) {
        recs.push({
          priority: riskLevel === 'very-high' || riskLevel === 'high' ? 1 : 2,
          category: 'medical',
          title: '⚠️ CRITICAL: Diabetes Control Required',
          description: `Your diabetes appears uncontrolled. Target HbA1c <7% to reduce cardiovascular risk by 30%.`,
          action: 'Urgent endocrinologist consultation. Adjust medications, continuous glucose monitoring, dietary changes.',
          expectedImpact: '30-40% risk reduction with good control (HbA1c <7%)',
          timeline: 'Within 1 week',
          urgencyLevel: 'urgent',
          specificToPatient: true,
          reasoning: 'Uncontrolled diabetes dramatically increases cardiovascular risk'
        });
      } else {
        recs.push({
          priority: 3,
          category: 'monitoring',
          title: '✅ Continue Diabetes Management',
          description: 'Your diabetes control appears good. Maintain current management.',
          action: 'Continue current diabetes medications, quarterly HbA1c checks, annual retinal and kidney screening.',
          expectedImpact: 'Maintain reduced risk from good diabetes control',
          timeline: 'Ongoing',
          urgencyLevel: 'routine',
          specificToPatient: true,
          reasoning: 'Good diabetes control significantly reduces cardiovascular complications'
        });
      }
    }

    // HYPERTENSION - AGGRESSIVE CONTROL
    if (features.systolicBP > 140 || features.diastolicBP > 90) {
      const severity = features.systolicBP > 160 ? 'severe' : features.systolicBP > 140 ? 'moderate' : 'mild';
      recs.push({
        priority: severity === 'severe' ? 1 : 2,
        category: 'medical',
        title: `${severity === 'severe' ? '🚨' : '⚠️'} ${severity.toUpperCase()} Hypertension - Control Required`,
        description: `Your BP is ${features.systolicBP}/${features.diastolicBP}. Target <130/80 for cardiovascular protection.`,
        action: severity === 'severe' 
          ? 'URGENT doctor visit within 48 hours. May need multiple BP medications.'
          : 'Schedule doctor appointment within 2 weeks. Start or adjust BP medications.',
        expectedImpact: '20-30% risk reduction with BP control',
        timeline: severity === 'severe' ? 'Within 48 hours' : 'Within 2 weeks',
        urgencyLevel: severity === 'severe' ? 'urgent' : 'important',
        specificToPatient: true,
        reasoning: 'High blood pressure damages arteries and dramatically increases heart attack risk'
      });
    }

    // HIGH CHOLESTEROL - STATIN THERAPY
    if (features.cholesterolRatio > 5) {
      recs.push({
        priority: riskLevel === 'very-high' || riskLevel === 'high' ? 1 : 2,
        category: 'medication',
        title: '💊 High Cholesterol - Statin Therapy Needed',
        description: `Your cholesterol ratio is ${features.cholesterolRatio.toFixed(1)} (high). Target <3.5 for optimal protection.`,
        action: 'Doctor consultation for statin prescription. Target LDL <70 mg/dL (high risk) or <100 mg/dL (medium risk).',
        expectedImpact: '25-35% risk reduction with statin therapy',
        timeline: riskLevel === 'very-high' || riskLevel === 'high' ? 'Within 1 week' : 'Within 1 month',
        urgencyLevel: riskLevel === 'very-high' || riskLevel === 'high' ? 'urgent' : 'important',
        specificToPatient: true,
        reasoning: 'High cholesterol causes atherosclerosis - statins proven to reduce heart attacks'
      });
    }

    // OBESITY - WEIGHT LOSS CRITICAL
    if (features.bmi > 30 || (features.bmi > 25 && features.abdominalObesityRisk > 1)) {
      recs.push({
        priority: 3,
        category: 'lifestyle',
        title: '⚖️ Weight Loss Program Essential',
        description: `Your BMI is ${features.bmi.toFixed(1)} (${features.bmi > 30 ? 'obese' : 'overweight'}). Target: 5-10% weight loss.`,
        action: 'Structured weight loss program: 500-750 calorie deficit/day, 200+ min/week exercise, consider dietitian referral.',
        expectedImpact: '15-20% risk reduction with 10% weight loss',
        timeline: '3-6 month program',
        urgencyLevel: 'important',
        specificToPatient: true,
        reasoning: 'Weight loss improves BP, cholesterol, diabetes control - multiple benefits'
      });
    }

    // SEDENTARY LIFESTYLE
    if (features.physicalActivityLevel === 'low' || features.exerciseMinutesPerWeek < 150) {
      recs.push({
        priority: 3,
        category: 'exercise',
        title: '🏃 Increase Physical Activity',
        description: `You're currently exercising ${features.exerciseMinutesPerWeek} min/week. Target: 150+ minutes.`,
        action: 'Gradual increase: Start with 30 min/day walking, 5 days/week. Build up over 8 weeks.',
        expectedImpact: '15-20% risk reduction with regular exercise',
        timeline: 'Start within 1 week, build over 8 weeks',
        urgencyLevel: 'important',
        specificToPatient: true,
        reasoning: 'Physical inactivity is major risk factor - exercise improves all cardiovascular parameters'
      });
    }

    // FAMILY HISTORY - GENETIC RISK
    if (features.hasPositiveFamilyHistory) {
      recs.push({
        priority: 3,
        category: 'monitoring',
        title: '👨‍👩‍👧‍👦 Family History - Enhanced Screening',
        description: 'Positive family history increases your risk. More aggressive prevention needed.',
        action: 'Earlier and more frequent screening. Consider genetic testing if family history is strong (multiple early events).',
        expectedImpact: 'Early detection and prevention',
        timeline: 'Discuss at next medical visit',
        urgencyLevel: 'routine',
        specificToPatient: true,
        reasoning: 'Family history indicates genetic predisposition - requires enhanced surveillance'
      });
    }

    // STRESS & MENTAL HEALTH
    if (features.psychosocialRiskScore > 70) {
      recs.push({
        priority: 3,
        category: 'lifestyle',
        title: '🧠 Stress Management & Mental Health',
        description: 'High stress levels increase cardiovascular risk. Stress reduction is important.',
        action: 'Consider: Mindfulness/meditation, yoga, counseling/therapy, stress management program.',
        expectedImpact: '10-15% risk reduction',
        timeline: 'Start within 1 month',
        urgencyLevel: 'routine',
        specificToPatient: true,
        reasoning: 'Chronic stress contributes to hypertension, inflammation, and cardiovascular events'
      });
    }

    return recs;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * MODIFIABLE RISK FACTOR INTERVENTIONS
   * ═══════════════════════════════════════════════════════════════════════════
   */
  private getModifiableRiskFactorRecommendations(
    data: PatientData,
    features: ComprehensiveFeatures,
    riskLevel: string
  ): Recommendation[] {
    const recs: Recommendation[] = [];

    // DIET QUALITY
    if (features.dietaryRiskFactors.length > 2) {
      recs.push({
        priority: 3,
        category: 'diet',
        title: '🥗 Diet Quality Improvement',
        description: `You have ${features.dietaryRiskFactors.length} dietary risk factors that can be improved.`,
        action: 'Adopt Mediterranean or DASH diet: More fruits/vegetables, whole grains, fish, nuts, olive oil. Less red meat, saturated fat, sodium.',
        expectedImpact: '15-20% risk reduction with diet improvement',
        timeline: 'Start within 2 weeks',
        urgencyLevel: 'routine',
        specificToPatient: true,
        reasoning: 'Diet quality directly impacts cholesterol, BP, inflammation, and weight'
      });
    }

    // METABOLIC SYNDROME
    if (features.hasMetabolicSyndrome) {
      recs.push({
        priority: 2,
        category: 'medical',
        title: '⚠️ Metabolic Syndrome - Comprehensive Management',
        description: `You have metabolic syndrome (${features.metabolicSyndromeScore}/5 criteria). This doubles cardiovascular risk.`,
        action: 'Comprehensive approach: Weight loss, exercise, BP control, diabetes prevention/control, cholesterol management.',
        expectedImpact: '30-40% risk reduction with comprehensive management',
        timeline: 'Start within 2 weeks',
        urgencyLevel: 'important',
        specificToPatient: true,
        reasoning: 'Metabolic syndrome is cluster of risk factors that synergistically increase risk'
      });
    }

    // ALCOHOL
    if (features.tobaccoExposureScore > 5) {
      recs.push({
        priority: 3,
        category: 'lifestyle',
        title: '🍺 Alcohol Moderation',
        description: 'Excessive alcohol consumption increases cardiovascular risk.',
        action: 'Limit alcohol: Maximum 1 drink/day (women) or 2 drinks/day (men). Consider complete abstinence if very high risk.',
        expectedImpact: '5-10% risk reduction',
        timeline: 'Immediate',
        urgencyLevel: 'routine',
        specificToPatient: true,
        reasoning: 'Excessive alcohol raises BP, triglycerides, and risk of cardiomyopathy'
      });
    }

    return recs;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * BIOMARKER-SPECIFIC INTERVENTIONS
   * ═══════════════════════════════════════════════════════════════════════════
   */
  private getBiomarkerRecommendations(
    data: PatientData,
    features: ComprehensiveFeatures,
    riskLevel: string
  ): Recommendation[] {
    const recs: Recommendation[] = [];

    // HIGH LIPOPROTEIN(a)
    if (features.lipoproteinA > 30) {
      recs.push({
        priority: 2,
        category: 'medical',
        title: '🧬 Elevated Lipoprotein(a) - Genetic Risk Factor',
        description: `Your Lp(a) is ${features.lipoproteinA} mg/dL (high). This is a genetic risk factor common in Indians.`,
        action: 'Discuss with cardiologist: More aggressive LDL control (target <70), consider PCSK9 inhibitors, regular monitoring.',
        expectedImpact: 'Mitigate genetic risk with aggressive treatment',
        timeline: 'Discuss at next cardiology visit',
        urgencyLevel: 'important',
        specificToPatient: true,
        reasoning: 'High Lp(a) is independent genetic risk factor - requires aggressive LDL lowering'
      });
    }

    // HIGH hsCRP (INFLAMMATION)
    if (features.hscrp > 3) {
      recs.push({
        priority: 3,
        category: 'medical',
        title: '🔥 Elevated Inflammation Markers',
        description: `Your hsCRP is ${features.hscrp} mg/L (high). Indicates systemic inflammation.`,
        action: 'Anti-inflammatory approach: Statin therapy (has anti-inflammatory effect), aspirin if appropriate, omega-3 fatty acids, anti-inflammatory diet.',
        expectedImpact: '10-15% risk reduction by reducing inflammation',
        timeline: 'Within 1 month',
        urgencyLevel: 'routine',
        specificToPatient: true,
        reasoning: 'Inflammation accelerates atherosclerosis - reducing it lowers cardiovascular risk'
      });
    }

    // HIGH HOMOCYSTEINE
    if (features.homocysteine > 15) {
      recs.push({
        priority: 4,
        category: 'medical',
        title: '💊 Elevated Homocysteine - B Vitamin Deficiency',
        description: `Your homocysteine is ${features.homocysteine} μmol/L (high). Common in vegetarians.`,
        action: 'B vitamin supplementation: Folic acid (800μg/day), Vitamin B12 (1000μg/day), Vitamin B6 (50mg/day).',
        expectedImpact: '5-10% risk reduction',
        timeline: 'Start within 1 month',
        urgencyLevel: 'routine',
        specificToPatient: true,
        reasoning: 'High homocysteine damages blood vessels - B vitamins lower levels'
      });
    }

    return recs;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * INDIAN POPULATION-SPECIFIC RECOMMENDATIONS
   * ═══════════════════════════════════════════════════════════════════════════
   */
  private getIndianSpecificRecommendations(
    data: PatientData,
    features: ComprehensiveFeatures,
    riskLevel: string
  ): Recommendation[] {
    const recs: Recommendation[] = [];

    // LOWER BMI THRESHOLD
    if (features.bmi > 23 && features.bmi <= 25) {
      recs.push({
        priority: 3,
        category: 'lifestyle',
        title: '⚖️ Asian Overweight Range - Weight Management',
        description: `Your BMI is ${features.bmi.toFixed(1)}. For Asians, overweight starts at BMI 23. Target <23.`,
        action: 'Weight loss program targeting BMI <23: Diet modification, 150+ min/week exercise, portion control.',
        expectedImpact: '10-15% risk reduction',
        timeline: '3-6 month program',
        urgencyLevel: 'routine',
        specificToPatient: true,
        reasoning: 'Asians develop metabolic complications at lower BMI than other ethnicities'
      });
    }

    // VEGETARIAN DIET CONSIDERATIONS
    if (features.dietType === 'vegetarian') {
      recs.push({
        priority: 4,
        category: 'diet',
        title: '🥗 Vegetarian Diet Optimization',
        description: 'Vegetarian diet is protective, but ensure adequate B12, protein, and omega-3.',
        action: 'B12 supplementation (1000μg/day), plant protein sources (lentils, tofu), ALA omega-3 (flaxseed, walnuts).',
        expectedImpact: 'Maintain vegetarian diet benefits while preventing deficiencies',
        timeline: 'Start within 1 month',
        urgencyLevel: 'preventive',
        specificToPatient: true,
        reasoning: 'Vegetarian diet reduces risk but needs supplementation to prevent B12 deficiency'
      });
    }

    // SOUTH INDIAN SPECIFIC
    if (features.region === 'south') {
      recs.push({
        priority: 4,
        category: 'monitoring',
        title: '🌴 South Indian Population - Enhanced Screening',
        description: 'South Indians have higher CVD rates. More frequent screening recommended.',
        action: 'Annual lipid panel (vs 2-year for others), annual diabetes screening, BP check every 3 months.',
        expectedImpact: 'Early detection of risk factors',
        timeline: 'Ongoing',
        urgencyLevel: 'preventive',
        specificToPatient: true,
        reasoning: 'South Indians have highest CVD rates in India - enhanced surveillance needed'
      });
    }

    // YOGA & TRADITIONAL PRACTICES
    recs.push({
      priority: 5,
      category: 'exercise',
      title: '🧘 Yoga & Meditation for Heart Health',
      description: 'Indian traditional practices proven beneficial for cardiovascular health.',
      action: 'Regular yoga practice (3-5x/week): Pranayama (breathing), asanas (postures), meditation. Reduces stress, BP, inflammation.',
      expectedImpact: '10-15% risk reduction',
      timeline: 'Start within 1 month',
      urgencyLevel: 'preventive',
      specificToPatient: false,
      reasoning: 'Yoga shown to reduce BP, stress, improve autonomic balance - particularly relevant for Indian population'
    });

    return recs;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * HELPER METHODS
   * ═══════════════════════════════════════════════════════════════════════════
   */

  private determineOverallStrategy(riskLevel: string, riskScore: number): string {
    switch (riskLevel) {
      case 'very-high':
        return '🚨 EMERGENCY STRATEGY: Immediate medical intervention with aggressive pharmacotherapy, intensive lifestyle modification, and weekly monitoring. Goal: Prevent imminent cardiovascular event and reduce risk by 50%+ through comprehensive medical management.';
      case 'high':
        return '⚠️ URGENT INTERVENTION STRATEGY: Prompt medical evaluation within 1 week, initiate preventive medications (statin, BP control, ±aspirin), structured lifestyle program with professional guidance. Goal: Reduce risk to <20% within 6-12 months.';
      case 'medium':
        return '🎯 ACTIVE PREVENTION STRATEGY: Medical assessment within 1 month to optimize risk factors, consider preventive medications based on individual factors, intensive lifestyle modifications. Goal: Prevent progression and ideally reverse to low risk within 12 months.';
      case 'low':
        return '✅ MAINTENANCE STRATEGY: Continue current healthy lifestyle practices, regular monitoring to detect early changes, optimize prevention. Goal: Maintain low risk status throughout life with healthy habits and periodic screening.';
      default:
        return 'Personalized cardiovascular risk reduction strategy based on your individual risk profile.';
    }
  }

  private extractKeyPriorities(recommendations: Recommendation[]): string[] {
    // Extract top 3-5 priorities based on urgency and impact
    const urgent = recommendations
      .filter(r => r.priority <= 2)
      .map(r => r.title)
      .slice(0, 5);
    
    if (urgent.length === 0) {
      return recommendations.slice(0, 3).map(r => r.title);
    }
    
    return urgent;
  }

  private calculateEstimatedRiskReduction(recommendations: Recommendation[]): string {
    // Parse expected impact from recommendations and estimate total
    let totalReduction = 0;
    let hasEmergency = false;

    for (const rec of recommendations) {
      if (rec.urgencyLevel === 'emergency' || rec.urgencyLevel === 'urgent') {
        hasEmergency = true;
      }
      
      // Parse percentage from expectedImpact
      const match = rec.expectedImpact.match(/(\d+)-?(\d+)?%/);
      if (match) {
        const low = parseInt(match[1]);
        const high = match[2] ? parseInt(match[2]) : low;
        const avg = (low + high) / 2;
        totalReduction += avg * 0.5; // Weighted by likelihood of adherence
      }
    }

    if (totalReduction > 60) {
      return 'Up to 60-70% risk reduction possible with full adherence to recommendations';
    } else if (totalReduction > 40) {
      return `Up to ${Math.round(totalReduction)}% risk reduction possible with good adherence`;
    } else if (totalReduction > 20) {
      return `Up to ${Math.round(totalReduction)}% risk reduction expected`;
    } else {
      return 'Maintain current low risk status';
    }
  }

  private determineFollowUpSchedule(riskLevel: string): string {
    switch (riskLevel) {
      case 'very-high':
        return '📅 INTENSIVE MONITORING: Weekly visits first month → Bi-weekly next 2 months → Monthly thereafter. Daily home BP monitoring, monthly blood tests.';
      case 'high':
        return '📅 ENHANCED MONITORING: Bi-weekly visits first 2 months → Monthly for 6 months → Bi-monthly thereafter. Home BP monitoring 2x daily, quarterly blood tests.';
      case 'medium':
        return '📅 REGULAR MONITORING: Medical check-up every 2 months initially → Every 3 months after stabilization. Quarterly lipid panels, bi-annual comprehensive screening.';
      case 'low':
        return '📅 ROUTINE MONITORING: Annual comprehensive check-up, lipid panel every 2 years (or yearly if age >40), BP check every 6 months.';
      default:
        return 'Follow-up schedule based on your risk level and response to interventions.';
    }
  }
}

export const dynamicRecommendationEngine = new DynamicRecommendationEngine();
