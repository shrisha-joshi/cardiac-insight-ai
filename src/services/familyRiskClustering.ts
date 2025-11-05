/**
 * Family Risk Clustering Service
 * Analyzes family history patterns and creates family-level risk scores
 * Identifies high-risk families and inheritance patterns
 * 
 * Phase 5 Task 4: Family Risk Clustering & Analysis
 */

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'self' | 'parent' | 'sibling' | 'child' | 'grandparent' | 'aunt' | 'uncle' | 'cousin';
  age?: number;
  gender: 'Male' | 'Female';
  riskScore?: number;
  conditions: string[];
  prematureCAD?: boolean; // CAD before age 55 (M) or 65 (F)
  deathAge?: number;
  causeOfDeath?: string;
  isDeceased: boolean;
}

export interface FamilyCluster {
  familyId: string;
  createdAt: Date;
  members: FamilyMember[];
  familyRiskScore: number;
  riskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  inheritancePattern: string;
  affectedGenerations: number;
  estimatedMutationCarriers: number;
  recommendations: string[];
  screeningRecommendations: string[];
}

export interface ConditionFrequency {
  condition: string;
  count: number;
  percentage: number;
  affectedMembers: string[];
  averageAgeOfOnset?: number;
  prematureOnset: boolean; // before typical age
}

export interface FamilyRiskSummary {
  clusterScore: number;
  primaryConditions: ConditionFrequency[];
  inheritancePattern: 'autosomal-dominant' | 'autosomal-recessive' | 'x-linked' | 'multifactorial' | 'unclear';
  highRiskLineage: boolean; // Strong vertical transmission
  requiresGeneticTesting: boolean;
  relationshipConcern: string | null;
}

class FamilyRiskClusteringService {
  private familyClusters: Map<string, FamilyCluster> = new Map();
  private memberToFamily: Map<string, string> = new Map();

  /**
   * Create new family cluster
   */
  createFamilyCluster(familyId: string, members: FamilyMember[]): FamilyCluster {
    const cluster: FamilyCluster = {
      familyId,
      createdAt: new Date(),
      members,
      familyRiskScore: 0,
      riskCategory: 'very-low',
      inheritancePattern: '',
      affectedGenerations: 0,
      estimatedMutationCarriers: 0,
      recommendations: [],
      screeningRecommendations: []
    };

    // Analyze family
    this.analyzeFamilyCluster(cluster);

    this.familyClusters.set(familyId, cluster);

    // Map members to family
    members.forEach(member => {
      this.memberToFamily.set(member.id, familyId);
    });

    return cluster;
  }

  /**
   * Analyze family cluster
   */
  private analyzeFamilyCluster(cluster: FamilyCluster): void {
    // Calculate family risk score
    cluster.familyRiskScore = this.calculateFamilyRiskScore(cluster.members);

    // Determine category
    if (cluster.familyRiskScore < 15) cluster.riskCategory = 'very-low';
    else if (cluster.familyRiskScore < 30) cluster.riskCategory = 'low';
    else if (cluster.familyRiskScore < 50) cluster.riskCategory = 'moderate';
    else if (cluster.familyRiskScore < 75) cluster.riskCategory = 'high';
    else cluster.riskCategory = 'very-high';

    // Analyze inheritance pattern
    cluster.inheritancePattern = this.identifyInheritancePattern(cluster.members);

    // Count affected generations
    cluster.affectedGenerations = this.countAffectedGenerations(cluster.members);

    // Estimate mutation carriers
    cluster.estimatedMutationCarriers = this.estimateMutationCarriers(cluster.members);

    // Generate recommendations
    cluster.recommendations = this.generateFamilyRecommendations(cluster);
    cluster.screeningRecommendations = this.generateScreeningRecommendations(cluster);
  }

  /**
   * Calculate family risk score (0-100)
   */
  private calculateFamilyRiskScore(members: FamilyMember[]): number {
    let score = 0;

    // Count affected members
    const affected = members.filter(m => m.conditions.length > 0);
    const affectionRate = (affected.length / members.length) * 100;

    // Affection rate scoring
    if (affectionRate > 75) score += 30;
    else if (affectionRate > 50) score += 20;
    else if (affectionRate > 25) score += 10;
    else score += 5;

    // Premature onset scoring
    const prematureCADCount = members.filter(m => m.prematureCAD).length;
    score += prematureCADCount * 5;

    // Early death scoring
    const earlyDeaths = members.filter(m => m.isDeceased && m.deathAge && m.deathAge < 70).length;
    score += earlyDeaths * 8;

    // Multiple affected generations
    const generationsAffected = this.countAffectedGenerations(members);
    score += (generationsAffected - 1) * 10;

    // Consanguinity (relatives marrying)
    const hasConsanguinity = this.detectConsanguinity(members);
    if (hasConsanguinity) score += 15;

    // Early-onset disease (age < 40)
    const veryEarlyOnset = members.filter(m =>
      m.conditions.length > 0 && m.age && m.age < 40
    ).length;
    score += veryEarlyOnset * 10;

    return Math.min(100, score);
  }

  /**
   * Identify inheritance pattern
   */
  private identifyInheritancePattern(members: FamilyMember[]): string {
    const affected = members.filter(m => m.conditions.length > 0);

    // Check for vertical transmission (parent-child)
    let verticalTransmission = 0;
    let skipsGenerations = 0;

    members.forEach(member => {
      if ((member.relation === 'parent' || member.relation === 'grandparent') && member.conditions.length > 0) {
        // Check if children are affected
        const affectedChildren = members.filter(c =>
          (c.relation === 'child' || c.relation === 'sibling') && c.conditions.length > 0
        );
        if (affectedChildren.length > 0) {
          verticalTransmission++;
        }
      }
    });

    // Check for X-linked pattern (males more affected)
    const malesAffected = affected.filter(m => m.gender === 'Male').length;
    const femalesAffected = affected.filter(m => m.gender === 'Female').length;
    const isXLinked = malesAffected > femalesAffected * 2;

    // Determine pattern
    if (verticalTransmission > affected.length * 0.7) {
      return 'Autosomal Dominant - Strong vertical transmission observed';
    } else if (isXLinked) {
      return 'X-Linked - Predominantly affects males';
    } else if (affected.length > 0 && malesAffected > 0 && femalesAffected > 0) {
      return 'Autosomal Recessive or Multifactorial - Both sexes affected';
    }

    return 'Multifactorial - Complex inheritance pattern';
  }

  /**
   * Count affected generations
   */
  private countAffectedGenerations(members: FamilyMember[]): number {
    const generations = new Map<string, boolean>();

    // Map generations
    members.forEach(member => {
      let gen = 'self';
      if (member.relation === 'grandparent') gen = 'grandparent';
      else if (member.relation === 'parent') gen = 'parent';
      else if (member.relation === 'child') gen = 'child';

      if (member.conditions.length > 0) {
        generations.set(gen, true);
      }
    });

    return generations.size;
  }

  /**
   * Detect consanguinity (family marriages)
   */
  private detectConsanguinity(members: FamilyMember[]): boolean {
    // Check for unusual relationship patterns that might indicate consanguinity
    const relatedPairings = members.filter(m =>
      m.relation === 'cousin' && m.conditions.length > 0
    ).length;

    return relatedPairings > 0;
  }

  /**
   * Estimate mutation carriers
   */
  private estimateMutationCarriers(members: FamilyMember[]): number {
    const affected = members.filter(m => m.conditions.length > 0).length;

    // In autosomal dominant: each affected person has ~50% chance of passing to children
    // Assume 1-2 unaffected carriers per affected member
    const estimatedCarriers = Math.ceil(affected * 1.5);

    return Math.min(members.length, estimatedCarriers);
  }

  /**
   * Generate family recommendations
   */
  private generateFamilyRecommendations(cluster: FamilyCluster): string[] {
    const recommendations: string[] = [];

    if (cluster.familyRiskScore > 70) {
      recommendations.push('URGENT: This family appears to have a significant genetic predisposition');
      recommendations.push('Recommend comprehensive family genetic counseling');
      recommendations.push('Consider genetic testing for index case and cascade screening');
      recommendations.push('Family members should undergo cardiovascular risk assessment');
    } else if (cluster.familyRiskScore > 50) {
      recommendations.push('Strong family history of cardiovascular disease');
      recommendations.push('Genetic counseling recommended for the family');
      recommendations.push('All family members should be screened');
    } else if (cluster.familyRiskScore > 30) {
      recommendations.push('Moderate family history of cardiovascular disease');
      recommendations.push('Family members should be aware of increased risk');
      recommendations.push('Regular screening recommended');
    }

    if (cluster.affectedGenerations >= 3) {
      recommendations.push('Multiple generations affected - strong genetic component likely');
    }

    if (cluster.inheritancePattern.includes('Dominant')) {
      recommendations.push('Autosomal dominant pattern suggests high carrier risk');
    }

    return recommendations;
  }

  /**
   * Generate screening recommendations
   */
  private generateScreeningRecommendations(cluster: FamilyCluster): string[] {
    const recommendations: string[] = [];

    // All family members
    recommendations.push('Lipid panel (total, LDL, HDL, triglycerides)');
    recommendations.push('Blood pressure monitoring');
    recommendations.push('Fasting glucose/HbA1c');
    recommendations.push('Annual risk factor assessment');

    // Higher risk families
    if (cluster.familyRiskScore > 50) {
      recommendations.push('Early cardiovascular imaging (ECG, stress test by age 40-50)');
      recommendations.push('Coronary calcium scoring');
      recommendations.push('Consider genetic testing for FH and other mutations');
      recommendations.push('ECG screening every 1-2 years');
    }

    if (cluster.riskCategory === 'very-high') {
      recommendations.push('Genetic testing strongly recommended');
      recommendations.push('Cardiology referral for cascade screening');
      recommendations.push('Advanced imaging (echo, stress test)');
      recommendations.push('Consider preventive pharmacotherapy');
    }

    return recommendations;
  }

  /**
   * Get family risk summary
   */
  getFamilyRiskSummary(familyId: string): FamilyRiskSummary | null {
    const cluster = this.familyClusters.get(familyId);
    if (!cluster) return null;

    const conditions = this.analyzeConditionFrequency(cluster.members);
    const primaryConditions = conditions.sort((a, b) => b.count - a.count).slice(0, 3);

    return {
      clusterScore: cluster.familyRiskScore,
      primaryConditions,
      inheritancePattern: this.inferInheritanceMode(primaryConditions),
      highRiskLineage: cluster.affectedGenerations >= 2 && cluster.familyRiskScore > 50,
      requiresGeneticTesting: cluster.familyRiskScore > 40,
      relationshipConcern: this.checkRelationshipConcerns(cluster.members)
    };
  }

  /**
   * Analyze condition frequency
   */
  private analyzeConditionFrequency(members: FamilyMember[]): ConditionFrequency[] {
    const conditionMap = new Map<string, { count: number; members: string[]; ages: number[] }>();

    members.forEach(member => {
      member.conditions.forEach(condition => {
        const existing = conditionMap.get(condition) || { count: 0, members: [], ages: [] };
        existing.count++;
        existing.members.push(member.name);
        if (member.age) existing.ages.push(member.age);
        conditionMap.set(condition, existing);
      });
    });

    const frequencies: ConditionFrequency[] = [];

    conditionMap.forEach((data, condition) => {
      const avgAge = data.ages.length > 0 ?
        data.ages.reduce((a, b) => a + b, 0) / data.ages.length : undefined;

      const prematureOnset = avgAge ? avgAge < 50 : false;

      frequencies.push({
        condition,
        count: data.count,
        percentage: (data.count / members.length) * 100,
        affectedMembers: data.members,
        averageAgeOfOnset: avgAge,
        prematureOnset
      });
    });

    return frequencies;
  }

  /**
   * Infer inheritance mode
   */
  private inferInheritanceMode(conditions: ConditionFrequency[]): 'autosomal-dominant' | 'autosomal-recessive' | 'x-linked' | 'multifactorial' | 'unclear' {
    if (conditions.length === 0) return 'unclear';

    // If one condition is very common and premature, likely monogenic dominant
    if (conditions[0].percentage > 40 && conditions[0].prematureOnset) {
      return 'autosomal-dominant';
    }

    // Multiple conditions suggest multifactorial
    if (conditions.length > 2) {
      return 'multifactorial';
    }

    return 'unclear';
  }

  /**
   * Check for relationship concerns
   */
  private checkRelationshipConcerns(members: FamilyMember[]): string | null {
    // Check for consanguinity
    const cousins = members.filter(m => m.relation === 'cousin').length;
    if (cousins > 1) {
      return 'Potential consanguinity detected - may increase recessive condition risk';
    }

    // Check for multiple partners (suggests X-linked)
    const hasXLinkedPattern = members.filter(m => m.gender === 'Male' && m.conditions.length > 0).length >
      members.filter(m => m.gender === 'Female' && m.conditions.length > 0).length * 2;

    if (hasXLinkedPattern) {
      return 'Pattern suggestive of possible X-linked condition';
    }

    return null;
  }

  /**
   * Generate comprehensive family report
   */
  generateFamilyReport(familyId: string): string {
    const cluster = this.familyClusters.get(familyId);
    if (!cluster) return 'Family not found';

    const summary = this.getFamilyRiskSummary(familyId);
    if (!summary) return 'Unable to analyze family';

    let report = '# Family Cardiovascular Risk Report\n\n';

    report += `Family ID: ${familyId}\n`;
    report += `Analysis Date: ${new Date().toLocaleString()}\n`;
    report += `Total Members: ${cluster.members.length}\n`;
    report += `Affected Members: ${cluster.members.filter(m => m.conditions.length > 0).length}\n\n`;

    report += '## Family Risk Assessment\n';
    report += `- **Family Risk Score**: ${cluster.familyRiskScore}/100\n`;
    report += `- **Risk Category**: ${cluster.riskCategory.toUpperCase()}\n`;
    report += `- **Affected Generations**: ${cluster.affectedGenerations}\n`;
    report += `- **Estimated Mutation Carriers**: ${cluster.estimatedMutationCarriers}\n`;
    report += `- **Inheritance Pattern**: ${cluster.inheritancePattern}\n\n`;

    report += '## Primary Conditions\n';
    summary.primaryConditions.forEach((cond, i) => {
      report += `${i + 1}. ${cond.condition}\n`;
      report += `   - Affected Members: ${cond.affectedMembers.join(', ')}\n`;
      report += `   - Frequency: ${cond.percentage.toFixed(1)}%\n`;
      if (cond.averageAgeOfOnset) {
        report += `   - Average Age of Onset: ${cond.averageAgeOfOnset.toFixed(0)} years\n`;
      }
    });

    report += '\n## Recommendations\n';
    cluster.recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });

    report += '\n## Screening Guidelines\n';
    cluster.screeningRecommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });

    if (summary.relationshipConcern) {
      report += `\n⚠️ **Note**: ${summary.relationshipConcern}\n`;
    }

    return report;
  }

  /**
   * Get all family clusters
   */
  getAllFamilyClusters(): FamilyCluster[] {
    return Array.from(this.familyClusters.values());
  }

  /**
   * Get high-risk families
   */
  getHighRiskFamilies(): FamilyCluster[] {
    return Array.from(this.familyClusters.values()).filter(f =>
      f.riskCategory === 'high' || f.riskCategory === 'very-high'
    );
  }

  /**
   * Get family members requiring screening
   */
  getFamilyMembersForScreening(familyId: string): FamilyMember[] {
    const cluster = this.familyClusters.get(familyId);
    if (!cluster) return [];

    // Return unaffected family members from high-risk families
    if (cluster.familyRiskScore > 40) {
      return cluster.members.filter(m => m.conditions.length === 0);
    }

    return [];
  }
}

export default new FamilyRiskClusteringService();
