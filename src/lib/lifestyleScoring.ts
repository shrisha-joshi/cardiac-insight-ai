/**
 * Comprehensive Lifestyle Risk Score Calculator
 * 
 * Integrates 4 key lifestyle dimensions:
 * 1. Sleep Quality Assessment (25% of lifestyle score)
 * 2. Stress Level Impact (25% of lifestyle score)
 * 3. Physical Activity Intensity (25% of lifestyle score)
 * 4. Diet Adherence Score (25% of lifestyle score)
 * 
 * Lifestyle factors weighted at 40% in final risk assessment
 * 
 * Based on:
 * - Framingham Heart Study lifestyle data
 * - INTERHEART risk reduction from lifestyle
 * - WHO cardiovascular disease prevention guidelines
 * - Indian dietary patterns and CVD associations
 * 
 * Expected accuracy improvement: +1%
 */

import { PatientData } from './mockData';

export interface LifestyleScore {
  sleepScore: number;              // 0-100
  stressScore: number;              // 0-100
  activityScore: number;             // 0-100
  dietScore: number;                 // 0-100
  overallLifestyleScore: number;     // 0-100 (weighted average)
  lifestyleRiskContribution: number; // 0-40 (contribution to final risk)
  lifestyleRating: 'excellent' | 'good' | 'moderate' | 'poor';
  recommendations: string[];
}

/**
 * Calculate sleep quality score (0-100, higher = better)
 * Based on duration + quality combination
 */
function calculateSleepScore(sleepHours?: number, sleepQuality?: number): number {
  if (!sleepHours) return 50; // Neutral if not provided

  let score = 50; // Base score

  // Duration assessment (optimal: 7-9 hours)
  if (sleepHours >= 7 && sleepHours <= 9) {
    score += 30;
  } else if (sleepHours >= 6 && sleepHours < 7) {
    score += 20;
  } else if (sleepHours > 9 && sleepHours <= 10) {
    score += 15;
  } else if (sleepHours >= 5 && sleepHours < 6) {
    score += 10;
  } else if (sleepHours < 5) {
    score -= 20; // Severe sleep deprivation
  } else if (sleepHours > 10) {
    score -= 15; // Excessive sleep
  }

  // Quality multiplier (if provided)
  if (sleepQuality) {
    const qualityFactor = sleepQuality / 10;
    score = score * qualityFactor;
  }

  // Normalize to 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculate stress level score (0-100, higher = better)
 * Inverse of stress level (1-10 scale becomes 100-10 score)
 */
function calculateStressScore(stressLevel?: number): number {
  if (!stressLevel) return 50; // Neutral if not provided

  // Convert 1-10 scale to 0-100 score (inverse)
  // Stress 1 (minimal) = 90 score
  // Stress 10 (severe) = 0 score
  const score = 100 - (stressLevel * 10);
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate physical activity score (0-100, higher = better)
 */
function calculateActivityScore(
  physicalActivity?: 'low' | 'moderate' | 'high',
  exerciseFrequency?: number
): number {
  let score = 50; // Base

  // Activity level assessment
  switch (physicalActivity) {
    case 'low':
      score = 30;
      break;
    case 'moderate':
      score = 65;
      break;
    case 'high':
      score = 80;
      break;
  }

  // Frequency boost (if available)
  if (exerciseFrequency) {
    if (exerciseFrequency >= 5) {
      score = Math.min(100, score + 20); // Very active
    } else if (exerciseFrequency >= 3) {
      score = Math.min(100, score + 10); // Moderately active
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate diet adherence score (0-100, higher = better)
 */
function calculateDietScore(
  dietType?: 'vegetarian' | 'non-vegetarian' | 'vegan',
  dietHabits?: string
): number {
  let score = 50; // Base

  // Diet type assessment
  switch (dietType) {
    case 'vegetarian':
      score = 70; // Vegetarian generally healthier for CVD
      break;
    case 'vegan':
      score = 80; // Vegan (if well-planned) is excellent
      break;
    case 'non-vegetarian':
      score = 50; // Neutral (depends on portion and type)
      break;
  }

  // Diet quality assessment from habits
  if (dietHabits) {
    const habitsLower = dietHabits.toLowerCase();

    // Positive habits
    if (habitsLower.includes('fruits') || habitsLower.includes('vegetable')) score += 10;
    if (habitsLower.includes('whole grain') || habitsLower.includes('whole wheat')) score += 10;
    if (habitsLower.includes('fish') || habitsLower.includes('omega')) score += 8;
    if (habitsLower.includes('nuts') || habitsLower.includes('seeds')) score += 8;
    if (habitsLower.includes('low fat') || habitsLower.includes('low salt')) score += 10;

    // Negative habits
    if (habitsLower.includes('fried') || habitsLower.includes('oil')) score -= 15;
    if (habitsLower.includes('salt') || habitsLower.includes('processed')) score -= 15;
    if (habitsLower.includes('sugar') || habitsLower.includes('sweets')) score -= 12;
    if (habitsLower.includes('fast food') || habitsLower.includes('junk')) score -= 15;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate lifestyle recommendations based on scores
 */
function generateLifestyleRecommendations(
  sleepScore: number,
  stressScore: number,
  activityScore: number,
  dietScore: number,
  patientData: PatientData
): string[] {
  const recommendations: string[] = [];

  // Sleep recommendations
  if (sleepScore < 50) {
    recommendations.push('😴 **Sleep Priority:** Aim for 7-9 hours nightly. Sleep is crucial for cardiac health. Try: consistent sleep schedule, dark/cool room, avoid screens 1 hour before bed');
  } else if (sleepScore < 70) {
    recommendations.push('😴 **Improve Sleep Quality:** Increase to 7-9 hours consistently. Consider sleep hygiene: no caffeine after 3pm, regular exercise');
  }

  // Stress recommendations
  if (stressScore < 40) {
    recommendations.push('🧘 **Urgent Stress Management:** Your stress levels are affecting cardiac health. Action items: (1) Daily meditation/yoga 15 min, (2) Talk therapy/counseling, (3) Hobbies and relaxation');
  } else if (stressScore < 60) {
    recommendations.push('🧘 **Reduce Stress:** Implement daily stress relief: yoga, meditation, breathing exercises, mindfulness');
  }

  // Activity recommendations
  if (activityScore < 40) {
    recommendations.push('🏃 **Start Moving:** Sedentary lifestyle dramatically increases CVD risk. Begin with: daily 15-min walks, gradually increase to 30 min, 5 days/week');
  } else if (activityScore < 60) {
    recommendations.push('🏃 **Increase Activity:** Target 150 min moderate activity/week. Options: brisk walking, swimming, cycling, dancing');
  } else if (activityScore < 80) {
    recommendations.push('🏃 **Maintain Activity:** Continue regular exercise. Add strength training 2x/week for added cardiovascular benefit');
  }

  // Diet recommendations
  if (dietScore < 50) {
    recommendations.push('🥗 **Critical Diet Changes:** Current diet significantly increases CVD risk. (1) Increase vegetables/fruits to 5 servings daily, (2) Reduce salt to <5g/day, (3) Eliminate fried foods, (4) Choose whole grains');
  } else if (dietScore < 70) {
    recommendations.push('🥗 **Improve Diet Quality:** (1) Increase fiber (whole grains, legumes), (2) Use heart-healthy oils (coconut oil sparingly, olive oil), (3) Reduce processed foods, (4) Include fish 2x/week');
  }

  // Region-specific dietary advice
  if (patientData.region === 'north') {
    recommendations.push('🧂 **North India Specific:** Reduce salt intake from traditional recipes. Use herbs for flavor instead of salt. Limit ghee/butter to 2-3 tsp/day');
  } else if (patientData.region === 'south') {
    recommendations.push('🥥 **South India Specific:** Moderate coconut oil (2-3 tsp/day). Include bananas/beans for potassium. Increase fish consumption');
  } else if (patientData.region === 'west') {
    recommendations.push('🛑 **West India Specific:** Limit processed foods. Choose traditional foods over Western diet patterns. Manage urban stress with daily relaxation');
  }

  // Mental health integration
  if (patientData.hasMentalHealthIssues) {
    recommendations.push('💭 **Mental Health Support:** Depression/anxiety significantly increases CVD risk. Ensure: (1) Regular therapy sessions, (2) Possible medication review, (3) Lifestyle modifications, (4) Support group participation');
  }

  return recommendations;
}

/**
 * Calculate comprehensive lifestyle score
 */
export function calculateLifestyleScore(patientData: PatientData): LifestyleScore {
  // Calculate individual component scores
  const sleepScore = calculateSleepScore(patientData.sleepHours, patientData.sleepQuality);
  const stressScore = calculateStressScore(patientData.stressLevel);
  const activityScore = calculateActivityScore(patientData.physicalActivity, patientData.exerciseFrequency);
  const dietScore = calculateDietScore(patientData.dietType, patientData.dietHabits);

  // Calculate overall lifestyle score (equal weighting: 25% each)
  const overallLifestyleScore = Math.round(
    (sleepScore * 0.25 + stressScore * 0.25 + activityScore * 0.25 + dietScore * 0.25)
  );

  // Determine lifestyle rating
  let lifestyleRating: 'excellent' | 'good' | 'moderate' | 'poor';
  if (overallLifestyleScore >= 80) {
    lifestyleRating = 'excellent';
  } else if (overallLifestyleScore >= 60) {
    lifestyleRating = 'good';
  } else if (overallLifestyleScore >= 40) {
    lifestyleRating = 'moderate';
  } else {
    lifestyleRating = 'poor';
  }

  // Calculate risk contribution (0-40, lower lifestyle score = higher risk contribution)
  // Formula: (100 - overallLifestyleScore) * 0.4
  const lifestyleRiskContribution = Math.round((100 - overallLifestyleScore) * 0.4);

  // Generate personalized recommendations
  const recommendations = generateLifestyleRecommendations(
    sleepScore,
    stressScore,
    activityScore,
    dietScore,
    patientData
  );

  return {
    sleepScore,
    stressScore,
    activityScore,
    dietScore,
    overallLifestyleScore,
    lifestyleRiskContribution,
    lifestyleRating,
    recommendations
  };
}

/**
 * Generate detailed lifestyle explanation
 */
export function generateLifestyleExplanation(lifestyleScore: LifestyleScore): string {
  let explanation = '🏥 **Comprehensive Lifestyle Assessment**\n\n';

  explanation += `### Overall Lifestyle Score: ${lifestyleScore.overallLifestyleScore}/100 (${lifestyleScore.lifestyleRating.toUpperCase()})\n\n`;

  explanation += `### Component Scores\n`;
  explanation += `- **Sleep Quality:** ${lifestyleScore.sleepScore}/100 - ${getSleepRating(lifestyleScore.sleepScore)}\n`;
  explanation += `- **Stress Management:** ${lifestyleScore.stressScore}/100 - ${getStressRating(lifestyleScore.stressScore)}\n`;
  explanation += `- **Physical Activity:** ${lifestyleScore.activityScore}/100 - ${getActivityRating(lifestyleScore.activityScore)}\n`;
  explanation += `- **Diet Quality:** ${lifestyleScore.dietScore}/100 - ${getDietRating(lifestyleScore.dietScore)}\n\n`;

  explanation += `### Cardiovascular Impact\n`;
  explanation += `Your lifestyle factors contribute **${lifestyleScore.lifestyleRiskContribution}% to your overall cardiac risk**. `;
  if (lifestyleScore.lifestyleRiskContribution > 20) {
    explanation += `This is significant - lifestyle modifications could reduce your risk by **${lifestyleScore.lifestyleRiskContribution}%**!\n\n`;
  } else if (lifestyleScore.lifestyleRiskContribution > 10) {
    explanation += `This is moderate - focused lifestyle changes could reduce your risk by **${lifestyleScore.lifestyleRiskContribution}%**.\n\n`;
  } else {
    explanation += `You maintain good lifestyle habits that protect your heart.\n\n`;
  }

  explanation += `### Personalized Action Plan\n`;
  lifestyleScore.recommendations.forEach((rec, idx) => {
    explanation += `${idx + 1}. ${rec}\n`;
  });

  return explanation;
}

/**
 * Helper functions for rating descriptions
 */
function getSleepRating(score: number): string {
  if (score >= 80) return 'Excellent - optimal sleep duration and quality';
  if (score >= 60) return 'Good - healthy sleep habits';
  if (score >= 40) return 'Fair - could improve sleep';
  return 'Poor - significant sleep issues affecting health';
}

function getStressRating(score: number): string {
  if (score >= 80) return 'Excellent - well-managed stress';
  if (score >= 60) return 'Good - manageable stress levels';
  if (score >= 40) return 'Moderate - elevated stress requiring attention';
  return 'High - significant stress affecting cardiac health';
}

function getActivityRating(score: number): string {
  if (score >= 80) return 'Excellent - very active lifestyle';
  if (score >= 60) return 'Good - adequate physical activity';
  if (score >= 40) return 'Moderate - increasing activity recommended';
  return 'Low - sedentary lifestyle increases CVD risk';
}

function getDietRating(score: number): string {
  if (score >= 80) return 'Excellent - heart-healthy diet';
  if (score >= 60) return 'Good - generally healthy eating';
  if (score >= 40) return 'Fair - some dietary improvements needed';
  return 'Poor - high-risk dietary patterns';
}

/**
 * Calculate potential risk reduction from lifestyle changes
 */
export function calculatePotentialRiskReduction(
  currentLifestyleScore: LifestyleScore,
  improvementAreas: ('sleep' | 'stress' | 'activity' | 'diet')[]
): {
  currentRiskContribution: number;
  projectedRiskContribution: number;
  potentialReduction: number;
  improvementTimeline: string;
} {
  let projectedScore = currentLifestyleScore.overallLifestyleScore;

  // Project improvements
  improvementAreas.forEach(area => {
    switch (area) {
      case 'sleep':
        if (currentLifestyleScore.sleepScore < 80) {
          projectedScore += Math.min(80 - currentLifestyleScore.sleepScore, 15) * 0.25;
        }
        break;
      case 'stress':
        if (currentLifestyleScore.stressScore < 80) {
          projectedScore += Math.min(80 - currentLifestyleScore.stressScore, 15) * 0.25;
        }
        break;
      case 'activity':
        if (currentLifestyleScore.activityScore < 80) {
          projectedScore += Math.min(80 - currentLifestyleScore.activityScore, 15) * 0.25;
        }
        break;
      case 'diet':
        if (currentLifestyleScore.dietScore < 80) {
          projectedScore += Math.min(80 - currentLifestyleScore.dietScore, 15) * 0.25;
        }
        break;
    }
  });

  projectedScore = Math.min(100, projectedScore);

  const currentRisk = currentLifestyleScore.lifestyleRiskContribution;
  const projectedRisk = Math.round((100 - projectedScore) * 0.4);
  const potentialReduction = currentRisk - projectedRisk;

  let improvementTimeline = '';
  if (improvementAreas.length >= 3) {
    improvementTimeline = '3-6 months with consistent effort';
  } else if (improvementAreas.length === 2) {
    improvementTimeline = '2-4 months of dedicated lifestyle changes';
  } else {
    improvementTimeline = '4-8 weeks for noticeable improvements';
  }

  return {
    currentRiskContribution: currentRisk,
    projectedRiskContribution: projectedRisk,
    potentialReduction,
    improvementTimeline
  };
}
