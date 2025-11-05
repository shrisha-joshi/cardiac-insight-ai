/**
 * Age-Specific Risk Thresholds Service
 * Implements age-group specific cardiovascular risk thresholds with gender differentiation
 * Based on major cardiac risk studies and Indian epidemiology
 * 
 * Phase 4 Task 3: Age-Specific Risk Thresholds
 */

export interface AgeThresholds {
  ageGroup: string;
  ageRange: [number, number];
  gender: 'Male' | 'Female' | 'Both';
  riskThresholds: {
    veryLow: [number, number];      // 0-X%
    low: [number, number];          // X-Y%
    moderate: [number, number];     // Y-Z%
    high: [number, number];         // Z-W%
    veryHigh: [number, number];     // W-100%
  };
  biomarkerThresholds: {
    systolicBP: number;
    diastolicBP: number;
    totalCholesterol: number;
    ldlCholesterol: number;
    hdlCholesterol: number;
    triglycerides: number;
    glucose: number;
    bmi: number;
  };
  managementRecommendations: {
    veryLow: string;
    low: string;
    moderate: string;
    high: string;
    veryHigh: string;
  };
  interventionFrequency: {
    checkupIntervalMonths: number;
    lipidPanelIntervalMonths: number;
    stressTestIntervalMonths: number;
  };
}

export interface AgeAdjustedAssessment {
  currentAge: number;
  ageGroup: string;
  gender: string;
  riskScore: number;
  riskCategory: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  ageAdjustedRiskCategory: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  riskComparison: string; // comparison to age cohort
  recommendedCheckups: string[];
  lifespanProjection: {
    age: number;
    expectedBioAge: number;
    ageAcceleration: number; // positive = older than chronological age
  };
  futureRiskProjection: Array<{ age: number; projectedRisk: number }>;
}

export interface RiskFactorWeights {
  age: number;
  cholesterol: number;
  bloodPressure: number;
  smoking: number;
  diabetes: number;
  familyHistory: number;
  bmi: number;
  physicalActivity: number;
  menopauseStatus?: number; // for women
}

class AgeSpecificThresholdsService {
  /**
   * Age-specific threshold data for different age groups (Indian population)
   * Based on Framingham, INTERHEART, and PURE India studies
   */
  private ageThresholds: Map<string, AgeThresholds[]> = this.initializeThresholds();

  /**
   * Age-specific factor weights for risk calculation
   */
  private factorWeights: Map<string, RiskFactorWeights> = this.initializeFactorWeights();

  /**
   * Initialize age-specific thresholds
   */
  private initializeThresholds(): Map<string, AgeThresholds[]> {
    const thresholds = new Map<string, AgeThresholds[]>();

    // Males 30-39 years
    thresholds.set('Male_30_39', [{
      ageGroup: 'Males 30-39',
      ageRange: [30, 39],
      gender: 'Male',
      riskThresholds: {
        veryLow: [0, 5],
        low: [5, 10],
        moderate: [10, 15],
        high: [15, 25],
        veryHigh: [25, 100]
      },
      biomarkerThresholds: {
        systolicBP: 120,
        diastolicBP: 80,
        totalCholesterol: 200,
        ldlCholesterol: 130,
        hdlCholesterol: 40,
        triglycerides: 150,
        glucose: 100,
        bmi: 25
      },
      managementRecommendations: {
        veryLow: 'Lifestyle optimization: Regular exercise, healthy diet, avoid smoking',
        low: 'Annual screening, lifestyle modifications, maintain healthy weight',
        moderate: 'Biannual checkups, consider lipid management, increase physical activity',
        high: 'Quarterly checkups, medication consideration, stress management',
        veryHigh: 'Monthly monitoring, aggressive medication therapy, cardiac testing'
      },
      interventionFrequency: {
        checkupIntervalMonths: 12,
        lipidPanelIntervalMonths: 24,
        stressTestIntervalMonths: 24
      }
    }]);

    // Males 40-49 years
    thresholds.set('Male_40_49', [{
      ageGroup: 'Males 40-49',
      ageRange: [40, 49],
      gender: 'Male',
      riskThresholds: {
        veryLow: [0, 7],
        low: [7, 14],
        moderate: [14, 22],
        high: [22, 35],
        veryHigh: [35, 100]
      },
      biomarkerThresholds: {
        systolicBP: 125,
        diastolicBP: 80,
        totalCholesterol: 200,
        ldlCholesterol: 130,
        hdlCholesterol: 40,
        triglycerides: 150,
        glucose: 100,
        bmi: 26
      },
      managementRecommendations: {
        veryLow: 'Maintain lifestyle, annual checkups, preventive approach',
        low: 'Annual screening, lifestyle focus, monitor risk factors',
        moderate: 'Biannual evaluations, lipid management initiation, stress testing',
        high: 'Quarterly monitoring, statin consideration, exercise stress test',
        veryHigh: 'Monthly checkups, aggressive lipid control, advanced cardiac testing'
      },
      interventionFrequency: {
        checkupIntervalMonths: 12,
        lipidPanelIntervalMonths: 12,
        stressTestIntervalMonths: 24
      }
    }]);

    // Males 50-59 years
    thresholds.set('Male_50_59', [{
      ageGroup: 'Males 50-59',
      ageRange: [50, 59],
      gender: 'Male',
      riskThresholds: {
        veryLow: [0, 10],
        low: [10, 20],
        moderate: [20, 30],
        high: [30, 45],
        veryHigh: [45, 100]
      },
      biomarkerThresholds: {
        systolicBP: 130,
        diastolicBP: 85,
        totalCholesterol: 210,
        ldlCholesterol: 140,
        hdlCholesterol: 35,
        triglycerides: 160,
        glucose: 110,
        bmi: 27
      },
      managementRecommendations: {
        veryLow: 'Regular exercise, heart-healthy diet, annual monitoring',
        low: 'Annual checkups with lipid panel, proactive risk factor management',
        moderate: 'Biannual evaluations, lipid management, stress test if indicated',
        high: 'Quarterly monitoring, pharmacotherapy initiation, cardiac workup',
        veryHigh: 'Monthly supervision, aggressive treatment, advanced diagnostics'
      },
      interventionFrequency: {
        checkupIntervalMonths: 12,
        lipidPanelIntervalMonths: 12,
        stressTestIntervalMonths: 12
      }
    }]);

    // Males 60+ years
    thresholds.set('Male_60Plus', [{
      ageGroup: 'Males 60+',
      ageRange: [60, 120],
      gender: 'Male',
      riskThresholds: {
        veryLow: [0, 15],
        low: [15, 25],
        moderate: [25, 40],
        high: [40, 55],
        veryHigh: [55, 100]
      },
      biomarkerThresholds: {
        systolicBP: 140,
        diastolicBP: 90,
        totalCholesterol: 220,
        ldlCholesterol: 150,
        hdlCholesterol: 30,
        triglycerides: 170,
        glucose: 120,
        bmi: 28
      },
      managementRecommendations: {
        veryLow: 'Maintain activity levels, regular screening, medication if needed',
        low: 'Semiannual checkups, lipid management, ECG annually',
        moderate: 'Quarterly monitoring, pharmacotherapy, echo if clinically indicated',
        high: 'Monthly checkups, intensive lipid lowering, stress testing',
        veryHigh: 'Intensive monitoring, advanced cardiac testing, specialist consultation'
      },
      interventionFrequency: {
        checkupIntervalMonths: 6,
        lipidPanelIntervalMonths: 6,
        stressTestIntervalMonths: 12
      }
    }]);

    // Females 30-39 years
    thresholds.set('Female_30_39', [{
      ageGroup: 'Females 30-39',
      ageRange: [30, 39],
      gender: 'Female',
      riskThresholds: {
        veryLow: [0, 3],
        low: [3, 8],
        moderate: [8, 12],
        high: [12, 20],
        veryHigh: [20, 100]
      },
      biomarkerThresholds: {
        systolicBP: 120,
        diastolicBP: 80,
        totalCholesterol: 200,
        ldlCholesterol: 130,
        hdlCholesterol: 50,
        triglycerides: 150,
        glucose: 100,
        bmi: 25
      },
      managementRecommendations: {
        veryLow: 'Lifestyle maintenance, healthy habits, preconception counseling if applicable',
        low: 'Biennial screening, diet optimization, stress management',
        moderate: 'Annual checkups, consider lipid monitoring, increase activity',
        high: 'Semiannual monitoring, medication consideration, comprehensive testing',
        veryHigh: 'Monthly checkups, aggressive medical therapy, specialist involvement'
      },
      interventionFrequency: {
        checkupIntervalMonths: 24,
        lipidPanelIntervalMonths: 24,
        stressTestIntervalMonths: 24
      }
    }]);

    // Females 40-49 years
    thresholds.set('Female_40_49', [{
      ageGroup: 'Females 40-49',
      ageRange: [40, 49],
      gender: 'Female',
      riskThresholds: {
        veryLow: [0, 5],
        low: [5, 12],
        moderate: [12, 18],
        high: [18, 28],
        veryHigh: [28, 100]
      },
      biomarkerThresholds: {
        systolicBP: 120,
        diastolicBP: 80,
        totalCholesterol: 200,
        ldlCholesterol: 130,
        hdlCholesterol: 50,
        triglycerides: 150,
        glucose: 100,
        bmi: 25
      },
      managementRecommendations: {
        veryLow: 'Annual screening, menopause preparation planning, maintain fitness',
        low: 'Annual checkups, hormone monitoring, lifestyle optimization',
        moderate: 'Biannual evaluations, lipid assessment, metabolic screening',
        high: 'Quarterly monitoring, HRT consideration, cardiac workup',
        veryHigh: 'Monthly supervision, aggressive therapy, specialist consultation'
      },
      interventionFrequency: {
        checkupIntervalMonths: 12,
        lipidPanelIntervalMonths: 12,
        stressTestIntervalMonths: 24
      }
    }]);

    // Females 50-59 years (Perimenopause/Postmenopause)
    thresholds.set('Female_50_59', [{
      ageGroup: 'Females 50-59',
      ageRange: [50, 59],
      gender: 'Female',
      riskThresholds: {
        veryLow: [0, 8],
        low: [8, 16],
        moderate: [16, 25],
        high: [25, 40],
        veryHigh: [40, 100]
      },
      biomarkerThresholds: {
        systolicBP: 130,
        diastolicBP: 85,
        totalCholesterol: 210,
        ldlCholesterol: 140,
        hdlCholesterol: 45,
        triglycerides: 160,
        glucose: 110,
        bmi: 27
      },
      managementRecommendations: {
        veryLow: 'Annual monitoring, hormone management, cardiovascular fitness',
        low: 'Annual checkups with lipid panel, HRT review if applicable',
        moderate: 'Biannual monitoring, lipid management, stress testing consideration',
        high: 'Quarterly checkups, pharmacotherapy, cardiac assessment',
        veryHigh: 'Monthly monitoring, intensive therapy, advanced diagnostics'
      },
      interventionFrequency: {
        checkupIntervalMonths: 12,
        lipidPanelIntervalMonths: 12,
        stressTestIntervalMonths: 12
      }
    }]);

    // Females 60+ years (Postmenopausal)
    thresholds.set('Female_60Plus', [{
      ageGroup: 'Females 60+',
      ageRange: [60, 120],
      gender: 'Female',
      riskThresholds: {
        veryLow: [0, 12],
        low: [12, 20],
        moderate: [20, 32],
        high: [32, 50],
        veryHigh: [50, 100]
      },
      biomarkerThresholds: {
        systolicBP: 140,
        diastolicBP: 90,
        totalCholesterol: 220,
        ldlCholesterol: 150,
        hdlCholesterol: 40,
        triglycerides: 170,
        glucose: 120,
        bmi: 28
      },
      managementRecommendations: {
        veryLow: 'Regular monitoring, maintain activity, preventive care',
        low: 'Semiannual checkups, ECG screening, exercise program',
        moderate: 'Quarterly monitoring, lipid management, stress testing',
        high: 'Monthly checkups, intensive pharmacotherapy, cardiac imaging',
        veryHigh: 'Intensive monitoring, advanced diagnostics, specialist care'
      },
      interventionFrequency: {
        checkupIntervalMonths: 6,
        lipidPanelIntervalMonths: 6,
        stressTestIntervalMonths: 12
      }
    }]);

    return thresholds;
  }

  /**
   * Initialize age-specific factor weights
   */
  private initializeFactorWeights(): Map<string, RiskFactorWeights> {
    const weights = new Map<string, RiskFactorWeights>();

    weights.set('Male_30_39', {
      age: 0.15,
      cholesterol: 0.20,
      bloodPressure: 0.18,
      smoking: 0.25,
      diabetes: 0.12,
      familyHistory: 0.05,
      bmi: 0.03,
      physicalActivity: 0.02
    });

    weights.set('Male_40_49', {
      age: 0.18,
      cholesterol: 0.22,
      bloodPressure: 0.20,
      smoking: 0.20,
      diabetes: 0.12,
      familyHistory: 0.05,
      bmi: 0.02,
      physicalActivity: 0.01
    });

    weights.set('Male_50_59', {
      age: 0.22,
      cholesterol: 0.20,
      bloodPressure: 0.22,
      smoking: 0.15,
      diabetes: 0.12,
      familyHistory: 0.05,
      bmi: 0.02,
      physicalActivity: 0.02
    });

    weights.set('Male_60Plus', {
      age: 0.25,
      cholesterol: 0.18,
      bloodPressure: 0.25,
      smoking: 0.10,
      diabetes: 0.12,
      familyHistory: 0.05,
      bmi: 0.03,
      physicalActivity: 0.02
    });

    weights.set('Female_30_39', {
      age: 0.10,
      cholesterol: 0.20,
      bloodPressure: 0.18,
      smoking: 0.25,
      diabetes: 0.15,
      familyHistory: 0.07,
      bmi: 0.03,
      physicalActivity: 0.02
    });

    weights.set('Female_40_49', {
      age: 0.12,
      cholesterol: 0.20,
      bloodPressure: 0.18,
      smoking: 0.22,
      diabetes: 0.15,
      familyHistory: 0.07,
      bmi: 0.04,
      physicalActivity: 0.02,
      menopauseStatus: 0.03
    });

    weights.set('Female_50_59', {
      age: 0.15,
      cholesterol: 0.22,
      bloodPressure: 0.20,
      smoking: 0.18,
      diabetes: 0.15,
      familyHistory: 0.07,
      bmi: 0.02,
      physicalActivity: 0.01
    });

    weights.set('Female_60Plus', {
      age: 0.22,
      cholesterol: 0.20,
      bloodPressure: 0.23,
      smoking: 0.12,
      diabetes: 0.15,
      familyHistory: 0.05,
      bmi: 0.02,
      physicalActivity: 0.01
    });

    return weights;
  }

  /**
   * Get age group key for a given age and gender
   */
  private getAgeGroupKey(age: number, gender: 'Male' | 'Female'): string {
    let ageGroup: string;

    if (age < 30) return null as any; // Not covered by thresholds
    else if (age >= 30 && age < 40) ageGroup = '30_39';
    else if (age >= 40 && age < 50) ageGroup = '40_49';
    else if (age >= 50 && age < 60) ageGroup = '50_59';
    else ageGroup = '60Plus';

    return `${gender}_${ageGroup}`;
  }

  /**
   * Get age-specific thresholds
   */
  getAgeThresholds(age: number, gender: 'Male' | 'Female'): AgeThresholds | null {
    const key = this.getAgeGroupKey(age, gender);
    const thresholds = this.ageThresholds.get(key);
    return thresholds ? thresholds[0] : null;
  }

  /**
   * Categorize risk based on age-specific thresholds
   */
  categorizeRiskByAge(
    age: number,
    gender: 'Male' | 'Female',
    riskScore: number
  ): 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' | null {
    const thresholds = this.getAgeThresholds(age, gender);
    if (!thresholds) return null;

    const t = thresholds.riskThresholds;

    if (riskScore <= t.veryLow[1]) return 'Very Low';
    if (riskScore <= t.low[1]) return 'Low';
    if (riskScore <= t.moderate[1]) return 'Moderate';
    if (riskScore <= t.high[1]) return 'High';
    return 'Very High';
  }

  /**
   * Get biomarker thresholds for age group
   */
  getBiomarkerThresholds(age: number, gender: 'Male' | 'Female'): Record<string, number> | null {
    const thresholds = this.getAgeThresholds(age, gender);
    return thresholds ? thresholds.biomarkerThresholds : null;
  }

  /**
   * Generate age-adjusted assessment
   */
  generateAgeAdjustedAssessment(
    age: number,
    gender: 'Male' | 'Female',
    riskScore: number,
    riskCategory: string
  ): AgeAdjustedAssessment {
    const thresholds = this.getAgeThresholds(age, gender);
    const ageGroupKey = this.getAgeGroupKey(age, gender);
    const weights = this.factorWeights.get(ageGroupKey);

    if (!thresholds || !weights) {
      return {
        currentAge: age,
        ageGroup: 'Unknown',
        gender,
        riskScore,
        riskCategory: riskCategory as any,
        ageAdjustedRiskCategory: riskCategory as any,
        riskComparison: 'Unable to compare',
        recommendedCheckups: [],
        lifespanProjection: {
          age,
          expectedBioAge: age,
          ageAcceleration: 0
        },
        futureRiskProjection: []
      };
    }

    const ageAdjustedCategory = this.categorizeRiskByAge(age, gender, riskScore) || 'Moderate';
    const comparison = this.compareToAgeCohort(age, gender, riskScore);
    const bioAge = this.calculateBiologicalAge(age, riskScore);
    const ageAcceleration = bioAge - age;

    return {
      currentAge: age,
      ageGroup: thresholds.ageGroup,
      gender,
      riskScore,
      riskCategory: riskCategory as any,
      ageAdjustedRiskCategory: ageAdjustedCategory,
      riskComparison: comparison,
      recommendedCheckups: this.getRecommendedCheckups(ageAdjustedCategory, thresholds),
      lifespanProjection: {
        age,
        expectedBioAge: bioAge,
        ageAcceleration
      },
      futureRiskProjection: this.projectFutureRisk(age, gender, riskScore)
    };
  }

  /**
   * Compare to age cohort
   */
  private compareToAgeCohort(age: number, gender: 'Male' | 'Female', riskScore: number): string {
    // Average risk by age group (based on population data)
    const cohortAverages: Record<string, number> = {
      'Male_30_39': 8,
      'Male_40_49': 18,
      'Male_50_59': 26,
      'Male_60Plus': 40,
      'Female_30_39': 4,
      'Female_40_49': 10,
      'Female_50_59': 22,
      'Female_60Plus': 35
    };

    const key = this.getAgeGroupKey(age, gender);
    const cohortAvg = cohortAverages[key] || 20;
    const percentileDiff = ((riskScore - cohortAvg) / cohortAvg) * 100;

    if (percentileDiff < -30) return 'Significantly below age cohort average';
    if (percentileDiff < -15) return 'Below age cohort average';
    if (percentileDiff <= 15) return 'Similar to age cohort average';
    if (percentileDiff <= 30) return 'Above age cohort average';
    return 'Significantly above age cohort average';
  }

  /**
   * Calculate biological age
   */
  private calculateBiologicalAge(chronologicalAge: number, riskScore: number): number {
    // Simple model: higher risk increases biological age
    const riskMultiplier = (riskScore / 50) * 0.5; // 0.5 year per 50% risk
    return chronologicalAge + riskMultiplier;
  }

  /**
   * Project future risk
   */
  private projectFutureRisk(age: number, gender: 'Male' | 'Female', currentRisk: number): Array<{ age: number; projectedRisk: number }> {
    const projections: Array<{ age: number; projectedRisk: number }> = [];
    const annualRiskIncrease = 1.5; // Average annual increase in percentage points

    for (let futureAge = age + 5; futureAge <= age + 20; futureAge += 5) {
      const yearsAhead = futureAge - age;
      // Simple linear projection with age-based acceleration
      const ageAccelerator = futureAge > 55 ? 1.5 : 1.0;
      const projectedRisk = Math.min(
        100,
        currentRisk + (annualRiskIncrease * yearsAhead * ageAccelerator)
      );
      
      projections.push({ age: futureAge, projectedRisk: Math.round(projectedRisk * 10) / 10 });
    }

    return projections;
  }

  /**
   * Get recommended checkups
   */
  private getRecommendedCheckups(riskCategory: string, thresholds: AgeThresholds): string[] {
    const checkups: string[] = [];

    const baseCheckup = `General cardiac checkup every ${thresholds.interventionFrequency.checkupIntervalMonths} months`;
    checkups.push(baseCheckup);

    const lipidCheckup = `Lipid panel every ${thresholds.interventionFrequency.lipidPanelIntervalMonths} months`;
    checkups.push(lipidCheckup);

    if (riskCategory === 'High' || riskCategory === 'Very High') {
      const stressTest = `Exercise stress test every ${thresholds.interventionFrequency.stressTestIntervalMonths} months`;
      checkups.push(stressTest);
      checkups.push('Echocardiography as clinically indicated');
      checkups.push('Coronary calcium score evaluation');
    }

    if (riskCategory === 'Moderate' || riskCategory === 'High' || riskCategory === 'Very High') {
      checkups.push('Blood glucose testing');
      checkups.push('Microalbuminuria screening (if diabetic)');
    }

    return checkups;
  }

  /**
   * Get management strategy by age and risk
   */
  getManagementStrategy(
    age: number,
    gender: 'Male' | 'Female',
    riskCategory: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'
  ): string {
    const thresholds = this.getAgeThresholds(age, gender);
    if (!thresholds) return 'Consult healthcare provider';

    return thresholds.managementRecommendations[riskCategory] || 'Standard risk management';
  }

  /**
   * Get risk progression warning
   */
  getRiskProgressionWarning(
    age: number,
    gender: 'Male' | 'Female',
    currentRisk: number,
    previousRisk?: number
  ): string | null {
    if (!previousRisk) return null;

    const riskIncrease = currentRisk - previousRisk;

    if (riskIncrease > 10) {
      return `⚠️ Significant risk increase (${riskIncrease.toFixed(1)}%) detected. Immediate medical consultation recommended.`;
    }

    if (riskIncrease > 5) {
      return `Risk has increased by ${riskIncrease.toFixed(1)}%. Schedule evaluation with your healthcare provider.`;
    }

    if (riskIncrease < -10) {
      return `✓ Excellent improvement (${Math.abs(riskIncrease).toFixed(1)}% reduction). Continue current management plan.`;
    }

    return null;
  }

  /**
   * Get lifespan risk assessment
   */
  getLifespanRiskAssessment(
    age: number,
    gender: 'Male' | 'Female',
    riskScore: number,
    lifestyleScore: number
  ): {
    mortalityRisk: number;
    lifespanImpact: number;
    preventionPotential: number;
    recommendations: string[];
  } {
    const baseLifespan = gender === 'Male' ? 72 : 77; // Indian average
    const riskReduction = (lifestyleScore / 100) * 10; // Up to 10 years benefit
    const riskIncrease = (riskScore / 100) * 15; // Up to 15 years loss

    const mortalityRisk = (riskScore / 100) * 0.5; // Simplified: 0-50% mortality increase
    const projectedLifespan = baseLifespan - riskIncrease + riskReduction;
    const lifespanImpact = baseLifespan - projectedLifespan;
    const preventionPotential = riskIncrease * 0.7; // 70% of risk potentially preventable

    return {
      mortalityRisk: Math.min(100, Math.round(mortalityRisk * 100) / 100),
      lifespanImpact: Math.round(lifespanImpact * 10) / 10,
      preventionPotential: Math.round(preventionPotential * 10) / 10,
      recommendations: [
        'Smoking cessation: Potential lifespan gain +10 years',
        'Regular exercise: Potential lifespan gain +7 years',
        'Healthy diet: Potential lifespan gain +5 years',
        'Stress management: Potential lifespan gain +3 years',
        'Weight management: Potential lifespan gain +3 years'
      ]
    };
  }

  /**
   * Export comprehensive age analysis report
   */
  exportAgeAnalysisReport(
    age: number,
    gender: 'Male' | 'Female',
    riskScore: number,
    riskCategory: string
  ): string {
    const assessment = this.generateAgeAdjustedAssessment(age, gender, riskScore, riskCategory);
    const thresholds = this.getAgeThresholds(age, gender);
    const management = this.getManagementStrategy(age, gender, assessment.ageAdjustedRiskCategory);

    let report = `# Age-Specific Risk Assessment Report\n\n`;
    report += `**Age Group**: ${assessment.ageGroup}\n`;
    report += `**Gender**: ${gender}\n`;
    report += `**Risk Score**: ${riskScore.toFixed(1)}%\n\n`;

    report += `## Age-Adjusted Analysis\n`;
    report += `- **Age-Adjusted Category**: ${assessment.ageAdjustedRiskCategory}\n`;
    report += `- **Comparison to Cohort**: ${assessment.riskComparison}\n`;
    report += `- **Biological Age**: ${assessment.lifespanProjection.expectedBioAge.toFixed(1)} years (${assessment.lifespanProjection.ageAcceleration > 0 ? '+' : ''}${assessment.lifespanProjection.ageAcceleration.toFixed(1)} years difference)\n\n`;

    report += `## Biomarker Thresholds\n`;
    if (thresholds) {
      report += `- Systolic BP Target: < ${thresholds.biomarkerThresholds.systolicBP} mmHg\n`;
      report += `- LDL Cholesterol Target: < ${thresholds.biomarkerThresholds.ldlCholesterol} mg/dL\n`;
      report += `- HDL Cholesterol Target: > ${thresholds.biomarkerThresholds.hdlCholesterol} mg/dL\n`;
      report += `- BMI Target: < ${thresholds.biomarkerThresholds.bmi}\n\n`;
    }

    report += `## Recommended Checkups\n`;
    assessment.recommendedCheckups.forEach(checkup => {
      report += `- ${checkup}\n`;
    });

    report += `\n## Management Strategy\n`;
    report += `${management}\n\n`;

    report += `## Future Risk Projection\n`;
    assessment.futureRiskProjection.forEach(proj => {
      report += `- Age ${proj.age}: ${proj.projectedRisk.toFixed(1)}%\n`;
    });

    return report;
  }
}

export default new AgeSpecificThresholdsService();
