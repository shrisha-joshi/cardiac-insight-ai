/**
 * ECG Analysis & Interpretation Service
 * Analyzes ECG waveforms for arrhythmias, ischemia, and structural changes
 * Detects ST segment changes, T wave abnormalities, conduction delays
 * 
 * Phase 5 Task 7: ECG Analysis & Interpretation
 */

export interface ECGMeasurement {
  parameter: string;
  value: number;
  unit: string;
  normal: boolean;
  referenceRange: { min: number; max: number };
}

export interface ECGWaveform {
  leadName: string;
  samples: number[];
  sampleRate: number; // Hz
}

export interface ECGReading {
  id: string;
  patientId: string;
  timestamp: Date;
  deviceType: string;

  // Basic measurements
  heartRate: number; // bpm
  prInterval: number; // ms
  qrsWidth: number; // ms
  qtInterval: number; // ms
  qtcInterval: number; // ms (corrected)
  stvSegment: number; // ms
  tpSegment: number; // ms

  // Axis
  qrsAxis: number; // degrees (-180 to 180)
  tAxis?: number;
  pAxis?: number;

  // Intervals
  ppInterval?: number;
  rrInterval?: number;
  rhythm?: 'sinus' | 'atrial-fib' | 'flutter' | 'svt' | 'pvc' | 'vt' | 'paced';
  regularity?: 'regular' | 'irregular' | 'regularly-irregular';

  // ST Segment findings
  stSegment: {
    [lead: string]: {
      elevation: number; // mm (positive = elevation)
      depression: number; // mm (negative = depression)
    };
  };

  // T Wave
  tWave: {
    [lead: string]: 'normal' | 'flattened' | 'inverted' | 'peaked' | 'biphasic';
  };

  // QRS complex
  qrsComplex: {
    [lead: string]: {
      qWave: boolean;
      rWave: number; // voltage in mm
      sWave: number;
    };
  };

  // P Wave
  pWave: {
    duration: number; // ms
    morphology?: {
      [lead: string]: 'normal' | 'notched' | 'peaked' | 'biphasic' | 'absent';
    };
  };

  // Abnormalities detected
  abnormalities: ECGAbnormality[];

  // Waveforms (12-lead ECG)
  waveforms?: ECGWaveform[];

  // Overall interpretation
  interpretation: string;
}

export interface ECGAbnormality {
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  leads: string[];
  clinicalSignificance: string;
  possibleCauses: string[];
  recommendations: string[];
}

export interface ArrhythmiaDetection {
  type: 'bradycardia' | 'tachycardia' | 'arrhythmia' | 'pvc' | 'pacs' | 'afib' | 'flutter' | 'svt' | 'vt' | 'normal';
  confidence: number; // 0-100
  frequencyPerMinute?: number;
  shortestRR?: number; // ms
  longestRR?: number;
  variability?: number; // coefficient of variation
}

export interface STChanges {
  ischemicPattern: boolean;
  elevation: { [lead: string]: number };
  depression: { [lead: string]: number };
  territoryInvolved: string; // e.g., "Anterior", "Inferior", "Lateral"
  acuity: 'acute' | 'subacute' | 'chronic';
  distributionPattern: string; // STEMI pattern description
}

export interface ECGProfile {
  patientId: string;
  readings: ECGReading[];
  riskScore: number;
  riskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  abnormalityTypes: string[];
  trends: ECGTrend[];
  recommendations: string[];
}

export interface ECGTrend {
  parameter: string;
  trend: 'improving' | 'stable' | 'worsening';
  changePercentage: number;
  period: number; // days
  clinicalSignificance: string;
}

class ECGAnalysisService {
  private ecgProfiles: Map<string, ECGProfile> = new Map();
  private qTcFormulas = {
    bazett: (qt: number, rr: number) => qt / Math.sqrt(rr / 1000),
    fridericia: (qt: number, rr: number) => qt / Math.pow(rr / 1000, 1 / 3),
    framingham: (qt: number, rr: number) => qt + 0.154 * (1 - rr / 1000)
  };

  /**
   * Add ECG reading
   */
  addECGReading(patientId: string, reading: ECGReading): ECGProfile {
    let profile = this.ecgProfiles.get(patientId);

    if (!profile) {
      profile = {
        patientId,
        readings: [],
        riskScore: 0,
        riskCategory: 'very-low',
        abnormalityTypes: [],
        trends: [],
        recommendations: []
      };
    }

    // Analyze reading
    this.analyzeECG(reading);

    profile.readings.push(reading);
    this.analyzeProfile(profile);

    this.ecgProfiles.set(patientId, profile);

    return profile;
  }

  /**
   * Analyze ECG reading
   */
  private analyzeECG(reading: ECGReading): void {
    // Detect abnormalities
    reading.abnormalities = [];

    // Check heart rate
    if (reading.heartRate < 60) {
      reading.abnormalities.push({
        type: 'Bradycardia',
        description: `Heart rate ${reading.heartRate} bpm`,
        severity: reading.heartRate < 40 ? 'severe' : 'moderate',
        leads: ['II'],
        clinicalSignificance: 'May indicate AV block, medication effect, or intrinsic sinus disease',
        possibleCauses: ['Beta-blockers', 'Calcium channel blockers', 'Sick sinus syndrome', 'Hypothyroidism'],
        recommendations: ['Check medication list', 'Assess for symptoms', 'Consider telemetry monitoring']
      });
    } else if (reading.heartRate > 100) {
      reading.abnormalities.push({
        type: 'Tachycardia',
        description: `Heart rate ${reading.heartRate} bpm`,
        severity: reading.heartRate > 130 ? 'severe' : 'moderate',
        leads: ['II'],
        clinicalSignificance: 'May indicate stress, infection, or primary arrhythmia',
        possibleCauses: ['Fever', 'Anxiety', 'Anemia', 'Thyrotoxicosis', 'Heart failure'],
        recommendations: ['Assess vital signs', 'Check symptoms', 'Consider event monitoring']
      });
    }

    // Check PR interval
    if (reading.prInterval > 200) {
      reading.abnormalities.push({
        type: 'Prolonged PR interval',
        description: `PR interval ${reading.prInterval} ms`,
        severity: reading.prInterval > 300 ? 'severe' : 'moderate',
        leads: ['II'],
        clinicalSignificance: 'Indicates AV conduction delay',
        possibleCauses: ['First-degree AV block', 'Lyme disease', 'Myocarditis', 'Medication effect'],
        recommendations: ['Assess for AV block progression', 'Rule out infection', 'Monitor for progression']
      });
    }

    // Check QRS width
    if (reading.qrsWidth > 120) {
      reading.abnormalities.push({
        type: 'Wide QRS complex',
        description: `QRS width ${reading.qrsWidth} ms`,
        severity: reading.qrsWidth > 160 ? 'critical' : 'moderate',
        leads: ['II', 'V1', 'V6'],
        clinicalSignificance: 'Indicates ventricular conduction delay or ectopy',
        possibleCauses: ['LBBB', 'RBBB', 'Ventricular ectopy', 'Pre-excitation', 'Hyperkalemia'],
        recommendations: ['Differentiate LBBB vs RBBB', 'Check electrolytes', 'Rule out VT']
      });
    }

    // Check QT interval
    if (reading.qtcInterval > 450) {
      reading.abnormalities.push({
        type: 'Prolonged QTc interval',
        description: `QTc interval ${reading.qtcInterval} ms`,
        severity: reading.qtcInterval > 500 ? 'critical' : reading.qtcInterval > 470 ? 'severe' : 'moderate',
        leads: ['II'],
        clinicalSignificance: 'Risk factor for torsades de pointes',
        possibleCauses: ['Medications', 'Electrolyte abnormalities', 'Bradycardia', 'Congenital Long QT', 'Myocarditis'],
        recommendations: ['Review medications', 'Check K, Mg, Ca levels', 'Consider telemetry monitoring', 'Avoid QT-prolonging drugs']
      });
    }

    // Check ST segment
    const stChanges = this.analyzeSTSegment(reading);
    if (stChanges.ischemicPattern) {
      const elevation = Object.values(stChanges.elevation).reduce((a, b) => a + b, 0) > 0;
      reading.abnormalities.push({
        type: elevation ? 'ST elevation' : 'ST depression',
        description: stChanges.distributionPattern,
        severity: elevation ? 'critical' : 'severe',
        leads: Object.keys(elevation ? stChanges.elevation : stChanges.depression),
        clinicalSignificance: elevation ? 'Acute STEMI pattern' : 'Acute ischemia or reciprocal change',
        possibleCauses: elevation ? ['Acute MI', 'Pericarditis', 'Coronary vasospasm'] :
          ['Acute ischemia', 'Subendocardial MI', 'Strain pattern'],
        recommendations: elevation ? ['EMERGENCY: Activate STEMI protocol', 'Immediate catheterization'] :
          ['Troponin and serial ECGs', 'Stress test consideration']
      });
    }

    // Check T wave
    const tWaveAbn = this.analyzeTWave(reading);
    if (tWaveAbn) {
      reading.abnormalities.push(tWaveAbn);
    }

    // Detect arrhythmia
    const arrhythmia = this.detectArrhythmia(reading);
    if (arrhythmia.type !== 'normal') {
      reading.abnormalities.push({
        type: arrhythmia.type.charAt(0).toUpperCase() + arrhythmia.type.slice(1),
        description: `${arrhythmia.type} detected, confidence: ${arrhythmia.confidence}%`,
        severity: this.getArrhythmiaSeverity(arrhythmia),
        leads: ['II', 'V1'],
        clinicalSignificance: `Primary arrhythmia, not sinus rhythm`,
        possibleCauses: ['Structural heart disease', 'Electrolyte abnormality', 'Ischemia', 'Autonomic changes'],
        recommendations: ['Identify rhythm strip', 'Consider event monitoring', 'Treat underlying cause']
      });
    }

    // Check QRS axis
    if (reading.qrsAxis > 90 || reading.qrsAxis < -30) {
      reading.abnormalities.push({
        type: 'Abnormal QRS axis',
        description: `QRS axis ${reading.qrsAxis}°`,
        severity: 'moderate',
        leads: ['I', 'II', 'III', 'aVF'],
        clinicalSignificance: 'May indicate left anterior fascicular block, inferior MI, or left anterior hemiblock',
        possibleCauses: ['LAFB', 'Inferior MI', 'Obesity', 'Pregnancy', 'Ascites'],
        recommendations: ['Correlate with clinical presentation', 'Rule out inferior MI']
      });
    }
  }

  /**
   * Analyze ST segment
   */
  private analyzeSTSegment(reading: ECGReading): STChanges {
    const changes: STChanges = {
      ischemicPattern: false,
      elevation: {},
      depression: {},
      territoryInvolved: '',
      acuity: 'acute',
      distributionPattern: ''
    };

    const anteriorLeads = ['V1', 'V2', 'V3', 'V4'];
    const lateralLeads = ['I', 'aVL', 'V5', 'V6'];
    const inferiorLeads = ['II', 'III', 'aVF'];

    let anteriorElevation = 0, lateralElevation = 0, inferiorElevation = 0;
    let anteriorDepression = 0, lateralDepression = 0, inferiorDepression = 0;

    Object.entries(reading.stSegment).forEach(([lead, segment]) => {
      if (segment.elevation > 1) {
        changes.elevation[lead] = segment.elevation;
        if (anteriorLeads.includes(lead)) anteriorElevation++;
        if (lateralLeads.includes(lead)) lateralElevation++;
        if (inferiorLeads.includes(lead)) inferiorElevation++;
      }
      if (segment.depression > 1) {
        changes.depression[lead] = segment.depression;
        if (anteriorLeads.includes(lead)) anteriorDepression++;
        if (lateralLeads.includes(lead)) lateralDepression++;
        if (inferiorLeads.includes(lead)) inferiorDepression++;
      }
    });

    // Determine ischemic pattern
    if (anteriorElevation >= 2) {
      changes.ischemicPattern = true;
      changes.territoryInvolved = 'Anterior';
      changes.distributionPattern = 'Anterior STEMI';
    } else if (lateralElevation >= 2) {
      changes.ischemicPattern = true;
      changes.territoryInvolved = 'Lateral';
      changes.distributionPattern = 'Lateral STEMI';
    } else if (inferiorElevation >= 2) {
      changes.ischemicPattern = true;
      changes.territoryInvolved = 'Inferior';
      changes.distributionPattern = 'Inferior STEMI';
    } else if (anteriorDepression >= 2 || lateralDepression >= 2 || inferiorDepression >= 2) {
      changes.ischemicPattern = true;
      changes.distributionPattern = 'ST depression pattern - possible ischemia';
    }

    return changes;
  }

  /**
   * Analyze T wave abnormalities
   */
  private analyzeTWave(reading: ECGReading): ECGAbnormality | null {
    const invertedLeads: string[] = [];
    const peakedLeads: string[] = [];

    Object.entries(reading.tWave).forEach(([lead, morphology]) => {
      if (morphology === 'inverted') invertedLeads.push(lead);
      if (morphology === 'peaked') peakedLeads.push(lead);
    });

    if (invertedLeads.length > 0) {
      return {
        type: 'T wave inversion',
        description: `T wave inversion in leads: ${invertedLeads.join(', ')}`,
        severity: 'moderate',
        leads: invertedLeads,
        clinicalSignificance: 'May indicate ischemia, prior MI, or pulmonary embolism',
        possibleCauses: ['Ischemia', 'Prior MI', 'Pulmonary embolism', 'Myocarditis', 'Stroke'],
        recommendations: ['Correlate with troponin and clinical symptoms', 'Consider CTA if PE suspected']
      };
    }

    if (peakedLeads.length > 0) {
      return {
        type: 'Peaked T wave',
        description: `Peaked T wave in leads: ${peakedLeads.join(', ')}`,
        severity: 'moderate',
        leads: peakedLeads,
        clinicalSignificance: 'May indicate hyperkalemia or early repolarization',
        possibleCauses: ['Hyperkalemia', 'Early repolarization', 'Left ventricular hypertrophy'],
        recommendations: ['Check potassium level', 'Monitor for hyperkalemia symptoms']
      };
    }

    return null;
  }

  /**
   * Detect arrhythmia
   */
  private detectArrhythmia(reading: ECGReading): ArrhythmiaDetection {
    const rr = reading.rrInterval || 60000 / reading.heartRate;
    const shortestRR = rr * 0.8; // Simulate variation
    const longestRR = rr * 1.2;
    const variability = (longestRR - shortestRR) / ((longestRR + shortestRR) / 2);

    // Bradycardia
    if (reading.heartRate < 60) {
      return {
        type: 'bradycardia',
        confidence: 95,
        frequencyPerMinute: reading.heartRate,
        variability
      };
    }

    // Tachycardia
    if (reading.heartRate > 100) {
      // Check for regularity
      if (variability > 0.2) {
        return {
          type: 'arrhythmia',
          confidence: 85,
          frequencyPerMinute: reading.heartRate,
          variability,
          shortestRR,
          longestRR
        };
      }

      // Check for atrial fibrillation (irregular rhythm)
      if (reading.regularity === 'irregular') {
        return {
          type: 'afib',
          confidence: 90,
          frequencyPerMinute: reading.heartRate,
          variability
        };
      }

      // Regular tachycardia
      if (reading.qrsWidth < 120) {
        return {
          type: 'svt',
          confidence: 80,
          frequencyPerMinute: reading.heartRate
        };
      } else {
        return {
          type: 'vt',
          confidence: 85,
          frequencyPerMinute: reading.heartRate
        };
      }
    }

    // Check for premature beats
    if (reading.regularity === 'regularly-irregular' && reading.qrsWidth > 120) {
      return {
        type: 'pvc',
        confidence: 80,
        frequencyPerMinute: reading.heartRate
      };
    }

    // Normal sinus
    return {
      type: 'normal',
      confidence: 95
    };
  }

  /**
   * Get arrhythmia severity
   */
  private getArrhythmiaSeverity(arrhythmia: ArrhythmiaDetection): 'minor' | 'moderate' | 'severe' | 'critical' {
    if (arrhythmia.type === 'vt' || arrhythmia.type === 'afib') {
      return arrhythmia.frequencyPerMinute && arrhythmia.frequencyPerMinute > 130 ? 'critical' : 'severe';
    }
    if (arrhythmia.type === 'svt') return 'moderate';
    if (arrhythmia.type === 'pvc') return 'minor';
    return 'minor';
  }

  /**
   * Analyze ECG profile
   */
  private analyzeProfile(profile: ECGProfile): void {
    if (profile.readings.length === 0) return;

    const latest = profile.readings[profile.readings.length - 1];

    // Calculate risk score
    profile.riskScore = 0;
    profile.abnormalityTypes = [];

    latest.abnormalities.forEach(abn => {
      profile.abnormalityTypes.push(abn.type);

      if (abn.severity === 'critical') profile.riskScore += 35;
      else if (abn.severity === 'severe') profile.riskScore += 20;
      else if (abn.severity === 'moderate') profile.riskScore += 10;
      else profile.riskScore += 5;
    });

    // Categorize
    if (profile.riskScore < 15) profile.riskCategory = 'very-low';
    else if (profile.riskScore < 30) profile.riskCategory = 'low';
    else if (profile.riskScore < 50) profile.riskCategory = 'moderate';
    else if (profile.riskScore < 75) profile.riskCategory = 'high';
    else profile.riskCategory = 'very-high';

    // Calculate trends
    profile.trends = this.calculateTrends(profile.readings);

    // Generate recommendations
    profile.recommendations = this.generateRecommendations(profile);
  }

  /**
   * Calculate ECG trends
   */
  private calculateTrends(readings: ECGReading[]): ECGTrend[] {
    const trends: ECGTrend[] = [];

    if (readings.length < 2) return trends;

    const recent = readings[readings.length - 1];
    const previous = readings[Math.max(0, readings.length - 2)];

    const daysDiff = Math.floor((recent.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60 * 24));

    const hrChange = recent.heartRate - previous.heartRate;
    const qrsChange = recent.qrsWidth - previous.qrsWidth;
    const qtcChange = recent.qtcInterval - previous.qtcInterval;

    if (Math.abs(hrChange) > 5) {
      trends.push({
        parameter: 'Heart Rate',
        trend: hrChange > 0 ? 'worsening' : 'improving',
        changePercentage: (hrChange / previous.heartRate) * 100,
        period: daysDiff,
        clinicalSignificance: hrChange > 0 ? 'HR increasing' : 'HR decreasing'
      });
    }

    if (Math.abs(qrsChange) > 10) {
      trends.push({
        parameter: 'QRS Width',
        trend: qrsChange > 0 ? 'worsening' : 'improving',
        changePercentage: (qrsChange / previous.qrsWidth) * 100,
        period: daysDiff,
        clinicalSignificance: 'Conduction pattern changing'
      });
    }

    if (Math.abs(qtcChange) > 20) {
      trends.push({
        parameter: 'QTc Interval',
        trend: qtcChange > 0 ? 'worsening' : 'improving',
        changePercentage: (qtcChange / previous.qtcInterval) * 100,
        period: daysDiff,
        clinicalSignificance: qtcChange > 0 ? 'Prolongation risk increasing' : 'Repolarization normalizing'
      });
    }

    return trends;
  }

  /**
   * Generate ECG recommendations
   */
  private generateRecommendations(profile: ECGProfile): string[] {
    const recommendations: string[] = [];
    const latest = profile.readings[profile.readings.length - 1];

    // Critical abnormalities
    const criticalAbnormalities = latest.abnormalities.filter(a => a.severity === 'critical');
    if (criticalAbnormalities.length > 0) {
      recommendations.push('URGENT: Critical ECG findings detected');
      recommendations.push('Immediate physician evaluation required');
      criticalAbnormalities.forEach(abn => {
        recommendations.push(`- ${abn.type}: ${abn.clinicalSignificance}`);
      });
      return recommendations;
    }

    // ST elevation
    if (latest.abnormalities.some(a => a.type.includes('ST elevation'))) {
      recommendations.push('EMERGENCY: Possible acute MI');
      recommendations.push('Activate STEMI protocol if not already done');
      recommendations.push('Prepare for emergency catheterization');
    }

    // ST depression / ischemia
    if (latest.abnormalities.some(a => a.type.includes('ST'))) {
      recommendations.push('Possible acute ischemia detected');
      recommendations.push('Obtain serial troponins');
      recommendations.push('Repeat ECG in 5-10 minutes');
      recommendations.push('Consider stress testing');
    }

    // Prolonged QTc
    if (latest.abnormalities.some(a => a.type.includes('QTc'))) {
      recommendations.push('Review current medications for QT-prolonging drugs');
      recommendations.push('Check electrolytes (K, Mg, Ca)');
      recommendations.push('Consider cardiac monitoring');
    }

    // Arrhythmia
    if (latest.abnormalities.some(a => ['VT', 'SVT', 'AFib'].some(t => a.type.includes(t)))) {
      recommendations.push('Arrhythmia detected - clinical correlation needed');
      recommendations.push('Consider Holter or event monitoring');
      recommendations.push('Evaluate for precipitating factors');
    }

    // Wide QRS
    if (latest.abnormalities.some(a => a.type.includes('Wide QRS'))) {
      recommendations.push('Differentiate between LBBB and RBBB');
      recommendations.push('Rule out ventricular ectopy');
      recommendations.push('Check potassium level');
    }

    return recommendations;
  }

  /**
   * Get ECG profile
   */
  getECGProfile(patientId: string): ECGProfile | null {
    return this.ecgProfiles.get(patientId) || null;
  }

  /**
   * Generate ECG report
   */
  generateECGReport(patientId: string): string {
    const profile = this.ecgProfiles.get(patientId);
    if (!profile) return 'Patient ECG data not found';

    const latest = profile.readings[profile.readings.length - 1];

    let report = '# 12-Lead ECG Analysis Report\n\n';
    report += `Patient ID: ${patientId}\n`;
    report += `Recording Date: ${latest.timestamp.toLocaleString()}\n`;
    report += `Device: ${latest.deviceType}\n\n`;

    report += '## ECG Measurements\n';
    report += `- Heart Rate: ${latest.heartRate} bpm\n`;
    report += `- PR Interval: ${latest.prInterval} ms\n`;
    report += `- QRS Width: ${latest.qrsWidth} ms\n`;
    report += `- QTc Interval: ${latest.qtcInterval} ms\n`;
    report += `- QRS Axis: ${latest.qrsAxis}°\n`;
    report += `- Rhythm: ${latest.rhythm}\n\n`;

    report += '## Abnormalities Detected\n';
    if (latest.abnormalities.length === 0) {
      report += 'No significant abnormalities detected.\n';
    } else {
      latest.abnormalities.forEach((abn, i) => {
        report += `${i + 1}. **${abn.type}**\n`;
        report += `   - Severity: ${abn.severity.toUpperCase()}\n`;
        report += `   - Description: ${abn.description}\n`;
        report += `   - Significance: ${abn.clinicalSignificance}\n`;
      });
    }

    report += '\n## Clinical Interpretation\n';
    report += latest.interpretation || 'See abnormalities section above.\n';

    report += '\n## Recommendations\n';
    profile.recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });

    return report;
  }

  /**
   * Get high-risk ECG profiles
   */
  getHighRiskProfiles(): ECGProfile[] {
    return Array.from(this.ecgProfiles.values()).filter(p =>
      p.riskCategory === 'high' || p.riskCategory === 'very-high'
    );
  }
}

export default new ECGAnalysisService();
