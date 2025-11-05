/**
 * Genetic Risk Integration Service
 * Incorporates genetic markers and familial risk patterns into cardiac risk assessment
 * Includes LDL genotype, familial hypercholesterolemia, and inherited risk factors
 * 
 * Phase 5 Task 3: Genetic Risk Factor Integration
 */

export interface GeneticProfile {
  patientId: string;
  testDate: Date;
  hasTestingData: boolean;
  
  // LDL Receptor Gene (LDLR) - main FH gene
  ldlrGenotype: 'wild-type' | 'heterozygous' | 'homozygous' | 'unknown';
  ldlrMutations?: string[];
  
  // Apolipoprotein B (APOB) gene
  apobGenotype: 'wild-type' | 'mutant' | 'unknown';
  apobMutations?: string[];
  
  // Proprotein Convertase Subtilisin/Kexin Type 9 (PCSK9)
  pcsk9Genotype: 'wild-type' | 'loss-of-function' | 'gain-of-function' | 'unknown';
  
  // ApoE genotype (affects lipid metabolism)
  apoeGenotype: 'E2/E2' | 'E2/E3' | 'E2/E4' | 'E3/E3' | 'E3/E4' | 'E4/E4' | 'unknown';
  
  // Lipoprotein(a) genetic risk
  lpAGenotype: 'low-risk' | 'intermediate-risk' | 'high-risk' | 'unknown';
  lpALevel?: number; // nmol/L
  
  // CYP2C9 (affects warfarin metabolism)
  cyp2c9Genotype: 'normal' | 'intermediate' | 'poor' | 'unknown';
  
  // Factor V Leiden (thrombophilia)
  factorVLeiden: boolean;
  
  // Prothrombin G20210A
  prothrombinMutation: boolean;
  
  // MTHFR (methylenetetrahydrofolate reductase)
  mthfrGenotype: 'normal' | 'heterozygous' | 'homozygous' | 'unknown';
}

export interface FamilialHypercholesterolemia {
  hasCondition: boolean;
  clinicalDiagnosis?: boolean;
  geneticConfirmed?: boolean;
  severity: 'mild' | 'moderate' | 'severe' | 'homozygous';
  ldlAtDiagnosis?: number;
  tenantPropsScore?: number;
  familyHistory: {
    parentWithFH?: boolean;
    siblingWithFH?: boolean;
    childrenWithFH?: number;
    prematureCAD?: boolean;
  };
}

export interface GeneticRiskScore {
  score: number; // 0-100
  category: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  primaryRisks: Array<{ factor: string; contribution: number }>;
  recommendedInterventions: string[];
  geneticCounselingRecommended: boolean;
  riskModifiers: string[];
}

export interface InheritedRiskFactor {
  name: string;
  genotype: string;
  inheritancePattern: 'autosomal-dominant' | 'autosomal-recessive' | 'x-linked' | 'multifactorial';
  riskMultiplier: number;
  inheritanceRiskForChildren?: number; // percentage
}

class GeneticRiskService {
  /**
   * Analyze genetic profile
   */
  analyzeGeneticProfile(geneticData: GeneticProfile): GeneticRiskScore {
    let riskScore = 0;
    const primaryRisks: Array<{ factor: string; contribution: number }> = [];
    const riskModifiers: string[] = [];
    const interventions: string[] = [];
    let counselingRecommended = false;

    // LDLR gene analysis (most important for FH)
    if (geneticData.ldlrGenotype === 'homozygous') {
      riskScore += 40;
      primaryRisks.push({ factor: 'Homozygous LDLR mutation (severe FH)', contribution: 40 });
      counselingRecommended = true;
      interventions.push('Immediate statin + ezetimibe therapy');
      interventions.push('Consider PCSK9 inhibitors or bempedoic acid');
      interventions.push('Screen all family members');
    } else if (geneticData.ldlrGenotype === 'heterozygous') {
      riskScore += 20;
      primaryRisks.push({ factor: 'Heterozygous LDLR mutation (FH)', contribution: 20 });
      counselingRecommended = true;
      interventions.push('High-intensity statin therapy');
      interventions.push('Target LDL < 70 mg/dL');
    }

    // APOB gene analysis
    if (geneticData.apobGenotype === 'mutant') {
      riskScore += 15;
      primaryRisks.push({ factor: 'APOB mutation', contribution: 15 });
      interventions.push('Aggressive lipid management');
    }

    // PCSK9 analysis
    if (geneticData.pcsk9Genotype === 'gain-of-function') {
      riskScore += 12;
      primaryRisks.push({ factor: 'PCSK9 gain-of-function', contribution: 12 });
      interventions.push('PCSK9 inhibitor therapy beneficial');
    } else if (geneticData.pcsk9Genotype === 'loss-of-function') {
      riskScore -= 5; // Protective
      riskModifiers.push('Loss-of-function PCSK9 (protective)');
    }

    // ApoE genotype analysis
    switch (geneticData.apoeGenotype) {
      case 'E4/E4':
        riskScore += 10;
        primaryRisks.push({ factor: 'ApoE4/E4 (high lipid risk)', contribution: 10 });
        break;
      case 'E3/E4':
        riskScore += 5;
        primaryRisks.push({ factor: 'ApoE3/E4 (intermediate risk)', contribution: 5 });
        break;
      case 'E2/E2':
        riskScore -= 3;
        riskModifiers.push('ApoE2/E2 (protective)');
        break;
    }

    // Lipoprotein(a) genetic risk
    if (geneticData.lpAGenotype === 'high-risk') {
      riskScore += 8;
      primaryRisks.push({ factor: 'High Lp(a) genetic risk', contribution: 8 });
      if (geneticData.lpALevel && geneticData.lpALevel > 50) {
        riskScore += 5;
        primaryRisks.push({ factor: 'Elevated Lp(a) level', contribution: 5 });
        interventions.push('Consider Lp(a)-lowering therapies');
      }
    }

    // Thrombophilia assessment
    if (geneticData.factorVLeiden) {
      riskScore += 5;
      primaryRisks.push({ factor: 'Factor V Leiden mutation', contribution: 5 });
      interventions.push('Increased thrombotic risk - anticoagulation if needed');
    }

    if (geneticData.prothrombinMutation) {
      riskScore += 4;
      primaryRisks.push({ factor: 'Prothrombin G20210A mutation', contribution: 4 });
    }

    // CYP2C9 affects drug metabolism
    if (geneticData.cyp2c9Genotype === 'poor') {
      riskModifiers.push('Poor warfarin metabolizer - requires dose adjustment');
      interventions.push('Genetic-guided warfarin dosing');
    }

    // Generate recommendations
    if (riskScore > 40) {
      counselingRecommended = true;
      interventions.push('Comprehensive genetic counseling recommended');
      interventions.push('Family screening for genetic mutations');
    }

    if (interventions.length === 0) {
      interventions.push('Continue standard cardiovascular risk management');
    }

    // Determine category
    let category: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
    if (riskScore < 10) category = 'very-low';
    else if (riskScore < 20) category = 'low';
    else if (riskScore < 40) category = 'moderate';
    else if (riskScore < 60) category = 'high';
    else category = 'very-high';

    return {
      score: Math.min(100, Math.max(0, riskScore)),
      category,
      primaryRisks,
      recommendedInterventions: interventions,
      geneticCounselingRecommended: counselingRecommended,
      riskModifiers
    };
  }

  /**
   * Analyze familial hypercholesterolemia
   */
  analyzeFamilialHypercholesterolemia(fh: FamilialHypercholesterolemia): {
    diagnosis: string;
    severity: string;
    recommendations: string[];
    inheritanceRisk: number;
  } {
    let diagnosis = 'No FH detected';
    let inheritanceRisk = 0;

    if (fh.hasCondition) {
      if (fh.severity === 'homozygous') {
        diagnosis = 'Homozygous Familial Hypercholesterolemia (very rare, 1 in 160,000-1,000,000)';
        inheritanceRisk = 50; // 50% chance each child
      } else if (fh.severity === 'severe') {
        diagnosis = 'Severe Familial Hypercholesterolemia';
        inheritanceRisk = 50;
      } else if (fh.severity === 'moderate') {
        diagnosis = 'Moderate Familial Hypercholesterolemia';
        inheritanceRisk = 50;
      } else {
        diagnosis = 'Mild Familial Hypercholesterolemia';
        inheritanceRisk = 50;
      }
    }

    const recommendations: string[] = [];

    if (fh.hasCondition) {
      recommendations.push('Genetic testing to confirm mutation');
      recommendations.push('Start high-intensity statin therapy');
      recommendations.push('Add ezetimibe (if not already taking)');

      if (fh.ldlAtDiagnosis && fh.ldlAtDiagnosis > 500) {
        recommendations.push('Consider PCSK9 inhibitors or bempedoic acid');
        recommendations.push('Target LDL < 55 mg/dL');
      }

      recommendations.push('Screen parents, siblings, and children');
      recommendations.push('Annual cardiovascular assessment');
    }

    recommendations.push('Genetic counseling for family members');

    return {
      diagnosis,
      severity: fh.severity,
      recommendations,
      inheritanceRisk
    };
  }

  /**
   * Calculate genetic contribution to total cardiac risk
   */
  calculateGeneticContribution(
    geneticRiskScore: GeneticRiskScore,
    baselineRisk: number
  ): {
    adjustedRisk: number;
    geneticContribution: number;
    multiplier: number;
  } {
    // Map genetic score to multiplier
    let multiplier = 1.0;

    if (geneticRiskScore.category === 'very-high') {
      multiplier = 2.5; // 150% increase
    } else if (geneticRiskScore.category === 'high') {
      multiplier = 2.0; // 100% increase
    } else if (geneticRiskScore.category === 'moderate') {
      multiplier = 1.5; // 50% increase
    } else if (geneticRiskScore.category === 'low') {
      multiplier = 1.15; // 15% increase
    } else {
      multiplier = 1.0; // No increase
    }

    // Apply protective modifiers
    const protectiveCount = geneticRiskScore.riskModifiers.filter(m =>
      m.includes('protective') || m.includes('loss-of-function')
    ).length;

    multiplier = multiplier * Math.pow(0.85, protectiveCount);

    const adjustedRisk = baselineRisk * multiplier;
    const geneticContribution = adjustedRisk - baselineRisk;

    return {
      adjustedRisk: Math.min(100, adjustedRisk),
      geneticContribution,
      multiplier: Math.round(multiplier * 100) / 100
    };
  }

  /**
   * Get inheritance risk for offspring
   */
  getOffspringInheritanceRisk(
    parentGenotype: string,
    otherParentGenotype?: string
  ): {
    riskPercentage: number;
    description: string;
  } {
    // Simplified autosomal dominant inheritance (most cardiac genetic conditions)
    if (parentGenotype.includes('heterozygous') || parentGenotype.includes('mutation')) {
      return {
        riskPercentage: 50,
        description: 'Each child has approximately 50% chance of inheriting the mutation'
      };
    }

    if (parentGenotype.includes('homozygous')) {
      return {
        riskPercentage: 100,
        description: 'All children will inherit mutations from both parents'
      };
    }

    return {
      riskPercentage: 0,
      description: 'No known genetic risk for offspring'
    };
  }

  /**
   * Generate genetic assessment report
   */
  generateGeneticReport(profile: GeneticProfile, fh?: FamilialHypercholesterolemia): string {
    const geneticRisk = this.analyzeGeneticProfile(profile);
    const fhAnalysis = fh ? this.analyzeFamilialHypercholesterolemia(fh) : null;

    let report = '# Genetic Risk Assessment Report\n\n';
    report += `Date: ${new Date().toLocaleString()}\n\n`;

    report += '## Genetic Risk Score\n';
    report += `- **Score**: ${geneticRisk.score}/100\n`;
    report += `- **Category**: ${geneticRisk.category.toUpperCase()}\n\n`;

    report += '## Primary Genetic Risk Factors\n';
    geneticRisk.primaryRisks.forEach(risk => {
      report += `- ${risk.factor} (Contribution: +${risk.contribution})\n`;
    });

    if (geneticRisk.riskModifiers.length > 0) {
      report += '\n## Protective Factors\n';
      geneticRisk.riskModifiers.forEach(modifier => {
        report += `- ${modifier}\n`;
      });
    }

    if (fhAnalysis) {
      report += '\n## Familial Hypercholesterolemia Analysis\n';
      report += `- **Diagnosis**: ${fhAnalysis.diagnosis}\n`;
      report += `- **Inheritance Risk for Children**: ${fhAnalysis.inheritanceRisk}%\n`;
    }

    report += '\n## Recommended Interventions\n';
    geneticRisk.recommendedInterventions.forEach((intervention, i) => {
      report += `${i + 1}. ${intervention}\n`;
    });

    if (geneticRisk.geneticCounselingRecommended) {
      report += '\n⚠️ **Genetic counseling is strongly recommended**\n';
    }

    return report;
  }

  /**
   * Estimate cardiovascular age based on genetics
   */
  estimateCVAgeFromGenetics(chronologicalAge: number, geneticRiskScore: GeneticRiskScore): number {
    let ageAdjustment = 0;

    switch (geneticRiskScore.category) {
      case 'very-high':
        ageAdjustment = 20;
        break;
      case 'high':
        ageAdjustment = 15;
        break;
      case 'moderate':
        ageAdjustment = 8;
        break;
      case 'low':
        ageAdjustment = 2;
        break;
      case 'very-low':
        ageAdjustment = -3;
        break;
    }

    return chronologicalAge + ageAdjustment;
  }
}

export default new GeneticRiskService();
