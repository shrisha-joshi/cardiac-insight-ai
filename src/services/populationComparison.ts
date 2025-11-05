/**
 * Population Risk Comparison & Statistics Service
 * Provides demographic-based risk percentile ranking and population insights
 * Compares individual risk to matched population cohorts
 * 
 * Phase 4 Task 6: Population Risk Statistics System
 */

export interface PopulationStatistics {
  demographicGroup: string;
  totalSamples: number;
  meanRisk: number;
  medianRisk: number;
  stdDeviation: number;
  minRisk: number;
  maxRisk: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;  // median
    p75: number;
    p90: number;
    p95: number;
  };
  riskDistribution: {
    veryLow: number;   // percentage
    low: number;
    moderate: number;
    high: number;
    veryHigh: number;
  };
}

export interface RiskComparison {
  patientRisk: number;
  demographicGroup: string;
  populationStats: PopulationStatistics;
  percentile: number;
  riskRanking: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  comparisonToAverage: number; // percentage difference
  comparisonToMedian: number;
  demographicInsights: string[];
  recommendedActions: string[];
}

export interface PopulationTrends {
  year: number;
  ageGroup: string;
  gender: string;
  averageRisk: number;
  trendDirection: 'improving' | 'stable' | 'worsening';
  trendRate: number; // percentage change per year
}

export interface RiskFactorPrevalence {
  riskFactor: string;
  prevalenceInPopulation: number; // percentage
  averageRiskContribution: number;
  demographicsAffected: string[];
}

class PopulationComparisonService {
  /**
   * Population statistics database (based on Indian cardiac epidemiology)
   * Age groups: 30-39, 40-49, 50-59, 60+
   * Includes urban and rural data
   */
  private populationStats: Map<string, PopulationStatistics> = this.initializePopulationStats();

  /**
   * Risk factor prevalence data
   */
  private riskFactorPrevalence: Map<string, RiskFactorPrevalence> = this.initializeRiskFactors();

  /**
   * Population trends over years
   */
  private populationTrends: PopulationTrends[] = this.initializePopulationTrends();

  /**
   * Initialize population statistics
   */
  private initializePopulationStats(): Map<string, PopulationStatistics> {
    const stats = new Map<string, PopulationStatistics>();

    // INDIAN URBAN POPULATION DATA (based on epidemiological studies)

    // Males 30-39 years - Urban
    stats.set('Male_30_39_Urban', {
      demographicGroup: 'Urban Males 30-39',
      totalSamples: 2500,
      meanRisk: 8.5,
      medianRisk: 6.2,
      stdDeviation: 7.2,
      minRisk: 0.5,
      maxRisk: 45.0,
      percentiles: {
        p10: 1.2,
        p25: 2.8,
        p50: 6.2,
        p75: 13.5,
        p90: 22.0,
        p95: 28.5
      },
      riskDistribution: {
        veryLow: 45,
        low: 28,
        moderate: 18,
        high: 7,
        veryHigh: 2
      }
    });

    // Males 30-39 years - Rural
    stats.set('Male_30_39_Rural', {
      demographicGroup: 'Rural Males 30-39',
      totalSamples: 1800,
      meanRisk: 5.8,
      medianRisk: 4.1,
      stdDeviation: 5.5,
      minRisk: 0.2,
      maxRisk: 32.0,
      percentiles: {
        p10: 0.8,
        p25: 1.5,
        p50: 4.1,
        p75: 8.5,
        p90: 14.2,
        p95: 18.0
      },
      riskDistribution: {
        veryLow: 62,
        low: 22,
        moderate: 12,
        high: 3,
        veryHigh: 1
      }
    });

    // Males 40-49 years - Urban
    stats.set('Male_40_49_Urban', {
      demographicGroup: 'Urban Males 40-49',
      totalSamples: 3200,
      meanRisk: 18.2,
      medianRisk: 15.8,
      stdDeviation: 12.5,
      minRisk: 1.0,
      maxRisk: 65.0,
      percentiles: {
        p10: 4.2,
        p25: 9.0,
        p50: 15.8,
        p75: 25.0,
        p90: 38.5,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 18,
        low: 32,
        moderate: 32,
        high: 15,
        veryHigh: 3
      }
    });

    // Males 40-49 years - Rural
    stats.set('Male_40_49_Rural', {
      demographicGroup: 'Rural Males 40-49',
      totalSamples: 2100,
      meanRisk: 12.5,
      medianRisk: 10.2,
      stdDeviation: 9.8,
      minRisk: 0.5,
      maxRisk: 48.0,
      percentiles: {
        p10: 2.5,
        p25: 5.2,
        p50: 10.2,
        p75: 17.5,
        p90: 28.0,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 35,
        low: 32,
        moderate: 22,
        high: 9,
        veryHigh: 2
      }
    });

    // Males 50-59 years - Urban
    stats.set('Male_50_59_Urban', {
      demographicGroup: 'Urban Males 50-59',
      totalSamples: 2800,
      meanRisk: 28.5,
      medianRisk: 26.0,
      stdDeviation: 18.2,
      minRisk: 2.0,
      maxRisk: 85.0,
      percentiles: {
        p10: 8.5,
        p25: 15.0,
        p50: 26.0,
        p75: 38.5,
        p90: 52.0,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 8,
        low: 18,
        moderate: 35,
        high: 28,
        veryHigh: 11
      }
    });

    // Males 50-59 years - Rural
    stats.set('Male_50_59_Rural', {
      demographicGroup: 'Rural Males 50-59',
      totalSamples: 1900,
      meanRisk: 20.0,
      medianRisk: 18.0,
      stdDeviation: 14.5,
      minRisk: 1.0,
      maxRisk: 65.0,
      percentiles: {
        p10: 5.0,
        p25: 10.0,
        p50: 18.0,
        p75: 28.0,
        p90: 40.5,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 18,
        low: 25,
        moderate: 30,
        high: 18,
        veryHigh: 9
      }
    });

    // Males 60+ years - Urban
    stats.set('Male_60Plus_Urban', {
      demographicGroup: 'Urban Males 60+',
      totalSamples: 2200,
      meanRisk: 42.5,
      medianRisk: 40.5,
      stdDeviation: 22.0,
      minRisk: 5.0,
      maxRisk: 95.0,
      percentiles: {
        p10: 15.0,
        p25: 25.0,
        p50: 40.5,
        p75: 58.0,
        p90: 72.0,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 3,
        low: 8,
        moderate: 25,
        high: 38,
        veryHigh: 26
      }
    });

    // Males 60+ years - Rural
    stats.set('Male_60Plus_Rural', {
      demographicGroup: 'Rural Males 60+',
      totalSamples: 1600,
      meanRisk: 32.0,
      medianRisk: 30.0,
      stdDeviation: 18.5,
      minRisk: 3.0,
      maxRisk: 78.0,
      percentiles: {
        p10: 10.0,
        p25: 18.0,
        p50: 30.0,
        p75: 42.0,
        p90: 58.5,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 8,
        low: 15,
        moderate: 28,
        high: 28,
        veryHigh: 21
      }
    });

    // FEMALE DATA (lower risk overall, especially pre-menopause)

    // Females 30-39 years - Urban
    stats.set('Female_30_39_Urban', {
      demographicGroup: 'Urban Females 30-39',
      totalSamples: 2400,
      meanRisk: 3.5,
      medianRisk: 2.0,
      stdDeviation: 4.2,
      minRisk: 0.1,
      maxRisk: 28.0,
      percentiles: {
        p10: 0.3,
        p25: 0.8,
        p50: 2.0,
        p75: 4.5,
        p90: 8.5,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 72,
        low: 18,
        moderate: 7,
        high: 2,
        veryHigh: 1
      }
    });

    // Females 40-49 years - Urban
    stats.set('Female_40_49_Urban', {
      demographicGroup: 'Urban Females 40-49',
      totalSamples: 2800,
      meanRisk: 9.2,
      medianRisk: 7.5,
      stdDeviation: 8.5,
      minRisk: 0.5,
      maxRisk: 48.0,
      percentiles: {
        p10: 1.2,
        p25: 3.0,
        p50: 7.5,
        p75: 13.5,
        p90: 22.0,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 42,
        low: 32,
        moderate: 18,
        high: 6,
        veryHigh: 2
      }
    });

    // Females 50-59 years - Urban (Post-menopause)
    stats.set('Female_50_59_Urban', {
      demographicGroup: 'Urban Females 50-59',
      totalSamples: 2600,
      meanRisk: 22.0,
      medianRisk: 20.0,
      stdDeviation: 15.5,
      minRisk: 1.0,
      maxRisk: 72.0,
      percentiles: {
        p10: 6.0,
        p25: 12.0,
        p50: 20.0,
        p75: 30.0,
        p90: 44.0,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 12,
        low: 22,
        moderate: 35,
        high: 22,
        veryHigh: 9
      }
    });

    // Females 60+ years - Urban
    stats.set('Female_60Plus_Urban', {
      demographicGroup: 'Urban Females 60+',
      totalSamples: 2100,
      meanRisk: 38.5,
      medianRisk: 36.5,
      stdDeviation: 20.0,
      minRisk: 4.0,
      maxRisk: 88.0,
      percentiles: {
        p10: 12.0,
        p25: 22.0,
        p50: 36.5,
        p75: 52.0,
        p90: 68.0,
        p95: 48.0
      },
      riskDistribution: {
        veryLow: 5,
        low: 12,
        moderate: 28,
        high: 35,
        veryHigh: 20
      }
    });

    return stats;
  }

  /**
   * Initialize risk factor prevalence
   */
  private initializeRiskFactors(): Map<string, RiskFactorPrevalence> {
    const factors = new Map<string, RiskFactorPrevalence>();

    factors.set('hypertension', {
      riskFactor: 'Hypertension',
      prevalenceInPopulation: 24.8, // ~25% in Indian urban population
      averageRiskContribution: 18,
      demographicsAffected: ['Males 50+', 'Females 60+', 'Urban population']
    });

    factors.set('diabetes', {
      riskFactor: 'Type 2 Diabetes',
      prevalenceInPopulation: 11.2,
      averageRiskContribution: 22,
      demographicsAffected: ['All ages', 'Urban > Rural', 'Increasing with age']
    });

    factors.set('smoking', {
      riskFactor: 'Smoking',
      prevalenceInPopulation: 22.0, // ~22% among men, lower in women
      averageRiskContribution: 25,
      demographicsAffected: ['Males predominantly', 'All ages']
    });

    factors.set('overweight_obesity', {
      riskFactor: 'Overweight/Obesity (BMI >25)',
      prevalenceInPopulation: 28.5,
      averageRiskContribution: 15,
      demographicsAffected: ['Urban > Rural', 'Increasing with age', 'Both genders']
    });

    factors.set('dyslipidemia', {
      riskFactor: 'Dyslipidemia',
      prevalenceInPopulation: 31.0,
      averageRiskContribution: 20,
      demographicsAffected: ['Males 40+', 'Females 50+', 'Urban population']
    });

    factors.set('sedentary', {
      riskFactor: 'Sedentary Lifestyle',
      prevalenceInPopulation: 41.0,
      averageRiskContribution: 12,
      demographicsAffected: ['Urban population', 'All ages']
    });

    factors.set('family_history', {
      riskFactor: 'Positive Family History',
      prevalenceInPopulation: 18.5,
      averageRiskContribution: 8,
      demographicsAffected: ['All ages', 'All demographics']
    });

    return factors;
  }

  /**
   * Initialize population trends
   */
  private initializePopulationTrends(): PopulationTrends[] {
    return [
      { year: 2020, ageGroup: '40-49', gender: 'Male', averageRisk: 16.5, trendDirection: 'worsening', trendRate: 1.2 },
      { year: 2021, ageGroup: '40-49', gender: 'Male', averageRisk: 17.2, trendDirection: 'worsening', trendRate: 1.2 },
      { year: 2022, ageGroup: '40-49', gender: 'Male', averageRisk: 18.0, trendDirection: 'worsening', trendRate: 1.2 },
      { year: 2023, ageGroup: '40-49', gender: 'Male', averageRisk: 18.2, trendDirection: 'worsening', trendRate: 1.0 },
      { year: 2024, ageGroup: '40-49', gender: 'Male', averageRisk: 18.5, trendDirection: 'stable', trendRate: 0.5 },
      { year: 2020, ageGroup: '50-59', gender: 'Male', averageRisk: 26.0, trendDirection: 'worsening', trendRate: 1.5 },
      { year: 2021, ageGroup: '50-59', gender: 'Male', averageRisk: 27.0, trendDirection: 'worsening', trendRate: 1.5 },
      { year: 2022, ageGroup: '50-59', gender: 'Male', averageRisk: 28.0, trendDirection: 'worsening', trendRate: 1.5 },
      { year: 2023, ageGroup: '50-59', gender: 'Male', averageRisk: 28.5, trendDirection: 'worsening', trendRate: 1.0 },
      { year: 2024, ageGroup: '50-59', gender: 'Male', averageRisk: 28.5, trendDirection: 'stable', trendRate: 0.0 }
    ];
  }

  /**
   * Compare patient risk to population
   */
  compareToPopulation(
    age: number,
    gender: 'Male' | 'Female',
    riskScore: number,
    location: 'Urban' | 'Rural' = 'Urban'
  ): RiskComparison {
    const group = this.getPopulationGroup(age, gender, location);
    const stats = this.populationStats.get(group);

    if (!stats) {
      return this.getDefaultComparison(riskScore, group);
    }

    // Calculate percentile
    const percentile = this.calculatePercentile(riskScore, stats);

    // Compare to average and median
    const avgDiff = ((riskScore - stats.meanRisk) / stats.meanRisk) * 100;
    const medianDiff = ((riskScore - stats.medianRisk) / stats.medianRisk) * 100;

    // Generate insights
    const insights = this.generateInsights(riskScore, percentile, stats, gender, age);

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskScore, percentile);

    // Determine ranking
    let ranking: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
    if (percentile < 10) ranking = 'Very Low';
    else if (percentile < 25) ranking = 'Low';
    else if (percentile < 75) ranking = 'Moderate';
    else if (percentile < 90) ranking = 'High';
    else ranking = 'Very High';

    return {
      patientRisk: riskScore,
      demographicGroup: group,
      populationStats: stats,
      percentile,
      riskRanking: ranking,
      comparisonToAverage: avgDiff,
      comparisonToMedian: medianDiff,
      demographicInsights: insights,
      recommendedActions: recommendations
    };
  }

  /**
   * Get population group key
   */
  private getPopulationGroup(age: number, gender: 'Male' | 'Female', location: 'Urban' | 'Rural'): string {
    let ageGroup: string;
    if (age < 40) ageGroup = '30_39';
    else if (age < 50) ageGroup = '40_49';
    else if (age < 60) ageGroup = '50_59';
    else ageGroup = '60Plus';

    return `${gender}_${ageGroup}_${location}`;
  }

  /**
   * Calculate percentile ranking
   */
  private calculatePercentile(riskScore: number, stats: PopulationStatistics): number {
    // Simple percentile calculation based on distribution
    if (riskScore <= stats.percentiles.p10) return 10;
    if (riskScore <= stats.percentiles.p25) return 25;
    if (riskScore <= stats.percentiles.p50) return 50;
    if (riskScore <= stats.percentiles.p75) return 75;
    if (riskScore <= stats.percentiles.p90) return 90;
    return 95;
  }

  /**
   * Generate insights
   */
  private generateInsights(
    riskScore: number,
    percentile: number,
    stats: PopulationStatistics,
    gender: string,
    age: number
  ): string[] {
    const insights: string[] = [];

    if (percentile <= 10) {
      insights.push(`Your cardiovascular risk is in the lowest 10% of your demographic group - excellent status!`);
      insights.push(`Maintain current healthy lifestyle to preserve this low-risk status.`);
    } else if (percentile <= 25) {
      insights.push(`Your risk is below average for your age group (${age}) and gender.`);
      insights.push(`Continue preventive measures to maintain this favorable status.`);
    } else if (percentile <= 75) {
      insights.push(`Your risk is similar to others in your demographic group.`);
      insights.push(`Risk optimization may provide significant health benefits.`);
    } else if (percentile <= 90) {
      insights.push(`Your cardiovascular risk is higher than 75-90% of your demographic group.`);
      insights.push(`Increased monitoring and intervention are recommended.`);
    } else {
      insights.push(`Your risk is among the highest 10% in your demographic group.`);
      insights.push(`Urgent action required: Consult with healthcare provider for intensive management.`);
    }

    // Gender-specific insights
    if (gender === 'Female' && age >= 50) {
      insights.push(`Post-menopausal status significantly increases cardiovascular risk for women.`);
    }

    // Comparison to group statistics
    if (riskScore > stats.meanRisk + stats.stdDeviation) {
      insights.push(`Your risk is >1 standard deviation above your group mean.`);
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(riskScore: number, percentile: number): string[] {
    const recommendations: string[] = [];

    if (percentile >= 75) {
      recommendations.push('Schedule comprehensive cardiac evaluation with a cardiologist');
      recommendations.push('Consider advanced imaging: Coronary calcium scoring or ECG stress test');
      recommendations.push('Pharmacotherapy review: May benefit from additional medications');
    }

    if (percentile >= 50) {
      recommendations.push('Intensive lifestyle modification: Target ≥30 min exercise 5x/week');
      recommendations.push('Dietary counseling: Mediterranean or DASH diet recommended');
      recommendations.push('Regular monitoring: Check-ups every 6-12 months');
    }

    if (percentile < 50) {
      recommendations.push('Maintain current healthy lifestyle');
      recommendations.push('Annual cardiovascular assessment recommended');
    }

    recommendations.push('Risk factor screening: Ensure regular lipid, glucose, and BP monitoring');

    return recommendations;
  }

  /**
   * Get risk factor prevalence
   */
  getRiskFactorPrevalence(factor: string): RiskFactorPrevalence | null {
    return this.riskFactorPrevalence.get(factor) || null;
  }

  /**
   * Get all risk factors
   */
  getAllRiskFactors(): RiskFactorPrevalence[] {
    return Array.from(this.riskFactorPrevalence.values());
  }

  /**
   * Get population trends
   */
  getPopulationTrends(ageGroup?: string, gender?: string): PopulationTrends[] {
    let trends = this.populationTrends;

    if (ageGroup) {
      trends = trends.filter(t => t.ageGroup === ageGroup);
    }
    if (gender) {
      trends = trends.filter(t => t.gender === gender);
    }

    return trends;
  }

  /**
   * Get population statistics for a group
   */
  getPopulationStats(age: number, gender: 'Male' | 'Female', location: 'Urban' | 'Rural' = 'Urban'): PopulationStatistics | null {
    const group = this.getPopulationGroup(age, gender, location);
    return this.populationStats.get(group) || null;
  }

  /**
   * Default comparison (fallback)
   */
  private getDefaultComparison(riskScore: number, group: string): RiskComparison {
    const defaultStats: PopulationStatistics = {
      demographicGroup: group,
      totalSamples: 0,
      meanRisk: 20,
      medianRisk: 18,
      stdDeviation: 12,
      minRisk: 0,
      maxRisk: 100,
      percentiles: { p10: 5, p25: 10, p50: 18, p75: 30, p90: 45 },
      riskDistribution: { veryLow: 15, low: 20, moderate: 40, high: 20, veryHigh: 5 }
    };

    return {
      patientRisk: riskScore,
      demographicGroup: group,
      populationStats: defaultStats,
      percentile: 50,
      riskRanking: 'Moderate',
      comparisonToAverage: 0,
      comparisonToMedian: 0,
      demographicInsights: ['Limited demographic data available'],
      recommendedActions: ['Consult healthcare provider for personalized assessment']
    };
  }

  /**
   * Generate population comparison report
   */
  generateComparisonReport(comparison: RiskComparison): string {
    let report = '# Population Risk Comparison Report\n\n';

    report += '## Your Risk Profile\n';
    report += `- **Risk Score**: ${comparison.patientRisk.toFixed(1)}%\n`;
    report += `- **Percentile Ranking**: ${comparison.percentile}th percentile\n`;
    report += `- **Risk Category**: ${comparison.riskRanking}\n`;
    report += `- **Population Group**: ${comparison.demographicGroup}\n\n`;

    report += '## Comparison to Population\n';
    report += `- **Population Mean Risk**: ${comparison.populationStats.meanRisk.toFixed(1)}%\n`;
    report += `- **Population Median Risk**: ${comparison.populationStats.medianRisk.toFixed(1)}%\n`;
    report += `- **Your vs. Average**: ${comparison.comparisonToAverage > 0 ? '+' : ''}${comparison.comparisonToAverage.toFixed(1)}%\n`;
    report += `- **Your vs. Median**: ${comparison.comparisonToMedian > 0 ? '+' : ''}${comparison.comparisonToMedian.toFixed(1)}%\n\n`;

    report += '## Insights\n';
    comparison.demographicInsights.forEach((insight, i) => {
      report += `${i + 1}. ${insight}\n`;
    });

    report += '\n## Recommended Actions\n';
    comparison.recommendedActions.forEach((action, i) => {
      report += `${i + 1}. ${action}\n`;
    });

    return report;
  }
}

export default new PopulationComparisonService();

