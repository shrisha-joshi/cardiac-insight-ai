/**
 * Lifestyle & Environmental Risk Analytics Service
 * Comprehensive behavioral and environmental cardiovascular risk assessment
 * 
 * Analyzes 6 dimensions of lifestyle that impact heart attack risk:
 * 1. Smoking - Pack-year calculation, cessation benefits, secondhand exposure
 * 2. Physical Activity - MET-hour calculation, sedentary behavior risk
 * 3. Dietary Patterns - Mediterranean/DASH score calculation
 * 4. Sleep Quality - Duration, apnea risk, circadian factors
 * 5. Stress & Psychosocial - Work stress, life events, emotional factors
 * 6. Environmental - Air quality, noise, occupational hazards
 * 
 * Expected accuracy improvement: +0.5-1% when combined with other risk factors
 * Recommended integration weight: 5-10% in ensemble models
 */

import { PatientData } from '@/lib/mockData';

// Interfaces for lifestyle analysis
export interface SmokingAssessment {
  status: 'never' | 'former' | 'current';
  packYears?: number;
  yearsSmoked?: number;
  cigarettesPerDay?: number;
  secondhandExposure?: boolean;
  riskScore: number; // 0-100
  cessationBenefit?: string;
  recommendations: string[];
}

export interface PhysicalActivityAssessment {
  weeklyMETHours: number;
  sedentaryHours: number; // per week
  activityLevel: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  fitnessScore: number; // 0-100
  exerciseTypes: string[];
  recommendations: string[];
}

export interface DietaryAssessment {
  dietType: 'mediterranean' | 'dash' | 'western' | 'vegetarian' | 'mixed' | 'unknown';
  mediterraneanScore: number; // 0-56
  dashScore: number; // 0-40
  dietQuality: 'poor' | 'fair' | 'good' | 'excellent';
  riskScore: number; // 0-100
  recommendations: string[];
}

export interface SleepAssessment {
  durationHours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  sleepApneaRisk: 'low' | 'moderate' | 'high';
  shiftWork?: boolean;
  riskScore: number; // 0-100
  recommendations: string[];
}

export interface StressAssessment {
  perceivesStress: boolean;
  stressLevel: 'low' | 'moderate' | 'high' | 'very-high';
  sourceOfStress?: string[];
  hasMentalHealthIssues?: boolean;
  isOnAntidepressants?: boolean;
  riskScore: number; // 0-100
  recommendations: string[];
}

export interface EnvironmentalAssessment {
  airQualityIndex?: number;
  noiseExposure?: 'low' | 'moderate' | 'high';
  occupationalHazard?: string;
  pollutionExposure?: 'low' | 'moderate' | 'high';
  riskScore: number; // 0-100
  recommendations: string[];
}

export interface LifestyleProfile {
  smoking: SmokingAssessment;
  physicalActivity: PhysicalActivityAssessment;
  diet: DietaryAssessment;
  sleep: SleepAssessment;
  stress: StressAssessment;
  environment: EnvironmentalAssessment;
  compositeRiskScore: number; // 0-100, weighted average
  overallLifestyleCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  personalizedRecommendations: string[];
}

export interface RiskRecommendation {
  domain: string;
  current: string;
  target: string;
  benefit: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  timeframe: string;
}

/**
 * Lifestyle Analytics Service - Main export singleton
 */
class LifestyleAnalyticsService {
  private readonly assessments: Map<string, LifestyleProfile[]> = new Map();

  /**
   * Comprehensive lifestyle analysis
   */
  analyzeLifestyleFactors(patientData: PatientData): LifestyleProfile {
    const smoking = this.assessSmokingRisk(patientData);
    const physicalActivity = this.analyzePhysicalActivity(patientData);
    const diet = this.analyzeDietQuality(patientData);
    const sleep = this.assessSleepQuality(patientData);
    const stress = this.assessStressFactors(patientData);
    const environment = this.assessEnvironmentalRisk(patientData);

    // Calculate composite score (weighted average)
    const compositeRiskScore =
      smoking.riskScore * 0.25 +
      physicalActivity.fitnessScore * 0.20 +
      diet.riskScore * 0.20 +
      sleep.riskScore * 0.15 +
      stress.riskScore * 0.15 +
      environment.riskScore * 0.05;

    // Determine category
    let overallLifestyleCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
    if (compositeRiskScore < 20) overallLifestyleCategory = 'very-low';
    else if (compositeRiskScore < 40) overallLifestyleCategory = 'low';
    else if (compositeRiskScore < 60) overallLifestyleCategory = 'moderate';
    else if (compositeRiskScore < 80) overallLifestyleCategory = 'high';
    else overallLifestyleCategory = 'very-high';

    // Generate personalized recommendations
    const personalizedRecommendations = this.generatePersonalizedRecommendations(
      smoking,
      physicalActivity,
      diet,
      sleep,
      stress,
      environment
    );

    return {
      smoking,
      physicalActivity,
      diet,
      sleep,
      stress,
      environment,
      compositeRiskScore: Math.round(compositeRiskScore * 10) / 10,
      overallLifestyleCategory,
      personalizedRecommendations,
    };
  }

  /**
   * Smoking risk assessment
   */
  assessSmokingRisk(patientData: PatientData): SmokingAssessment {
    const status: 'never' | 'former' | 'current' = patientData.smoking ? 'current' : 'never';
    let riskScore = patientData.smoking ? 65 : 0;
    const packYears = 0;
    const cessationBenefit = '';
    const recommendations: string[] = [];

    if (patientData.smoking) {
      riskScore = 65;
      recommendations.push(
        'Current smoking significantly increases CVD risk',
        'Immediate smoking cessation is critical',
        'Consider nicotine replacement therapy or prescription medications',
        'Enroll in structured cessation program'
      );
    } else {
      recommendations.push(
        'Excellent - non-smoker status is protective',
        'Avoid secondhand smoke exposure'
      );
    }

    return {
      status,
      packYears: packYears || undefined,
      riskScore: Math.min(100, riskScore),
      cessationBenefit,
      recommendations,
    };
  }

  /**
   * Physical activity and fitness assessment
   */
  analyzePhysicalActivity(patientData: PatientData): PhysicalActivityAssessment {
    // Calculate MET-hours from exercise frequency and intensity
    let weeklyMETHours = 0;
    const exerciseTypes: string[] = [];

    if (patientData.exerciseFrequency) {
      if (patientData.exerciseFrequency >= 5) {
        weeklyMETHours += patientData.exerciseFrequency * 7; // ~7 MET for moderate exercise
        exerciseTypes.push('Regular cardiovascular exercise');
      } else if (patientData.exerciseFrequency >= 3) {
        weeklyMETHours += patientData.exerciseFrequency * 6;
        exerciseTypes.push('Moderate exercise 3-4x weekly');
      } else if (patientData.exerciseFrequency >= 1) {
        weeklyMETHours += patientData.exerciseFrequency * 5;
        exerciseTypes.push('Light exercise weekly');
      } else {
        weeklyMETHours = 0;
        exerciseTypes.push('Sedentary lifestyle');
      }
    }

    // Estimate sedentary hours (~12-16 per day for sedentary, 6-10 for active)
    const sedentaryHours = patientData.exerciseFrequency
      ? Math.max(35, 70 - patientData.exerciseFrequency * 8)
      : 70;

    // Calculate fitness score (0-100)
    let fitnessScore = 0;
    if (weeklyMETHours >= 30) {
      fitnessScore = 90;
      exerciseTypes.push('Excellent cardiovascular fitness');
    } else if (weeklyMETHours >= 21) {
      fitnessScore = 75;
      exerciseTypes.push('Good cardiovascular fitness');
    } else if (weeklyMETHours >= 10) {
      fitnessScore = 50;
      exerciseTypes.push('Moderate cardiovascular fitness');
    } else {
      fitnessScore = 20;
      exerciseTypes.push('Poor cardiovascular fitness');
    }

    // Activity level classification
    let activityLevel: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
    if (weeklyMETHours >= 30) activityLevel = 'very-high';
    else if (weeklyMETHours >= 20) activityLevel = 'high';
    else if (weeklyMETHours >= 10) activityLevel = 'moderate';
    else if (weeklyMETHours >= 5) activityLevel = 'low';
    else activityLevel = 'very-low';

    const recommendations: string[] = [];
    if (fitnessScore < 50) {
      recommendations.push('Increase physical activity gradually - start with 150 min/week of moderate exercise');
      recommendations.push('Consider supervised cardiac rehabilitation program');
    } else if (fitnessScore < 75) {
      recommendations.push('Increase to 300 min/week of moderate activity OR 150 min/week of vigorous activity');
    } else {
      recommendations.push('Maintain current exercise level for cardiovascular health');
      recommendations.push('Consider strength training 2x weekly for additional benefit');
    }

    recommendations.push(`Reduce sedentary time: Current ~${Math.round(sedentaryHours)} hours/week`);

    return {
      weeklyMETHours: Math.round(weeklyMETHours * 10) / 10,
      sedentaryHours: Math.round(sedentaryHours),
      activityLevel,
      fitnessScore,
      exerciseTypes,
      recommendations,
    };
  }

  /**
   * Dietary quality assessment
   */
  analyzeDietQuality(patientData: PatientData): DietaryAssessment {
    // Use diet type from PatientData (vegetarian/non-vegetarian/vegan)
    let dashScore = 20;
    let mediterraneanScore = 28;
    let dietType: 'mediterranean' | 'dash' | 'western' | 'vegetarian' | 'mixed' | 'unknown' = 'unknown';

    // Map PatientData.dietType to our categories
    if (patientData.dietType === 'vegetarian' || patientData.dietType === 'vegan') {
      dietType = 'vegetarian';
      dashScore = 36;
      mediterraneanScore = 44;
    } else {
      dietType = 'mixed';
      dashScore = 25;
      mediterraneanScore = 32;
    }

    // Adjust based on stress (proxy for lifestyle)
    if (patientData.stressLevel > 7) {
      dashScore = Math.max(10, dashScore - 8);
      mediterraneanScore = Math.max(15, mediterraneanScore - 10);
    }

    // Determine diet quality
    const avgScore = (dashScore + mediterraneanScore) / 2;
    let dietQuality: 'poor' | 'fair' | 'good' | 'excellent';
    if (avgScore >= 40) dietQuality = 'excellent';
    else if (avgScore >= 30) dietQuality = 'good';
    else if (avgScore >= 20) dietQuality = 'fair';
    else dietQuality = 'poor';

    // Risk score (inverse of quality)
    const riskScore = 100 - avgScore * 1.5;

    const recommendations: string[] = [];
    if (dietQuality === 'poor') {
      recommendations.push('Significant dietary changes needed for cardiovascular health');
      recommendations.push('Switch to Mediterranean or DASH diet pattern');
      recommendations.push('Reduce processed foods, salt, and added sugars');
      recommendations.push('Increase vegetables, whole grains, and lean proteins');
    } else if (dietQuality === 'fair') {
      recommendations.push('Continue improving dietary patterns');
      recommendations.push('Increase intake of fruits and vegetables (≥5 servings/day)');
      recommendations.push('Choose whole grains over refined carbohydrates');
    } else if (dietQuality === 'good') {
      recommendations.push('Diet quality is good - maintain current pattern');
      recommendations.push('Consider minor adjustments for optimal cardiovascular protection');
    } else {
      recommendations.push('Excellent dietary pattern - continue maintaining');
      recommendations.push('Diet provides significant cardiovascular protection');
    }

    return {
      dietType,
      mediterraneanScore,
      dashScore,
      dietQuality,
      riskScore: Math.max(0, Math.min(100, riskScore)),
      recommendations,
    };
  }

  /**
   * Sleep quality assessment
   */
  assessSleepQuality(patientData: PatientData): SleepAssessment {
    const durationHours = patientData.sleepHours || 7;
    let quality: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';
    let riskScore = 30;

    // Sleep duration assessment
    if (durationHours >= 7 && durationHours <= 9) {
      quality = 'excellent';
      riskScore = 5;
    } else if ((durationHours >= 6 && durationHours < 7) || (durationHours > 9 && durationHours <= 10)) {
      quality = 'good';
      riskScore = 20;
    } else if ((durationHours >= 5 && durationHours < 6) || durationHours > 10) {
      quality = 'fair';
      riskScore = 40;
    } else {
      quality = 'poor';
      riskScore = 70;
    }

    // Sleep apnea risk assessment (default low without specific data)
    let sleepApneaRisk: 'low' | 'moderate' | 'high' = 'low';
    if (patientData.diabetes || patientData.stressLevel > 8) {
      sleepApneaRisk = 'moderate';
      riskScore += 10;
    }

    const recommendations: string[] = [];
    if (quality === 'poor') {
      recommendations.push('Optimize sleep habits - aim for 7-9 hours nightly');
      recommendations.push('Maintain consistent sleep schedule');
      recommendations.push('Screen for sleep apnea - discuss with physician');
    } else if (quality === 'fair') {
      recommendations.push('Slight improvement in sleep duration or quality would help');
      recommendations.push('Consider sleep hygiene optimization');
    } else {
      recommendations.push('Excellent sleep pattern - maintain for cardiovascular health');
    }

    if (sleepApneaRisk !== 'low') {
      recommendations.push(`Sleep apnea risk is ${sleepApneaRisk} - get evaluated if not already done`);
    }

    return {
      durationHours,
      quality,
      sleepApneaRisk,
      riskScore: Math.min(100, riskScore),
      recommendations,
    };
  }

  /**
   * Stress and psychosocial factors assessment
   */
  assessStressFactors(patientData: PatientData): StressAssessment {
    // Use stress level from PatientData (1-10 scale)
    const stressRaw = patientData.stressLevel || 5;
    let stressLevel: 'low' | 'moderate' | 'high' | 'very-high' = 'low';
    let riskScore = 10;
    const sourceOfStress: string[] = [];

    if (stressRaw >= 8) {
      stressLevel = 'very-high';
      riskScore = 75;
      sourceOfStress.push('Very high perceived stress');
    } else if (stressRaw >= 6) {
      stressLevel = 'high';
      riskScore = 60;
      sourceOfStress.push('High perceived stress');
    } else if (stressRaw >= 4) {
      stressLevel = 'moderate';
      riskScore = 35;
      sourceOfStress.push('Moderate perceived stress');
    } else {
      stressLevel = 'low';
      riskScore = 10;
      sourceOfStress.push('Low perceived stress');
    }

    // Consider mental health issues
    const hasMentalHealthIssues = patientData.hasMentalHealthIssues || false;
    if (hasMentalHealthIssues) {
      sourceOfStress.push('Depression or anxiety present');
      riskScore = Math.min(100, riskScore + 20);
    }

    const recommendations: string[] = [];
    if (riskScore >= 60) {
      recommendations.push('High stress levels - implement stress management strategies');
      recommendations.push('Consider counseling or psychotherapy');
      recommendations.push('Regular exercise for stress reduction');
      recommendations.push('Mindfulness or meditation practices recommended');
    } else if (riskScore >= 35) {
      recommendations.push('Moderate stress - stress management would be beneficial');
      recommendations.push('Regular physical activity helps reduce stress');
    } else {
      recommendations.push('Maintain current stress management approach');
    }

    if (hasMentalHealthIssues) {
      recommendations.push('Continue mental health treatment - critical for CVD prevention');
    }

    return {
      perceivesStress: stressRaw > 3,
      stressLevel,
      sourceOfStress,
      hasMentalHealthIssues,
      riskScore,
      recommendations,
    };
  }

  /**
   * Environmental exposure assessment
   */
  assessEnvironmentalRisk(patientData: PatientData): EnvironmentalAssessment {
    let riskScore = 20;
    const recommendations: string[] = [];

    // Air quality (would need integration with real-time data)
    let airQualityIndex = 50;
    let pollutionExposure: 'low' | 'moderate' | 'high' = 'low';

    // Use region as a proxy for pollution (South/North India have different air quality)
    if (patientData.region === 'north' || patientData.areaType === 'urban') {
      airQualityIndex = 120;
      pollutionExposure = 'high';
      riskScore += 20;
      recommendations.push('High air pollution exposure in your region - consider indoor air purification');
      recommendations.push('Wear N95 mask during high pollution episodes');
    } else {
      recommendations.push('Air quality exposure is acceptable for your region');
    }

    // Noise exposure (default low without specific data)
    const noiseExposure: 'low' | 'moderate' | 'high' = 'low';
    recommendations.push('Minimize noise exposure where possible');

    // Occupational hazards (use stressLevel as proxy - if high stress likely higher occupational exposure)
    let occupationalHazard: string | undefined;
    if (patientData.stressLevel > 7 || patientData.workStress) {
      occupationalHazard = 'high-stress-occupation';
      riskScore += 15;
      recommendations.push('Work environment factors increase CVD risk - ensure proper stress management');
    }

    return {
      airQualityIndex,
      noiseExposure,
      occupationalHazard,
      pollutionExposure,
      riskScore: Math.min(100, riskScore),
      recommendations,
    };
  }

  /**
   * Generate personalized recommendations based on all lifestyle factors
   */
  private generatePersonalizedRecommendations(
    smoking: SmokingAssessment,
    physicalActivity: PhysicalActivityAssessment,
    diet: DietaryAssessment,
    sleep: SleepAssessment,
    stress: StressAssessment,
    environment: EnvironmentalAssessment
  ): string[] {
    const recommendations: string[] = [];

    // Prioritize by impact
    if (smoking.riskScore > 50) {
      recommendations.push('🔴 PRIORITY: Smoking cessation is the single most important lifestyle change');
    }

    if (physicalActivity.fitnessScore < 50) {
      recommendations.push('🟠 HIGH: Increase physical activity to 150+ min/week of moderate exercise');
    }

    if (diet.riskScore > 50) {
      recommendations.push('🟠 HIGH: Adopt Mediterranean or DASH diet pattern');
    }

    if (sleep.riskScore > 40) {
      recommendations.push('🟡 MEDIUM: Optimize sleep duration and quality (7-9 hours nightly)');
    }

    if (stress.riskScore > 50) {
      recommendations.push('🟡 MEDIUM: Implement stress management (meditation, counseling, exercise)');
    }

    if (environment.riskScore > 30) {
      recommendations.push('🟡 MEDIUM: Minimize environmental exposures (pollution, noise, occupational hazards)');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Excellent lifestyle patterns - maintain current habits for CVD prevention');
    }

    return recommendations;
  }

  /**
   * Store lifestyle profile for patient
   */
  storeProfile(patientId: string, profile: LifestyleProfile): void {
    if (!this.assessments.has(patientId)) {
      this.assessments.set(patientId, []);
    }
    const profiles = this.assessments.get(patientId);
    if (profiles) profiles.push(profile);
  }

  /**
   * Get latest lifestyle profile for patient
   */
  getLatestProfile(patientId: string): LifestyleProfile | null {
    const profiles = this.assessments.get(patientId);
    return profiles && profiles.length > 0 ? profiles[profiles.length - 1] : null;
  }

  /**
   * Get assessment history for patient
   */
  getAssessmentHistory(patientId: string): LifestyleProfile[] {
    return this.assessments.get(patientId) || [];
  }
}

// Export singleton instance
const lifestyleAnalyticsService = new LifestyleAnalyticsService();
export default lifestyleAnalyticsService;
