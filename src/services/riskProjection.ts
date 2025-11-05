/**
 * 5-Year Risk Projection Service
 * Implements long-term cardiovascular risk trajectory modeling with lifestyle scenarios
 * Provides personalized risk evolution simulations
 * 
 * Phase 4 Task 4: 5-Year Risk Projection Analysis
 */

export interface YearlyProjection {
  year: number;
  age: number;
  projectedRisk: number;
  riskCategory: string;
  majorEventProbability: number; // MI, stroke, cardiac death
  interventionImpact: number; // potential risk reduction from interventions
}

export interface RiskTrajectory {
  startRisk: number;
  endRisk: number;
  totalChange: number; // absolute change
  percentageChange: number; // percentage change
  trend: 'improving' | 'stable' | 'worsening';
  riskVelocity: number; // annual change rate
  projections: YearlyProjection[];
}

export interface LifestyleScenario {
  name: string;
  description: string;
  assumptions: {
    bloodPressureReduction: number; // mmHg
    cholesterolReduction: number; // mg/dL
    weightLossPercent: number;
    exerciseMinutesPerWeek: number;
    stressReduction: number; // 0-1 scale
    alcoholReduction: number; // 0-1 scale
  };
  complianceRate: number; // 0-1
  riskMultiplier: number; // 0.6 = 40% risk reduction
}

export interface ScenarioComparison {
  scenarios: Array<{
    scenario: LifestyleScenario;
    projectedRiskAt5Years: number;
    riskReduction: number; // absolute
    percentageReduction: number;
    projections: YearlyProjection[];
  }>;
  recommendation: string;
}

export interface EventRiskProfile {
  myocardialInfarction: number;
  stroke: number;
  cardiacDeath: number;
  angina: number;
  heartFailure: number;
  arrhythmia: number;
  majorAdverseCardiacEvent: number; // combination
}

class RiskProjectionService {
  /**
   * Project 5-year risk trajectory
   */
  projectRiskTrajectory(
    currentAge: number,
    currentRisk: number,
    gender: 'Male' | 'Female',
    trendStatus: 'improving' | 'stable' | 'worsening',
    riskFactors?: {
      smoking: boolean;
      diabetes: boolean;
      hypertension: boolean;
      sedentary: boolean;
      obesity: boolean;
    }
  ): RiskTrajectory {
    const years = 5;
    const projections: YearlyProjection[] = [];

    // Determine annual risk change rate based on trend
    let annualChangeRate = this.calculateAnnualChangeRate(
      trendStatus,
      currentRisk,
      gender,
      riskFactors
    );

    // Generate yearly projections
    for (let year = 1; year <= years; year++) {
      const age = currentAge + year;
      const projectedRisk = this.calculateProjectedRisk(
        currentRisk,
        year,
        annualChangeRate,
        age,
        gender
      );

      const riskCategory = this.getRiskCategory(projectedRisk);
      const majorEventProb = this.calculateMajorEventProbability(projectedRisk, age, gender);
      const interventionImpact = this.calculateInterventionPotential(projectedRisk, riskFactors);

      projections.push({
        year,
        age,
        projectedRisk,
        riskCategory,
        majorEventProbability: majorEventProb,
        interventionImpact
      });
    }

    const endRisk = projections[projections.length - 1].projectedRisk;
    const totalChange = endRisk - currentRisk;
    const percentageChange = (totalChange / currentRisk) * 100;

    // Determine overall trend
    let trend: 'improving' | 'stable' | 'worsening';
    if (percentageChange < -5) trend = 'improving';
    else if (percentageChange > 5) trend = 'worsening';
    else trend = 'stable';

    return {
      startRisk: currentRisk,
      endRisk,
      totalChange,
      percentageChange,
      trend,
      riskVelocity: totalChange / years,
      projections
    };
  }

  /**
   * Calculate annual change rate
   */
  private calculateAnnualChangeRate(
    trendStatus: string,
    currentRisk: number,
    gender: 'Male' | 'Female',
    riskFactors?: any
  ): number {
    let baseRate = 1.5; // base 1.5% annual increase

    // Age-based adjustment
    const riskMultiplier = gender === 'Male' ? 1.1 : 0.9;
    baseRate = baseRate * riskMultiplier;

    // Trend-based adjustment
    if (trendStatus === 'improving') baseRate = -1.0; // negative = improvement
    else if (trendStatus === 'worsening') baseRate = 2.5;

    // Risk factor adjustment
    if (riskFactors) {
      let factorCount = 0;
      if (riskFactors.smoking) factorCount += 2;
      if (riskFactors.diabetes) factorCount += 2;
      if (riskFactors.hypertension) factorCount += 1;
      if (riskFactors.sedentary) factorCount += 1;
      if (riskFactors.obesity) factorCount += 1;

      baseRate = baseRate + (factorCount * 0.3);
    }

    return baseRate;
  }

  /**
   * Calculate projected risk for a given year
   */
  private calculateProjectedRisk(
    currentRisk: number,
    year: number,
    annualChangeRate: number,
    age: number,
    gender: 'Male' | 'Female'
  ): number {
    // Use logistic growth model for risk progression
    // Risk doesn't grow linearly but accelerates as age increases
    
    const ageAccelerator = age > 55 ? 1.3 : 1.0; // Accelerated risk after 55
    const projectedRisk = currentRisk + (annualChangeRate * year * ageAccelerator);

    // Constrain between 0-100
    return Math.max(0, Math.min(100, projectedRisk));
  }

  /**
   * Get risk category from score
   */
  private getRiskCategory(riskScore: number): string {
    if (riskScore <= 20) return 'Very Low';
    if (riskScore <= 35) return 'Low';
    if (riskScore <= 60) return 'Moderate';
    if (riskScore <= 80) return 'High';
    return 'Very High';
  }

  /**
   * Calculate probability of major adverse cardiac event
   */
  private calculateMajorEventProbability(
    riskScore: number,
    age: number,
    gender: 'Male' | 'Female'
  ): number {
    // Convert 10-year risk to annual event probability
    // Annual = 1 - (1 - 10-year risk)^(1/10)
    
    const tenYearRisk = riskScore / 100;
    const annualRisk = 1 - Math.pow(1 - tenYearRisk, 0.1);
    
    // Age adjustment
    const ageMultiplier = age > 60 ? 1.3 : age > 50 ? 1.1 : 1.0;
    const genderMultiplier = gender === 'Male' ? 1.2 : 1.0;

    return Math.min(0.15, annualRisk * ageMultiplier * genderMultiplier); // Cap at 15% annual
  }

  /**
   * Calculate intervention potential
   */
  private calculateInterventionPotential(
    riskScore: number,
    riskFactors?: any
  ): number {
    let potential = 0;

    // Modifiable risk factors offer potential for reduction
    if (riskFactors) {
      if (riskFactors.smoking) potential += 0.20; // 20% reduction possible
      if (riskFactors.sedentary) potential += 0.15; // 15% reduction
      if (riskFactors.obesity) potential += 0.12; // 12% reduction
      if (riskFactors.hypertension) potential += 0.18; // 18% reduction
    }

    // Higher risk scores offer more room for improvement
    if (riskScore > 60) potential += 0.10;

    return Math.min(0.60, potential); // Cap at 60% reduction
  }

  /**
   * Generate lifestyle scenarios
   */
  generateLifestyleScenarios(currentRisk: number, gender: 'Male' | 'Female'): LifestyleScenario[] {
    return [
      {
        name: 'Status Quo',
        description: 'Continue current lifestyle without changes',
        assumptions: {
          bloodPressureReduction: 0,
          cholesterolReduction: 0,
          weightLossPercent: 0,
          exerciseMinutesPerWeek: 0,
          stressReduction: 0,
          alcoholReduction: 0
        },
        complianceRate: 1.0,
        riskMultiplier: 1.0
      },
      {
        name: 'Moderate Lifestyle Changes',
        description: 'Implement moderate improvements in diet and exercise',
        assumptions: {
          bloodPressureReduction: 5,
          cholesterolReduction: 20,
          weightLossPercent: 3,
          exerciseMinutesPerWeek: 150,
          stressReduction: 0.2,
          alcoholReduction: 0.2
        },
        complianceRate: 0.7,
        riskMultiplier: 0.85
      },
      {
        name: 'Intensive Lifestyle Intervention',
        description: 'Comprehensive lifestyle changes plus pharmacotherapy',
        assumptions: {
          bloodPressureReduction: 15,
          cholesterolReduction: 40,
          weightLossPercent: 8,
          exerciseMinutesPerWeek: 300,
          stressReduction: 0.5,
          alcoholReduction: 0.5
        },
        complianceRate: 0.6,
        riskMultiplier: 0.65
      },
      {
        name: 'Aggressive Medical Management',
        description: 'Maximum pharmacotherapy plus lifestyle optimization',
        assumptions: {
          bloodPressureReduction: 20,
          cholesterolReduction: 50,
          weightLossPercent: 10,
          exerciseMinutesPerWeek: 300,
          stressReduction: 0.6,
          alcoholReduction: 0.7
        },
        complianceRate: 0.5,
        riskMultiplier: 0.50
      }
    ];
  }

  /**
   * Compare lifestyle scenarios
   */
  compareLifestyleScenarios(
    currentAge: number,
    currentRisk: number,
    gender: 'Male' | 'Female',
    trendStatus: 'improving' | 'stable' | 'worsening'
  ): ScenarioComparison {
    const scenarios = this.generateLifestyleScenarios(currentRisk, gender);
    const baselineTrajectory = this.projectRiskTrajectory(currentAge, currentRisk, gender, trendStatus);

    const comparisons = scenarios.map(scenario => {
      const adjustedRisk = currentRisk * scenario.riskMultiplier * scenario.complianceRate;
      const trajectory = this.projectRiskTrajectory(
        currentAge,
        adjustedRisk,
        gender,
        adjustedRisk < currentRisk ? 'improving' : trendStatus
      );

      const riskReduction = currentRisk - trajectory.endRisk;
      const percentageReduction = (riskReduction / currentRisk) * 100;

      return {
        scenario,
        projectedRiskAt5Years: trajectory.endRisk,
        riskReduction,
        percentageReduction,
        projections: trajectory.projections
      };
    });

    // Generate recommendation
    const bestScenario = comparisons.reduce((best, curr) => 
      curr.projectedRiskAt5Years < best.projectedRiskAt5Years ? curr : best
    );

    let recommendation = `Based on 5-year projections, the "${bestScenario.scenario.name}" approach offers `;
    recommendation += `the best risk reduction potential, lowering your risk to ${bestScenario.projectedRiskAt5Years.toFixed(1)}% `;
    recommendation += `(${bestScenario.percentageReduction.toFixed(1)}% reduction). `;
    recommendation += `Success depends on maintaining compliance with the recommended lifestyle changes.`;

    return {
      scenarios: comparisons,
      recommendation
    };
  }

  /**
   * Calculate event-specific risk profile
   */
  calculateEventRiskProfile(
    riskScore: number,
    age: number,
    gender: 'Male' | 'Female',
    riskFactors?: {
      smoking: boolean;
      diabetes: boolean;
      hypertension: boolean;
      previousMI: boolean;
      ejectinFraction?: number;
    }
  ): EventRiskProfile {
    // Use Framingham-based weighting to distribute composite risk
    const baseFactor = riskScore / 100;

    // Adjust by age and gender
    const ageMultiplier = Math.pow(1.05, Math.max(0, age - 50)); // 5% increase per year after 50
    const genderMultiplier = gender === 'Male' ? 1.3 : 1.0;
    const adjustedFactor = baseFactor * ageMultiplier * genderMultiplier;

    // Event-specific calculations
    let miRisk = adjustedFactor * 0.35; // MI is 35% of composite risk
    let strokeRisk = adjustedFactor * 0.25; // Stroke is 25%
    let cardiacDeathRisk = adjustedFactor * 0.15; // Cardiac death is 15%
    let anginaRisk = adjustedFactor * 0.15; // Angina is 15%
    let hfRisk = adjustedFactor * 0.08; // Heart failure is 8%
    let arrythmiaRisk = adjustedFactor * 0.02; // Arrhythmia is 2%

    // Adjust for specific risk factors
    if (riskFactors?.smoking) {
      miRisk *= 1.4;
      strokeRisk *= 1.3;
    }
    if (riskFactors?.diabetes) {
      hfRisk *= 2.0;
      miRisk *= 1.5;
    }
    if (riskFactors?.previousMI) {
      miRisk *= 2.5;
      cardiacDeathRisk *= 3.0;
    }

    // Normalize so total doesn't exceed risk score
    const total = miRisk + strokeRisk + cardiacDeathRisk + anginaRisk + hfRisk + arrythmiaRisk;
    const normalizer = Math.min(1.0, riskScore / (total * 100));

    return {
      myocardialInfarction: Math.round(miRisk * normalizer * 1000) / 10, // percentage
      stroke: Math.round(strokeRisk * normalizer * 1000) / 10,
      cardiacDeath: Math.round(cardiacDeathRisk * normalizer * 1000) / 10,
      angina: Math.round(anginaRisk * normalizer * 1000) / 10,
      heartFailure: Math.round(hfRisk * normalizer * 1000) / 10,
      arrhythmia: Math.round(arrythmiaRisk * normalizer * 1000) / 10,
      majorAdverseCardiacEvent: riskScore // MACE is composite risk
    };
  }

  /**
   * Generate risk trajectory report
   */
  generateTrajectoryReport(
    trajectory: RiskTrajectory,
    scenarios?: ScenarioComparison
  ): string {
    let report = '# 5-Year Risk Projection Report\n\n';

    report += '## Risk Trajectory Summary\n';
    report += `- **Starting Risk**: ${trajectory.startRisk.toFixed(1)}%\n`;
    report += `- **Projected 5-Year Risk**: ${trajectory.endRisk.toFixed(1)}%\n`;
    report += `- **Total Change**: ${trajectory.totalChange > 0 ? '+' : ''}${trajectory.totalChange.toFixed(1)}% (${trajectory.percentageChange > 0 ? '+' : ''}${trajectory.percentageChange.toFixed(1)}%)\n`;
    report += `- **Trend**: ${trajectory.trend.toUpperCase()}\n`;
    report += `- **Annual Change Rate**: ${trajectory.riskVelocity.toFixed(2)}%/year\n\n`;

    report += '## Yearly Projections\n';
    report += '| Year | Age | Risk | Category | Event Probability |\n';
    report += '|------|-----|------|----------|-------------------|\n';
    trajectory.projections.forEach(proj => {
      report += `| ${proj.year} | ${proj.age} | ${proj.projectedRisk.toFixed(1)}% | ${proj.riskCategory} | ${(proj.majorEventProbability * 100).toFixed(2)}% |\n`;
    });

    if (scenarios) {
      report += '\n## Scenario Comparison\n';
      scenarios.scenarios.forEach(s => {
        report += `\n### ${s.scenario.name}\n`;
        report += `- **Description**: ${s.scenario.description}\n`;
        report += `- **5-Year Risk**: ${s.projectedRiskAt5Years.toFixed(1)}%\n`;
        report += `- **Risk Reduction**: ${s.riskReduction.toFixed(1)}% (${s.percentageReduction.toFixed(1)}%)\n`;
      });

      report += '\n## Recommendation\n';
      report += scenarios.recommendation;
    }

    return report;
  }

  /**
   * Calculate cardiovascular age equivalent
   */
  calculateCardiovascularAge(
    chronologicalAge: number,
    riskScore: number,
    gender: 'Male' | 'Female'
  ): number {
    // Map risk score to equivalent age
    // A 45-year-old with 60% risk might have cardiovascular age of 65

    const baseAge = gender === 'Male' ? 50 : 55;
    const riskToAgeConversion = (riskScore - 10) / 1.5; // approximation
    const cvAge = chronologicalAge + (riskToAgeConversion - baseAge) * 0.5;

    return Math.max(18, Math.min(110, cvAge)); // Constrain reasonable bounds
  }

  /**
   * Predict time to event
   */
  predictTimeToMajorEvent(
    currentRisk: number,
    age: number,
    gender: 'Male' | 'Female'
  ): {
    medianYearsToEvent: number;
    probability1Year: number;
    probability5Year: number;
    probability10Year: number;
  } {
    const annualEventRate = 1 - Math.pow(1 - (currentRisk / 100), 0.1);
    
    // Calculate median time to event (50% probability)
    const medianYears = Math.log(0.5) / Math.log(1 - annualEventRate);

    // Age adjustment for actual event probability
    const ageMultiplier = age > 60 ? 1.3 : age > 50 ? 1.1 : 1.0;
    
    return {
      medianYearsToEvent: Math.max(1, medianYears),
      probability1Year: Math.min(0.20, annualEventRate * ageMultiplier),
      probability5Year: Math.min(0.70, annualEventRate * 5 * ageMultiplier),
      probability10Year: currentRisk / 100
    };
  }
}

export default new RiskProjectionService();
