/**
 * Biomarker Integration & Analytics Service
 * Integrates cardiac and metabolic biomarkers for enhanced risk stratification
 * Analyzes biomarker patterns and trends
 * 
 * Phase 5 Task 5: Biomarker Integration & Analytics
 */

export interface BiomarkerReading {
  id: string;
  patientId: string;
  timestamp: Date;
  biomarkers: BiomarkerValues;
  labName?: string;
  quality: 'certified' | 'preliminary' | 'suspicious';
}

export interface BiomarkerValues {
  // Cardiac biomarkers
  troponin?: number; // ng/L (cTnI or cTnT)
  bNP?: number; // pg/mL (B-type Natriuretic Peptide)
  ntProBNP?: number; // pg/mL (N-terminal pro-BNP)
  copeptin?: number; // pmol/L (prognostic marker)
  myoglobin?: number; // ng/mL
  creatineKinase?: number; // U/L
  ldh?: number; // U/L (Lactate dehydrogenase)

  // Lipid panel
  totalCholesterol?: number; // mg/dL
  ldlCholesterol?: number; // mg/dL
  hdlCholesterol?: number; // mg/dL
  triglycerides?: number; // mg/dL
  apoB?: number; // mg/dL (Apolipoprotein B)

  // Inflammatory markers
  crp?: number; // mg/L (C-Reactive Protein)
  il6?: number; // pg/mL (Interleukin-6)
  tnfAlpha?: number; // pg/mL (Tumor Necrosis Factor-alpha)
  mcp1?: number; // pg/mL (Monocyte Chemoattractant Protein-1)

  // Metabolic markers
  glucose?: number; // mg/dL
  hba1c?: number; // % (Hemoglobin A1c)
  creatinine?: number; // mg/dL
  egfr?: number; // mL/min/1.73m²
  uricAcid?: number; // mg/dL
  homocysteine?: number; // μmol/L

  // Coagulation markers
  dDimer?: number; // ng/mL
  fibrinogen?: number; // mg/dL
  plateletCount?: number; // 10^9/L

  // Additional markers
  lpa?: number; // mg/dL (Lipoprotein(a))
  microalbumin?: number; // mg/L
  nterminalProAtrialnp?: number; // pg/mL
}

export interface BiomarkerProfile {
  patientId: string;
  lastUpdate: Date;
  readings: BiomarkerReading[];
  riskScore: number;
  riskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  riskFactors: string[];
  abnormalBiomarkers: AbnormalBiomarker[];
  trends: BiomarkerTrend[];
  recommendations: string[];
}

export interface AbnormalBiomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: { min: number; max: number };
  severity: 'mild' | 'moderate' | 'severe';
  clinicalSignificance: string;
}

export interface BiomarkerTrend {
  biomarker: string;
  trend: 'improving' | 'stable' | 'worsening';
  changePercentage: number;
  period: number; // days
  clinicalInterpretation: string;
}

export interface BiomarkerNorms {
  male: { min: number; max: number; optimal?: number };
  female: { min: number; max: number; optimal?: number };
  unit: string;
}

class BiomarkerIntegrationService {
  private biomarkerNorms: Map<string, BiomarkerNorms> = new Map();
  private patientProfiles: Map<string, BiomarkerProfile> = new Map();

  constructor() {
    this.initializeBiomarkerNorms();
  }

  /**
   * Initialize reference ranges for biomarkers
   */
  private initializeBiomarkerNorms(): void {
    // Cardiac biomarkers
    this.biomarkerNorms.set('troponin', {
      male: { min: 0, max: 0.04, optimal: 0.01 },
      female: { min: 0, max: 0.04, optimal: 0.01 },
      unit: 'ng/L'
    });

    this.biomarkerNorms.set('bNP', {
      male: { min: 0, max: 100, optimal: 50 },
      female: { min: 0, max: 100, optimal: 50 },
      unit: 'pg/mL'
    });

    this.biomarkerNorms.set('ntProBNP', {
      male: { min: 0, max: 125, optimal: 60 },
      female: { min: 0, max: 125, optimal: 60 },
      unit: 'pg/mL'
    });

    // Lipid panel
    this.biomarkerNorms.set('totalCholesterol', {
      male: { min: 0, max: 200, optimal: 150 },
      female: { min: 0, max: 200, optimal: 150 },
      unit: 'mg/dL'
    });

    this.biomarkerNorms.set('ldlCholesterol', {
      male: { min: 0, max: 100, optimal: 70 },
      female: { min: 0, max: 100, optimal: 70 },
      unit: 'mg/dL'
    });

    this.biomarkerNorms.set('hdlCholesterol', {
      male: { min: 40, max: 300, optimal: 60 },
      female: { min: 50, max: 300, optimal: 60 },
      unit: 'mg/dL'
    });

    this.biomarkerNorms.set('triglycerides', {
      male: { min: 0, max: 150, optimal: 100 },
      female: { min: 0, max: 150, optimal: 100 },
      unit: 'mg/dL'
    });

    this.biomarkerNorms.set('apoB', {
      male: { min: 55, max: 125, optimal: 90 },
      female: { min: 55, max: 125, optimal: 90 },
      unit: 'mg/dL'
    });

    this.biomarkerNorms.set('lpa', {
      male: { min: 0, max: 50, optimal: 30 },
      female: { min: 0, max: 50, optimal: 30 },
      unit: 'mg/dL'
    });

    // Inflammatory markers
    this.biomarkerNorms.set('crp', {
      male: { min: 0, max: 3, optimal: 1 },
      female: { min: 0, max: 3, optimal: 1 },
      unit: 'mg/L'
    });

    this.biomarkerNorms.set('il6', {
      male: { min: 0, max: 7, optimal: 3 },
      female: { min: 0, max: 7, optimal: 3 },
      unit: 'pg/mL'
    });

    // Metabolic markers
    this.biomarkerNorms.set('glucose', {
      male: { min: 70, max: 100, optimal: 85 },
      female: { min: 70, max: 100, optimal: 85 },
      unit: 'mg/dL'
    });

    this.biomarkerNorms.set('hba1c', {
      male: { min: 0, max: 5.7, optimal: 5 },
      female: { min: 0, max: 5.7, optimal: 5 },
      unit: '%'
    });

    this.biomarkerNorms.set('creatinine', {
      male: { min: 0.7, max: 1.3, optimal: 1 },
      female: { min: 0.6, max: 1.1, optimal: 0.9 },
      unit: 'mg/dL'
    });

    this.biomarkerNorms.set('egfr', {
      male: { min: 60, max: 120, optimal: 100 },
      female: { min: 60, max: 120, optimal: 100 },
      unit: 'mL/min/1.73m²'
    });

    this.biomarkerNorms.set('homocysteine', {
      male: { min: 0, max: 12, optimal: 8 },
      female: { min: 0, max: 12, optimal: 8 },
      unit: 'μmol/L'
    });

    // Coagulation markers
    this.biomarkerNorms.set('dDimer', {
      male: { min: 0, max: 500, optimal: 250 },
      female: { min: 0, max: 500, optimal: 250 },
      unit: 'ng/mL'
    });

    this.biomarkerNorms.set('fibrinogen', {
      male: { min: 200, max: 400, optimal: 300 },
      female: { min: 200, max: 400, optimal: 300 },
      unit: 'mg/dL'
    });
  }

  /**
   * Add biomarker reading for patient
   */
  addBiomarkerReading(patientId: string, reading: BiomarkerReading): BiomarkerProfile {
    let profile = this.patientProfiles.get(patientId);

    if (!profile) {
      profile = {
        patientId,
        lastUpdate: new Date(),
        readings: [],
        riskScore: 0,
        riskCategory: 'very-low',
        riskFactors: [],
        abnormalBiomarkers: [],
        trends: [],
        recommendations: []
      };
    }

    profile.readings.push(reading);
    profile.lastUpdate = new Date();

    // Analyze reading
    this.analyzeProfile(profile);

    this.patientProfiles.set(patientId, profile);

    return profile;
  }

  /**
   * Analyze patient biomarker profile
   */
  private analyzeProfile(profile: BiomarkerProfile): void {
    if (profile.readings.length === 0) return;

    const latestReading = profile.readings[profile.readings.length - 1];

    // Identify abnormal biomarkers
    profile.abnormalBiomarkers = this.identifyAbnormalBiomarkers(latestReading);

    // Calculate risk score
    profile.riskScore = this.calculateBiomarkerRiskScore(profile.abnormalBiomarkers, profile.readings);

    // Categorize risk
    if (profile.riskScore < 15) profile.riskCategory = 'very-low';
    else if (profile.riskScore < 30) profile.riskCategory = 'low';
    else if (profile.riskScore < 50) profile.riskCategory = 'moderate';
    else if (profile.riskScore < 75) profile.riskCategory = 'high';
    else profile.riskCategory = 'very-high';

    // Extract risk factors
    profile.riskFactors = this.extractRiskFactors(profile.abnormalBiomarkers);

    // Calculate trends
    profile.trends = this.calculateTrends(profile.readings);

    // Generate recommendations
    profile.recommendations = this.generateBiomarkerRecommendations(profile);
  }

  /**
   * Identify abnormal biomarkers
   */
  private identifyAbnormalBiomarkers(reading: BiomarkerReading): AbnormalBiomarker[] {
    const abnormal: AbnormalBiomarker[] = [];
    const gender = 'male'; // Would come from patient profile

    Object.entries(reading.biomarkers).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      const norms = this.biomarkerNorms.get(key);
      if (!norms) return;

      const range = norms[gender as keyof BiomarkerNorms];
      if (typeof range === 'object' && 'min' in range && 'max' in range) {
        if (value < range.min || value > range.max) {
          const severity = this.determineSeverity(key, value, range);
          abnormal.push({
            name: this.formatBiomarkerName(key),
            value,
            unit: norms.unit,
            referenceRange: { min: range.min, max: range.max },
            severity,
            clinicalSignificance: this.getClinicalsignificance(key, value, severity)
          });
        }
      }
    });

    return abnormal.sort((a, b) => {
      const severityOrder = { severe: 0, moderate: 1, mild: 2 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });
  }

  /**
   * Determine severity of abnormality
   */
  private determineSeverity(biomarker: string, value: number, range: any): 'mild' | 'moderate' | 'severe' {
    const deviation = value < range.min ?
      (range.min - value) / range.min :
      (value - range.max) / range.max;

    if (deviation > 0.5) return 'severe';
    if (deviation > 0.25) return 'moderate';
    return 'mild';
  }

  /**
   * Get clinical significance of abnormal biomarker
   */
  private getClinicalsignificance(biomarker: string, value: number, severity: string): string {
    const significances: Record<string, Record<string, string>> = {
      troponin: {
        severe: 'Indicates acute myocardial injury; requires urgent evaluation',
        moderate: 'Elevated troponin; suggests myocardial stress',
        mild: 'Mildly elevated; monitor closely'
      },
      ldlCholesterol: {
        severe: 'Very high LDL; high cardiovascular risk',
        moderate: 'Elevated LDL; increased CAD risk',
        mild: 'Slightly high LDL; monitor and consider lifestyle changes'
      },
      hdlCholesterol: {
        severe: 'Very low HDL; loss of protective effect',
        moderate: 'Low HDL; reduced cardiovascular protection',
        mild: 'Slightly low HDL; encourage exercise'
      },
      crp: {
        severe: 'Significant inflammation; high CAD risk',
        moderate: 'Moderate inflammation; increased risk',
        mild: 'Mild inflammation; monitor'
      },
      hba1c: {
        severe: 'Poor glycemic control; diabetes complications risk',
        moderate: 'Suboptimal control; diabetes risk',
        mild: 'Borderline; lifestyle intervention needed'
      },
      homocysteine: {
        severe: 'Very high; significant thrombotic risk',
        moderate: 'Elevated; thrombotic risk',
        mild: 'Mildly elevated; monitor'
      }
    };

    const spec = significances[biomarker]?.[severity];
    return spec || `${this.formatBiomarkerName(biomarker)} is abnormal`;
  }

  /**
   * Calculate biomarker risk score
   */
  private calculateBiomarkerRiskScore(abnormalBiomarkers: AbnormalBiomarker[], readings: BiomarkerReading[]): number {
    let score = 0;

    // Score based on severe abnormalities
    abnormalBiomarkers.forEach(bm => {
      if (bm.severity === 'severe') score += 25;
      else if (bm.severity === 'moderate') score += 12;
      else score += 5;
    });

    // Bonus for multiple abnormalities
    if (abnormalBiomarkers.length > 5) score += 15;
    else if (abnormalBiomarkers.length > 3) score += 10;

    // Check for acute markers (troponin, BNP elevated)
    const hasAcuteMarkers = abnormalBiomarkers.some(bm =>
      bm.name.includes('Troponin') || bm.name.includes('BNP')
    );

    if (hasAcuteMarkers) score += 20;

    // Check trends if available
    if (readings.length > 1) {
      const recent = readings[readings.length - 1].biomarkers;
      const previous = readings[Math.max(0, readings.length - 2)].biomarkers;

      // If worsening, increase score
      if (recent.crp && previous.crp && recent.crp > previous.crp * 1.2) {
        score += 10;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Extract risk factors from abnormal biomarkers
   */
  private extractRiskFactors(abnormalBiomarkers: AbnormalBiomarker[]): string[] {
    const factors: Set<string> = new Set();

    abnormalBiomarkers.forEach(bm => {
      if (bm.name.includes('Troponin')) factors.add('Acute myocardial injury');
      if (bm.name.includes('BNP') || bm.name.includes('NT-pro-BNP')) factors.add('Heart failure risk');
      if (bm.name.includes('LDL')) factors.add('Dyslipidemia');
      if (bm.name.includes('HDL')) factors.add('Low HDL-cholesterol');
      if (bm.name.includes('CRP')) factors.add('Systemic inflammation');
      if (bm.name.includes('Homocysteine')) factors.add('Thrombotic risk');
      if (bm.name.includes('HbA1c') || bm.name.includes('Glucose')) factors.add('Glycemic dysregulation');
      if (bm.name.includes('Creatinine') || bm.name.includes('eGFR')) factors.add('Renal impairment');
      if (bm.name.includes('Lipoprotein')) factors.add('Genetic lipid disorder risk');
    });

    return Array.from(factors);
  }

  /**
   * Calculate biomarker trends
   */
  private calculateTrends(readings: BiomarkerReading[]): BiomarkerTrend[] {
    const trends: BiomarkerTrend[] = [];

    if (readings.length < 2) return trends;

    const recent = readings[readings.length - 1];
    const previous = readings[Math.max(0, readings.length - 2)];

    const daysDiff = Math.floor((recent.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60 * 24));

    const keyBiomarkers = ['ldlCholesterol', 'hdlCholesterol', 'crp', 'hba1c', 'troponin'];

    keyBiomarkers.forEach(marker => {
      const recentVal = recent.biomarkers[marker as keyof BiomarkerValues];
      const prevVal = previous.biomarkers[marker as keyof BiomarkerValues];

      if (recentVal !== null && prevVal !== null && recentVal !== undefined && prevVal !== undefined) {
        const changePercent = ((recentVal - prevVal) / prevVal) * 100;
        let trend: 'improving' | 'stable' | 'worsening' = 'stable';

        if (marker === 'hdlCholesterol' || marker === 'egfr') {
          // Higher is better
          trend = changePercent > 5 ? 'improving' : changePercent < -5 ? 'worsening' : 'stable';
        } else {
          // Lower is better
          trend = changePercent < -5 ? 'improving' : changePercent > 5 ? 'worsening' : 'stable';
        }

        trends.push({
          biomarker: this.formatBiomarkerName(marker),
          trend,
          changePercentage: Math.round(changePercent * 10) / 10,
          period: daysDiff,
          clinicalInterpretation: this.interpretTrend(marker, trend, changePercent)
        });
      }
    });

    return trends;
  }

  /**
   * Interpret biomarker trend
   */
  private interpretTrend(marker: string, trend: string, change: number): string {
    if (trend === 'stable') {
      return 'Values remain stable; continue current management';
    }

    if (trend === 'improving') {
      return `${this.formatBiomarkerName(marker)} improving (${Math.abs(change).toFixed(1)}% better); maintain current interventions`;
    }

    return `${this.formatBiomarkerName(marker)} worsening (${Math.abs(change).toFixed(1)}% higher); consider intensification of therapy`;
  }

  /**
   * Generate biomarker-based recommendations
   */
  private generateBiomarkerRecommendations(profile: BiomarkerProfile): string[] {
    const recommendations: string[] = [];

    // Acute findings
    if (profile.abnormalBiomarkers.some(bm => bm.name.includes('Troponin') && bm.severity === 'severe')) {
      recommendations.push('URGENT: Cardiac biomarkers elevated - immediate cardiology evaluation required');
      recommendations.push('Perform ECG and consider advanced cardiac imaging');
      recommendations.push('Consider coronary intervention if indicated');
      return recommendations;
    }

    // Lipid management
    const abnormalLipids = profile.abnormalBiomarkers.filter(bm =>
      bm.name.includes('LDL') || bm.name.includes('Triglycerides')
    );
    if (abnormalLipids.length > 0) {
      recommendations.push('Intensify lipid-lowering therapy (statin ± ezetimibe ± PCSK9 inhibitor)');
      recommendations.push('Consider additional LDL-lowering therapy if LDL > 100');
    }

    // Inflammatory markers
    const hasInflammation = profile.abnormalBiomarkers.some(bm => bm.name.includes('CRP'));
    if (hasInflammation) {
      recommendations.push('Address inflammation: assess for infection, rheumatologic conditions');
      recommendations.push('Consider anti-inflammatory therapy if indicated');
    }

    // Glucose control
    const hasGlycemic = profile.abnormalBiomarkers.some(bm =>
      bm.name.includes('HbA1c') || bm.name.includes('Glucose')
    );
    if (hasGlycemic) {
      recommendations.push('Intensify glycemic control: medication adjustment and lifestyle modification');
      recommendations.push('Target HbA1c < 7% for most patients');
    }

    // Renal function
    const hasRenalImpairment = profile.abnormalBiomarkers.some(bm =>
      bm.name.includes('eGFR') || bm.name.includes('Creatinine')
    );
    if (hasRenalImpairment) {
      recommendations.push('Evaluate renal function and proteinuria');
      recommendations.push('Adjust medication dosing based on renal function');
    }

    // Regular monitoring
    if (profile.riskScore > 30) {
      recommendations.push('Repeat biomarker panel in 4-6 weeks to assess response to therapy');
      recommendations.push('Schedule follow-up cardiology evaluation');
    }

    return recommendations;
  }

  /**
   * Get patient biomarker profile
   */
  getPatientProfile(patientId: string): BiomarkerProfile | null {
    return this.patientProfiles.get(patientId) || null;
  }

  /**
   * Format biomarker name for display
   */
  private formatBiomarkerName(key: string): string {
    const names: Record<string, string> = {
      troponin: 'Troponin',
      bNP: 'B-type Natriuretic Peptide (BNP)',
      ntProBNP: 'NT-pro-BNP',
      ldlCholesterol: 'LDL Cholesterol',
      hdlCholesterol: 'HDL Cholesterol',
      totalCholesterol: 'Total Cholesterol',
      triglycerides: 'Triglycerides',
      crp: 'C-Reactive Protein',
      hba1c: 'Hemoglobin A1c',
      glucose: 'Fasting Glucose',
      creatinine: 'Creatinine',
      egfr: 'eGFR',
      homocysteine: 'Homocysteine',
      lpa: 'Lipoprotein(a)',
      apoB: 'Apolipoprotein B'
    };

    return names[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  /**
   * Compare biomarkers between two dates
   */
  compareBiomarkersByDate(patientId: string, date1: Date, date2: Date): { comparison: string } | null {
    const profile = this.patientProfiles.get(patientId);
    if (!profile) return null;

    const reading1 = profile.readings.find(r =>
      Math.abs(r.timestamp.getTime() - date1.getTime()) < 86400000 // within 1 day
    );
    const reading2 = profile.readings.find(r =>
      Math.abs(r.timestamp.getTime() - date2.getTime()) < 86400000
    );

    if (!reading1 || !reading2) return null;

    let comparison = '# Biomarker Comparison\n\n';
    comparison += `Date 1: ${reading1.timestamp.toLocaleDateString()}\n`;
    comparison += `Date 2: ${reading2.timestamp.toLocaleDateString()}\n\n`;

    return { comparison };
  }

  /**
   * Export biomarker report
   */
  exportBiomarkerReport(patientId: string): string {
    const profile = this.patientProfiles.get(patientId);
    if (!profile) return 'Patient not found';

    let report = '# Comprehensive Biomarker Analysis Report\n\n';
    report += `Patient ID: ${patientId}\n`;
    report += `Analysis Date: ${profile.lastUpdate.toLocaleString()}\n\n`;

    report += '## Risk Assessment\n';
    report += `- **Biomarker Risk Score**: ${profile.riskScore}/100\n`;
    report += `- **Risk Category**: ${profile.riskCategory.toUpperCase()}\n`;
    report += `- **Last Updated**: ${profile.lastUpdate.toLocaleString()}\n\n`;

    report += '## Risk Factors Identified\n';
    profile.riskFactors.forEach((factor, i) => {
      report += `${i + 1}. ${factor}\n`;
    });

    report += '\n## Abnormal Biomarkers\n';
    profile.abnormalBiomarkers.forEach((bm, i) => {
      report += `${i + 1}. **${bm.name}**: ${bm.value} ${bm.unit}\n`;
      report += `   - Reference: ${bm.referenceRange.min}-${bm.referenceRange.max}\n`;
      report += `   - Severity: ${bm.severity.toUpperCase()}\n`;
      report += `   - Significance: ${bm.clinicalSignificance}\n`;
    });

    if (profile.trends.length > 0) {
      report += '\n## Biomarker Trends\n';
      profile.trends.forEach((trend, i) => {
        report += `${i + 1}. ${trend.biomarker}: **${trend.trend.toUpperCase()}** (${trend.changePercentage > 0 ? '+' : ''}${trend.changePercentage}%)\n`;
        report += `   - ${trend.clinicalInterpretation}\n`;
      });
    }

    report += '\n## Clinical Recommendations\n';
    profile.recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });

    return report;
  }
}

export default new BiomarkerIntegrationService();
