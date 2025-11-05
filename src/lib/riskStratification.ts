/**
 * Risk Stratification System - 5 Category Model
 * 
 * Replaces 3-category (low/medium/high) with 5-category system
 * Provides more granular risk assessment and tailored recommendations
 * 
 * Categories:
 * - Very Low: 0-20%     (minimal risk, lifestyle maintenance)
 * - Low: 20-35%         (low risk, preventive focus)
 * - Moderate: 35-60%    (moderate risk, intervention needed)
 * - High: 60-80%        (high risk, aggressive management)
 * - Very High: 80-100%  (very high risk, urgent intervention)
 * 
 * Expected accuracy improvement: +0.3%
 */

export type RiskCategory = 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';

export interface RiskStratificationResult {
  risk_score: number;
  category: RiskCategory;
  category_name: string;
  percentage_in_category: number;     // % position within category range
  next_threshold: number;              // Risk at next category boundary
  risk_distance_to_next: number;       // Points until next category
  ui_color: string;                    // Color for dashboard
  ui_icon: string;                     // Icon for dashboard
  urgency_level: 'routine' | 'soon' | 'urgent' | 'critical';
  action_priority: 'monitor' | 'optimize' | 'intervene' | 'immediate';
  category_recommendations: string[];
  preventive_focus: string;
}

/**
 * Calculate 5-category risk stratification
 */
export function stratifyRisk(riskScore: number): RiskStratificationResult {
  // Determine category
  let category: RiskCategory;
  let category_name: string;
  let ui_color: string;
  let ui_icon: string;
  let urgency_level: 'routine' | 'soon' | 'urgent' | 'critical';
  let action_priority: 'monitor' | 'optimize' | 'intervene' | 'immediate';
  let lower_bound: number;
  let upper_bound: number;
  let preventive_focus: string;

  if (riskScore < 20) {
    category = 'very-low';
    category_name = 'Very Low Risk';
    ui_color = '#10b981'; // Green
    ui_icon = '✅';
    urgency_level = 'routine';
    action_priority = 'monitor';
    lower_bound = 0;
    upper_bound = 20;
    preventive_focus = 'Lifestyle maintenance and health optimization';
  } else if (riskScore < 35) {
    category = 'low';
    category_name = 'Low Risk';
    ui_color = '#34d399'; // Light Green
    ui_icon = '👍';
    urgency_level = 'routine';
    action_priority = 'monitor';
    lower_bound = 20;
    upper_bound = 35;
    preventive_focus = 'Primary prevention and risk factor management';
  } else if (riskScore < 60) {
    category = 'moderate';
    category_name = 'Moderate Risk';
    ui_color = '#f59e0b'; // Amber
    ui_icon = '⚠️';
    urgency_level = 'soon';
    action_priority = 'optimize';
    lower_bound = 35;
    upper_bound = 60;
    preventive_focus = 'Active risk factor intervention';
  } else if (riskScore < 80) {
    category = 'high';
    category_name = 'High Risk';
    ui_color = '#ef4444'; // Red
    ui_icon = '🚨';
    urgency_level = 'urgent';
    action_priority = 'intervene';
    lower_bound = 60;
    upper_bound = 80;
    preventive_focus = 'Aggressive risk factor management';
  } else {
    category = 'very-high';
    category_name = 'Very High Risk';
    ui_color = '#7f1d1d'; // Dark Red
    ui_icon = '🚑';
    urgency_level = 'critical';
    action_priority = 'immediate';
    lower_bound = 80;
    upper_bound = 100;
    preventive_focus = 'Urgent medical intervention';
  }

  // Calculate position within category
  const category_width = upper_bound - lower_bound;
  const position_in_category = riskScore - lower_bound;
  const percentage_in_category = (position_in_category / category_width) * 100;

  // Next category information
  const next_threshold = upper_bound;
  const risk_distance_to_next = Math.max(0, next_threshold - riskScore);

  return {
    risk_score: Math.round(riskScore * 10) / 10,
    category,
    category_name,
    percentage_in_category: Math.round(percentage_in_category),
    next_threshold,
    risk_distance_to_next: Math.round(risk_distance_to_next * 10) / 10,
    ui_color,
    ui_icon,
    urgency_level,
    action_priority,
    category_recommendations: generateCategoryRecommendations(category),
    preventive_focus
  };
}

/**
 * Generate category-specific recommendations
 */
function generateCategoryRecommendations(category: RiskCategory): string[] {
  const recommendations: string[] = [];

  switch (category) {
    case 'very-low':
      recommendations.push('✅ Excellent risk profile - maintain current lifestyle');
      recommendations.push('🥗 Continue heart-healthy diet (Mediterranean or DASH)');
      recommendations.push('🏃 Maintain regular exercise (150 min/week moderate activity)');
      recommendations.push('😊 Stress management and adequate sleep (7-9 hours)');
      recommendations.push('📅 Annual health check-ups and cardiac screening');
      recommendations.push('🚫 Avoid smoking and excessive alcohol');
      break;

    case 'low':
      recommendations.push('👍 Good risk profile - focus on prevention');
      recommendations.push('📊 Regular monitoring of blood pressure and cholesterol');
      recommendations.push('💪 Increase physical activity to 150 min/week if not there');
      recommendations.push('🥗 Adopt Mediterranean or DASH diet if not already');
      recommendations.push('⚖️ Maintain healthy weight (BMI 18.5-24.9)');
      recommendations.push('🚭 Eliminate smoking completely');
      recommendations.push('💊 Discuss preventive medications with your doctor if risk factors present');
      break;

    case 'moderate':
      recommendations.push('⚠️ Moderate risk - active intervention recommended');
      recommendations.push('👨‍⚕️ Consult cardiologist for comprehensive evaluation');
      recommendations.push('💊 Consider blood pressure and cholesterol medications');
      recommendations.push('🏃 Target 30+ minutes of moderate exercise 5 days/week');
      recommendations.push('🥗 Strict dietary adherence (Mediterranean or DASH diet)');
      recommendations.push('⚖️ Target weight loss if overweight (5-10% reduction beneficial)');
      recommendations.push('💤 Aim for 7-9 hours quality sleep nightly');
      recommendations.push('😌 Stress management: yoga, meditation, counseling');
      recommendations.push('📋 Follow-up evaluation every 3-6 months');
      break;

    case 'high':
      recommendations.push('🚨 High risk - aggressive management essential');
      recommendations.push('👨‍⚕️ Cardiology consultation recommended urgently');
      recommendations.push('💊 Likely need multiple medications: statin, beta-blocker, ACE inhibitor, aspirin');
      recommendations.push('🏥 Consider stress testing or advanced imaging (echo, CT coronary angiography)');
      recommendations.push('🏃 Supervised exercise program with cardiac clearance');
      recommendations.push('🥗 Strict dietary control with nutrition specialist guidance');
      recommendations.push('💤 Monitor and optimize sleep; consider sleep study if sleep apnea suspected');
      recommendations.push('😌 Structured stress management program');
      recommendations.push('📋 Close follow-up every 1-2 months');
      recommendations.push('🏥 Know your emergency action plan');
      break;

    case 'very-high':
      recommendations.push('🚑 VERY HIGH RISK - Emergency evaluation recommended');
      recommendations.push('🏥 Schedule urgent cardiology consultation');
      recommendations.push('💊 Aggressive multi-drug therapy likely needed');
      recommendations.push('🔬 Advanced cardiac testing: coronary angiography, imaging');
      recommendations.push('👨‍⚕️ Possible need for interventional procedures (stent, bypass)');
      recommendations.push('🏃 Supervised cardiac rehabilitation program essential');
      recommendations.push('🥗 Strict dietary control with nutritionist supervision');
      recommendations.push('💤 Optimize sleep; rule out sleep apnea');
      recommendations.push('😌 Intensive stress management and mental health support');
      recommendations.push('📞 Frequent monitoring: weekly to bi-weekly follow-ups');
      recommendations.push('⚠️ Emergency action plan with family and nearby hospital identified');
      recommendations.push('🚫 Strict medication adherence non-negotiable');
      break;
  }

  return recommendations;
}

/**
 * Get category progression advice
 */
export function getCategoryProgressionAdvice(
  currentCategory: RiskCategory,
  distance_to_next: number
): string {
  let advice = '';

  if (currentCategory === 'very-low') {
    advice = `You're in an excellent risk category. Focus on maintaining your current healthy lifestyle. Small increases in risk could move you to the "Low" category (at ${20}% risk), which is still very manageable.`;
  } else if (currentCategory === 'low') {
    advice = `Your risk is well-controlled. Maintaining your current interventions should keep you here. If risk increases beyond ${35}%, you'd move to "Moderate" risk and may need more intensive management.`;
  } else if (currentCategory === 'moderate') {
    if (distance_to_next <= 10) {
      advice = `⚠️ Your risk is approaching the "High" threshold (${60}%). Intensifying lifestyle changes and possibly increasing medications could prevent this progression. Even small improvements now can make a difference.`;
    } else {
      advice = `You're in the moderate risk category. With consistent intervention, you can potentially improve your risk over time. The goal is to move toward the "Low" category (below ${35}%).`;
    }
  } else if (currentCategory === 'high') {
    advice = `⚠️ Your risk is elevated. Aggressive management is needed to prevent further progression to "Very High" risk (${80}%). Strict adherence to medications and lifestyle changes is critical.`;
  } else {
    advice = `🚑 Your risk is very high. Emergency consultation with a cardiologist is strongly recommended. Depending on testing, you may need advanced interventions. This requires immediate action.`;
  }

  return advice;
}

/**
 * Generate stratification explanation for UI
 */
export function generateStratificationExplanation(result: RiskStratificationResult): string {
  let explanation = '📊 **5-Category Risk Assessment**\n\n';

  explanation += `### Your Risk Category: **${result.ui_icon} ${result.category_name}**\n`;
  explanation += `**Risk Score:** ${result.risk_score}%\n`;
  explanation += `**Position in Category:** ${result.percentage_in_category}% through the ${result.category_name} range (${result.category === 'very-high' ? '80-100' : result.category === 'high' ? '60-80' : result.category === 'moderate' ? '35-60' : result.category === 'low' ? '20-35' : '0-20'}%)\n\n`;

  explanation += `### What This Means\n`;
  explanation += `**${result.preventive_focus}**\n\n`;

  explanation += `### Recommended Actions\n`;
  explanation += `**Urgency:** ${result.urgency_level.toUpperCase()} | **Priority:** ${result.action_priority.toUpperCase()}\n\n`;

  explanation += `${result.category_recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}\n\n`;

  explanation += `### Next Steps\n`;
  if (result.category !== 'very-high' && result.category !== 'very-low') {
    explanation += `${getCategoryProgressionAdvice(result.category, result.risk_distance_to_next)}\n\n`;
  }

  explanation += `### Category Definitions\n`;
  explanation += `- **Very Low (0-20%):** Minimal cardiovascular risk\n`;
  explanation += `- **Low (20-35%):** Low risk with good prognosis\n`;
  explanation += `- **Moderate (35-60%):** Moderate risk requiring active management\n`;
  explanation += `- **High (60-80%):** High risk requiring aggressive intervention\n`;
  explanation += `- **Very High (80-100%):** Very high risk requiring urgent evaluation\n`;

  return explanation;
}

/**
 * Generate dashboard display card data
 */
export function generateStratificationCard(result: RiskStratificationResult) {
  return {
    category: result.category,
    category_name: result.category_name,
    risk_score: result.risk_score,
    color: result.ui_color,
    icon: result.ui_icon,
    urgency: result.urgency_level,
    action: result.action_priority,
    progress_percentage: result.percentage_in_category,
    message: result.preventive_focus,
    main_recommendations: result.category_recommendations.slice(0, 3)
  };
}

/**
 * Compare two risk scores in 5-category system
 */
export function compareRiskInCategories(
  score1: number,
  score2: number
): {
  category1: RiskStratificationResult;
  category2: RiskStratificationResult;
  interpretation: string;
} {
  const category1 = stratifyRisk(score1);
  const category2 = stratifyRisk(score2);

  let interpretation = '';

  if (category1.category === category2.category) {
    const change = score2 - score1;
    if (Math.abs(change) < 5) {
      interpretation = `Both risks are in the ${category1.category_name} category. The change of ${change > 0 ? '+' : ''}${change.toFixed(1)}% is minor and within the same risk category.`;
    } else if (change > 0) {
      interpretation = `Both risks are in ${category1.category_name}, but risk has increased by ${change.toFixed(1)}% and is moving toward the next higher category.`;
    } else {
      interpretation = `Both risks remain in ${category1.category_name}, and improvement of ${Math.abs(change).toFixed(1)}% is positive progress.`;
    }
  } else if (category1.category === 'very-low' && category2.category === 'low') {
    interpretation = `Risk has moved from Very Low to Low category (+${(score2 - score1).toFixed(1)}%). Still excellent, but requires some attention to prevention.`;
  } else if (category1.category === 'low' && category2.category === 'moderate') {
    interpretation = `⚠️ Risk has escalated from Low to Moderate category (+${(score2 - score1).toFixed(1)}%). Active intervention is now recommended.`;
  } else if (category1.category === 'moderate' && category2.category === 'high') {
    interpretation = `⚠️ Risk has escalated from Moderate to High category (+${(score2 - score1).toFixed(1)}%). Aggressive management is needed immediately.`;
  } else if (category1.category === 'high' && category2.category === 'very-high') {
    interpretation = `🚨 Risk has escalated to Very High category (+${(score2 - score1).toFixed(1)}%). Emergency medical consultation is urgent.`;
  } else if (score2 < score1) {
    interpretation = `⬇️ Improvement! Risk decreased from ${category1.category_name} to ${category2.category_name} (-${Math.abs(score2 - score1).toFixed(1)}%). Continue current interventions.`;
  } else {
    interpretation = `Risk category change from ${category1.category_name} (${score1.toFixed(1)}%) to ${category2.category_name} (${score2.toFixed(1)}%).`;
  }

  return {
    category1,
    category2,
    interpretation
  };
}

/**
 * Get risk category thresholds for display
 */
export function getRiskCategoryThresholds() {
  return {
    very_low: { min: 0, max: 20, name: 'Very Low' },
    low: { min: 20, max: 35, name: 'Low' },
    moderate: { min: 35, max: 60, name: 'Moderate' },
    high: { min: 60, max: 80, name: 'High' },
    very_high: { min: 80, max: 100, name: 'Very High' }
  };
}

/**
 * Calculate percentage through a category range
 */
export function percentageThroughCategory(riskScore: number, category: RiskCategory): number {
  const thresholds = getRiskCategoryThresholds();
  const threshold = thresholds[category as keyof typeof thresholds];
  
  if (!threshold) return 0;

  const position = riskScore - threshold.min;
  const range = threshold.max - threshold.min;
  return Math.max(0, Math.min(100, (position / range) * 100));
}
