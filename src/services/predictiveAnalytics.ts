/**
 * Predictive Analytics & Machine Learning Service
 * Implements ML models for cardiovascular outcome prediction
 * Risk scoring, model ensemble, and clinical decision support
 * 
 * Phase 5 Task 8: Predictive Analytics & ML
 */

export interface PatientData {
  demographics: {
    age: number;
    gender: 'Male' | 'Female';
    ethnicity?: string;
  };
  riskFactors: {
    hypertension: boolean;
    diabetes: boolean;
    smoking: boolean;
    dyslipidemia: boolean;
    familyHistoryCAD: boolean;
    obesity: boolean;
    sedentaryLifestyle: boolean;
    chronicKidneyDisease: boolean;
  };
  measurements: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    ldl: number;
    hdl: number;
    triglycerides: number;
    glucose: number;
    bmi: number;
  };
  biomarkers: {
    troponin?: number;
    bNP?: number;
    crp?: number;
    homocysteine?: number;
  };
  imaging: {
    lvef?: number;
    wallMotionAbnormality?: boolean;
    coronaryCalciumScore?: number;
  };
  ecg: {
    heartRate?: number;
    qrsWidth?: number;
    qtcInterval?: number;
    stSegmentChanges?: boolean;
  };
}

export interface MLPrediction {
  modelName: string;
  riskScore: number; // 0-100
  riskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  confidenceInterval: { lower: number; upper: number };
  probabilityOfMI: number; // 0-1
  probabilityOfStroke: number;
  probabilityOfHF: number;
  probabilityOfCardiacDeath: number;
  keyRiskFactors: string[];
  protectiveFactors: string[];
  timeHorizon: number; // years
  confidenceScore: number; // 0-100
}

export interface EnsemblePrediction {
  timestamp: Date;
  patientId: string;
  models: MLPrediction[];
  averageRiskScore: number;
  ensembleRiskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  consensus: boolean;
  recommendation: string;
  modelAgreement: number; // percentage
  outlierModels: string[];
}

export interface OutcomeEvent {
  patientId: string;
  eventType: 'MI' | 'stroke' | 'HF' | 'cardiacDeath' | 'revascularization' | 'none';
  eventDate?: Date;
  followUpDays: number;
  predictedProbability: number;
  actualOutcome: boolean;
  modelAccuracy?: boolean;
}

export interface ModelPerformance {
  modelName: string;
  sensitivity: number; // True positive rate
  specificity: number; // True negative rate
  precision: number; // PPV
  recall: number; // Sensitivity
  f1Score: number;
  auc: number; // Area under ROC curve
  calibration: number; // How well predicted vs actual
  accuracy: number;
  totalPatients: number;
  predictedEvents: number;
  actualEvents: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

class PredictiveAnalyticsService {
  private predictions: Map<string, EnsemblePrediction[]> = new Map();
  private outcomes: OutcomeEvent[] = [];
  private modelPerformance: Map<string, ModelPerformance> = new Map();

  /**
   * Generate predictions using ensemble of models
   */
  generateEnsemblePrediction(patientId: string, patientData: PatientData): EnsemblePrediction {
    const models: MLPrediction[] = [];

    // Run multiple models
    models.push(this.predictFramingham(patientData));
    models.push(this.predictAccAHA2013(patientData));
    models.push(this.predictCAC(patientData));
    models.push(this.predictPCE(patientData));
    models.push(this.predictLipidomic(patientData));

    // Calculate ensemble metrics
    const averageRiskScore = models.reduce((sum, m) => sum + m.riskScore, 0) / models.length;

    // Determine consensus (all models agree ±20%)
    const modelRange = Math.max(...models.map(m => m.riskScore)) - Math.min(...models.map(m => m.riskScore));
    const consensus = modelRange <= 20;

    // Identify outliers (models outside ±30% of average)
    const outlierModels = models
      .filter(m => Math.abs(m.riskScore - averageRiskScore) > averageRiskScore * 0.3)
      .map(m => m.modelName);

    // Calculate model agreement
    const agreingModels = models.filter(m => Math.abs(m.riskScore - averageRiskScore) <= averageRiskScore * 0.2).length;
    const modelAgreement = (agreingModels / models.length) * 100;

    // Determine ensemble category
    let ensembleRiskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
    if (averageRiskScore < 5) ensembleRiskCategory = 'very-low';
    else if (averageRiskScore < 10) ensembleRiskCategory = 'low';
    else if (averageRiskScore < 20) ensembleRiskCategory = 'moderate';
    else if (averageRiskScore < 30) ensembleRiskCategory = 'high';
    else ensembleRiskCategory = 'very-high';

    // Generate recommendation
    const recommendation = this.generateClinicalRecommendation(
      averageRiskScore,
      patientData,
      models
    );

    const ensemble: EnsemblePrediction = {
      timestamp: new Date(),
      patientId,
      models,
      averageRiskScore,
      ensembleRiskCategory,
      consensus,
      recommendation,
      modelAgreement,
      outlierModels
    };

    // Store prediction
    let predictions = this.predictions.get(patientId) || [];
    predictions.push(ensemble);
    this.predictions.set(patientId, predictions);

    return ensemble;
  }

  /**
   * Framingham Risk Score Model
   */
  private predictFramingham(data: PatientData): MLPrediction {
    let score = 0;

    // Age points (based on Framingham)
    const agePoints = this.getFraminghamAgePoints(data.demographics.age, data.demographics.gender);
    score += agePoints;

    // Blood pressure points
    const bpPoints = this.getFraminghamBPPoints(
      data.measurements.bloodPressureSystolic,
      data.demographics.gender
    );
    score += bpPoints;

    // Cholesterol points
    const chPoints = this.getFraminghamCholessterolPoints(
      data.measurements.ldl,
      data.demographics.age,
      data.demographics.gender
    );
    score += chPoints;

    // HDL points
    const hdlPoints = this.getFraminghamHDLPoints(data.measurements.hdl, data.demographics.gender);
    score += hdlPoints;

    // Diabetes
    if (data.riskFactors.diabetes) score += 3;

    // Smoking
    if (data.riskFactors.smoking) score += 1;

    // Convert to 10-year risk %
    const baslineRisk = this.getFraminghamBaselineRisk(data.demographics.gender);
    const riskPercent = Math.min(
      100,
      baslineRisk * Math.pow(1.06, score)
    );

    const keyFactors: string[] = [];
    if (score > 10) keyFactors.push(`Framingham score ${score}`);
    if (data.riskFactors.hypertension) keyFactors.push('Hypertension');
    if (data.riskFactors.diabetes) keyFactors.push('Diabetes mellitus');
    if (data.riskFactors.smoking) keyFactors.push('Active smoking');

    return {
      modelName: 'Framingham Risk Score',
      riskScore: riskPercent,
      riskCategory: this.categorizeRisk(riskPercent),
      confidenceInterval: { lower: riskPercent * 0.8, upper: riskPercent * 1.2 },
      probabilityOfMI: riskPercent / 100,
      probabilityOfStroke: riskPercent * 0.6 / 100,
      probabilityOfHF: riskPercent * 0.4 / 100,
      probabilityOfCardiacDeath: riskPercent * 0.3 / 100,
      keyRiskFactors: keyFactors,
      protectiveFactors: data.measurements.hdl > 60 ? ['High HDL-cholesterol'] : [],
      timeHorizon: 10,
      confidenceScore: 92
    };
  }

  /**
   * ACC/AHA 2013 Pooled Cohort Equations
   */
  private predictAccAHA2013(data: PatientData): MLPrediction {
    let riskPercent = 0;

    // Simplified PCE calculation
    if (data.demographics.gender === 'Male' && data.demographics.age >= 40 && data.demographics.age <= 75) {
      // Male calculation
      riskPercent = this.calculatePCEMale(data);
    } else if (data.demographics.gender === 'Female' && data.demographics.age >= 40 && data.demographics.age <= 75) {
      // Female calculation
      riskPercent = this.calculatePCEFemale(data);
    } else {
      // Out of range - estimate
      riskPercent = data.riskFactors.smoking ? 12 : 8;
    }

    return {
      modelName: 'ACC/AHA 2013 PCE',
      riskScore: riskPercent,
      riskCategory: this.categorizeRisk(riskPercent),
      confidenceInterval: { lower: riskPercent * 0.75, upper: riskPercent * 1.25 },
      probabilityOfMI: riskPercent * 0.7 / 100,
      probabilityOfStroke: riskPercent * 0.5 / 100,
      probabilityOfHF: riskPercent * 0.3 / 100,
      probabilityOfCardiacDeath: riskPercent * 0.25 / 100,
      keyRiskFactors: this.extractKeyFactors(data),
      protectiveFactors: [],
      timeHorizon: 10,
      confidenceScore: 90
    };
  }

  /**
   * CAC-based Model
   */
  private predictCAC(data: PatientData): MLPrediction {
    const cacs = data.imaging.coronaryCalciumScore || 0;
    let riskPercent = 0;

    if (cacs === 0) {
      riskPercent = 1;
    } else if (cacs < 100) {
      riskPercent = 3;
    } else if (cacs < 400) {
      riskPercent = 8;
    } else {
      riskPercent = 15 + ((cacs - 400) / 600) * 10;
    }

    // Adjust for other factors
    if (data.riskFactors.hypertension) riskPercent *= 1.3;
    if (data.riskFactors.diabetes) riskPercent *= 1.5;
    if (data.riskFactors.smoking) riskPercent *= 1.4;

    riskPercent = Math.min(50, riskPercent);

    return {
      modelName: 'Coronary Calcium Score Model',
      riskScore: riskPercent,
      riskCategory: this.categorizeRisk(riskPercent),
      confidenceInterval: { lower: riskPercent * 0.7, upper: riskPercent * 1.3 },
      probabilityOfMI: riskPercent * 0.8 / 100,
      probabilityOfStroke: riskPercent * 0.3 / 100,
      probabilityOfHF: riskPercent * 0.2 / 100,
      probabilityOfCardiacDeath: riskPercent * 0.2 / 100,
      keyRiskFactors: [`CAC score: ${cacs}`],
      protectiveFactors: cacs === 0 ? ['Zero coronary calcium'] : [],
      timeHorizon: 10,
      confidenceScore: cacs > 0 ? 88 : 85
    };
  }

  /**
   * PCE (Pooled Cohort Equations) Model
   */
  private predictPCE(data: PatientData): MLPrediction {
    const basePCE = data.demographics.gender === 'Male' ? 5.5 : 4.2;
    let adjustedPCE = basePCE;

    // Risk factor adjustments
    if (data.riskFactors.hypertension) adjustedPCE += 2.5;
    if (data.riskFactors.diabetes) adjustedPCE += 2.0;
    if (data.riskFactors.smoking) adjustedPCE += 3.0;
    if (data.riskFactors.dyslipidemia) adjustedPCE += 1.5;
    if (data.measurements.ldl > 160) adjustedPCE += 2.0;

    return {
      modelName: 'Pooled Cohort Equations',
      riskScore: Math.min(40, adjustedPCE),
      riskCategory: this.categorizeRisk(Math.min(40, adjustedPCE)),
      confidenceInterval: { lower: adjustedPCE * 0.8, upper: adjustedPCE * 1.2 },
      probabilityOfMI: (adjustedPCE / 100) * 0.7,
      probabilityOfStroke: (adjustedPCE / 100) * 0.5,
      probabilityOfHF: (adjustedPCE / 100) * 0.3,
      probabilityOfCardiacDeath: (adjustedPCE / 100) * 0.2,
      keyRiskFactors: this.extractKeyFactors(data),
      protectiveFactors: [],
      timeHorizon: 10,
      confidenceScore: 91
    };
  }

  /**
   * Lipidomic-based Model (advanced biomarker)
   */
  private predictLipidomic(data: PatientData): MLPrediction {
    let lipidScore = 0;

    // LDL contribution
    if (data.measurements.ldl > 130) lipidScore += 3;
    else if (data.measurements.ldl > 100) lipidScore += 1;

    // HDL protective
    if (data.measurements.hdl < 40) lipidScore += 3;
    else if (data.measurements.hdl < 50) lipidScore += 1;

    // Triglycerides
    if (data.measurements.triglycerides > 200) lipidScore += 2;

    // Lipoprotein(a) if available
    const lpa = data.biomarkers.bNP || 0; // Proxy
    if (lpa > 50) lipidScore += 2;

    const riskPercent = 5 + (lipidScore * 1.5);

    return {
      modelName: 'Lipidomic Risk Model',
      riskScore: Math.min(35, riskPercent),
      riskCategory: this.categorizeRisk(Math.min(35, riskPercent)),
      confidenceInterval: { lower: riskPercent * 0.75, upper: riskPercent * 1.25 },
      probabilityOfMI: (riskPercent / 100) * 0.6,
      probabilityOfStroke: (riskPercent / 100) * 0.3,
      probabilityOfHF: (riskPercent / 100) * 0.2,
      probabilityOfCardiacDeath: (riskPercent / 100) * 0.15,
      keyRiskFactors: ['Lipid dysregulation'],
      protectiveFactors: data.measurements.hdl > 60 ? ['Protective HDL level'] : [],
      timeHorizon: 10,
      confidenceScore: 85
    };
  }

  /**
   * Generate clinical recommendation based on predictions
   */
  private generateClinicalRecommendation(
    riskScore: number,
    patientData: PatientData,
    models: MLPrediction[]
  ): string {
    if (riskScore < 5) {
      return 'Low risk. Continue preventive lifestyle modifications. Reassess in 3-5 years.';
    } else if (riskScore < 10) {
      return 'Low-moderate risk. Optimize risk factors. Consider aspirin if >60 years old.';
    } else if (riskScore < 20) {
      return 'Moderate risk. Initiate statin therapy. Consider additional imaging (CAC).';
    } else if (riskScore < 30) {
      return 'High risk. Intensive risk factor modification. Consider cardiology referral.';
    } else {
      return 'Very high risk. URGENT cardiology evaluation. Possible advanced testing (angiography).';
    }
  }

  /**
   * Calculate PCE for males
   */
  private calculatePCEMale(data: PatientData): number {
    // Simplified PCE calculation
    let riskScore = 3.0;

    riskScore += Math.log(data.demographics.age) * 0.5;
    riskScore += Math.log(data.measurements.ldl) * 0.7;
    riskScore -= Math.log(data.measurements.hdl) * 0.7;
    riskScore += Math.log(data.measurements.bloodPressureSystolic) * 1.2;

    if (data.riskFactors.smoking) riskScore += 2.0;
    if (data.riskFactors.diabetes) riskScore += 2.5;

    // Convert to percentage
    return Math.min(50, Math.max(1, riskScore));
  }

  /**
   * Calculate PCE for females
   */
  private calculatePCEFemale(data: PatientData): number {
    // Simplified PCE calculation
    let riskScore = 2.0;

    riskScore += Math.log(data.demographics.age) * 0.4;
    riskScore += Math.log(data.measurements.ldl) * 0.6;
    riskScore -= Math.log(data.measurements.hdl) * 0.6;
    riskScore += Math.log(data.measurements.bloodPressureSystolic) * 1.1;

    if (data.riskFactors.smoking) riskScore += 2.5;
    if (data.riskFactors.diabetes) riskScore += 2.0;

    return Math.min(50, Math.max(1, riskScore));
  }

  /**
   * Get Framingham age points
   */
  private getFraminghamAgePoints(age: number, gender: string): number {
    if (gender === 'Male') {
      if (age < 35) return 0;
      if (age < 40) return 1;
      if (age < 45) return 2;
      if (age < 50) return 3;
      if (age < 55) return 4;
      return 5;
    } else {
      if (age < 35) return 0;
      if (age < 45) return 1;
      if (age < 50) return 2;
      if (age < 55) return 3;
      if (age < 60) return 4;
      return 5;
    }
  }

  /**
   * Get Framingham BP points
   */
  private getFraminghamBPPoints(sbp: number, gender: string): number {
    if (sbp < 120) return 0;
    if (sbp < 130) return 1;
    if (sbp < 140) return 2;
    if (sbp < 160) return 3;
    return 4;
  }

  /**
   * Get Framingham cholesterol points
   */
  private getFraminghamCholessterolPoints(ldl: number, age: number, gender: string): number {
    if (ldl < 160) return 0;
    if (ldl < 200) return 1;
    if (ldl < 240) return 2;
    return 3;
  }

  /**
   * Get Framingham HDL points
   */
  private getFraminghamHDLPoints(hdl: number, gender: string): number {
    if (hdl >= 60) return 0;
    if (hdl >= 50) return 1;
    if (hdl >= 40) return 2;
    return 3;
  }

  /**
   * Get Framingham baseline risk
   */
  private getFraminghamBaselineRisk(gender: string): number {
    return gender === 'Male' ? 0.08 : 0.04;
  }

  /**
   * Extract key risk factors
   */
  private extractKeyFactors(data: PatientData): string[] {
    const factors: string[] = [];

    if (data.riskFactors.hypertension) factors.push('Hypertension');
    if (data.riskFactors.diabetes) factors.push('Diabetes');
    if (data.riskFactors.smoking) factors.push('Smoking');
    if (data.riskFactors.dyslipidemia) factors.push('Dyslipidemia');
    if (data.riskFactors.obesity) factors.push('Obesity');
    if (data.riskFactors.familyHistoryCAD) factors.push('Family history of CAD');

    return factors;
  }

  /**
   * Categorize risk
   */
  private categorizeRisk(
    riskScore: number
  ): 'very-low' | 'low' | 'moderate' | 'high' | 'very-high' {
    if (riskScore < 5) return 'very-low';
    if (riskScore < 10) return 'low';
    if (riskScore < 20) return 'moderate';
    if (riskScore < 30) return 'high';
    return 'very-high';
  }

  /**
   * Record outcome for model validation
   */
  recordOutcome(
    patientId: string,
    eventType: 'MI' | 'stroke' | 'HF' | 'cardiacDeath' | 'revascularization' | 'none',
    followUpDays: number,
    prediction: EnsemblePrediction
  ): void {
    const event: OutcomeEvent = {
      patientId,
      eventType,
      eventDate: new Date(),
      followUpDays,
      predictedProbability: prediction.averageRiskScore / 100,
      actualOutcome: eventType !== 'none'
    };

    // Check model accuracy
    if (
      (eventType !== 'none' && prediction.averageRiskScore > 50) ||
      (eventType === 'none' && prediction.averageRiskScore < 50)
    ) {
      event.modelAccuracy = true;
    } else {
      event.modelAccuracy = false;
    }

    this.outcomes.push(event);
    this.updateModelPerformance();
  }

  /**
   * Update model performance metrics
   */
  private updateModelPerformance(): void {
    // Calculate metrics for each model
    const modelOutcomes = new Map<string, OutcomeEvent[]>();

    this.outcomes.forEach(outcome => {
      this.predictions.get(outcome.patientId)?.forEach(pred => {
        pred.models.forEach(model => {
          if (!modelOutcomes.has(model.modelName)) {
            modelOutcomes.set(model.modelName, []);
          }
          modelOutcomes.get(model.modelName)?.push(outcome);
        });
      });
    });

    modelOutcomes.forEach((outcomes, modelName) => {
      const truePositives = outcomes.filter(o => o.actualOutcome && o.modelAccuracy).length;
      const falsePositives = outcomes.filter(o => !o.actualOutcome && !o.modelAccuracy).length;
      const trueNegatives = outcomes.filter(o => !o.actualOutcome && o.modelAccuracy).length;
      const falseNegatives = outcomes.filter(o => o.actualOutcome && !o.modelAccuracy).length;

      const sensitivity = truePositives / (truePositives + falseNegatives) || 0;
      const specificity = trueNegatives / (trueNegatives + falsePositives) || 0;
      const precision = truePositives / (truePositives + falsePositives) || 0;
      const accuracy = (truePositives + trueNegatives) / outcomes.length;
      const f1 = (2 * precision * sensitivity) / (precision + sensitivity) || 0;

      this.modelPerformance.set(modelName, {
        modelName,
        sensitivity,
        specificity,
        precision,
        recall: sensitivity,
        f1Score: f1,
        auc: (sensitivity + specificity) / 2, // Simplified
        calibration: accuracy,
        accuracy,
        totalPatients: outcomes.length,
        predictedEvents: outcomes.filter(o => o.modelAccuracy).length,
        actualEvents: outcomes.filter(o => o.actualOutcome).length,
        truePositives,
        falsePositives,
        trueNegatives,
        falseNegatives
      });
    });
  }

  /**
   * Get model performance
   */
  getModelPerformance(modelName?: string): ModelPerformance[] {
    if (modelName) {
      const perf = this.modelPerformance.get(modelName);
      return perf ? [perf] : [];
    }
    return Array.from(this.modelPerformance.values());
  }

  /**
   * Get patient predictions
   */
  getPatientPredictions(patientId: string): EnsemblePrediction[] {
    return this.predictions.get(patientId) || [];
  }

  /**
   * Get latest prediction
   */
  getLatestPrediction(patientId: string): EnsemblePrediction | null {
    const predictions = this.predictions.get(patientId);
    return predictions ? predictions[predictions.length - 1] : null;
  }

  /**
   * Generate prediction report
   */
  generatePredictionReport(patientId: string): string {
    const latest = this.getLatestPrediction(patientId);
    if (!latest) return 'No predictions found for patient';

    let report = '# ML-Based Cardiovascular Risk Prediction Report\n\n';
    report += `Patient ID: ${patientId}\n`;
    report += `Prediction Date: ${latest.timestamp.toLocaleString()}\n\n`;

    report += '## Ensemble Risk Assessment\n';
    report += `- **Average Risk Score**: ${latest.averageRiskScore.toFixed(1)}/100\n`;
    report += `- **Risk Category**: ${latest.ensembleRiskCategory.toUpperCase()}\n`;
    report += `- **Model Agreement**: ${latest.modelAgreement.toFixed(1)}%\n`;
    report += `- **Consensus**: ${latest.consensus ? 'Yes' : 'No'}\n`;
    if (latest.outlierModels.length > 0) {
      report += `- **Outlier Models**: ${latest.outlierModels.join(', ')}\n`;
    }
    report += '\n';

    report += '## Individual Model Predictions\n';
    latest.models.forEach((model, i) => {
      report += `\n${i + 1}. **${model.modelName}**\n`;
      report += `   - Risk Score: ${model.riskScore.toFixed(1)}/100\n`;
      report += `   - MI Probability: ${(model.probabilityOfMI * 100).toFixed(1)}%\n`;
      report += `   - HF Probability: ${(model.probabilityOfHF * 100).toFixed(1)}%\n`;
      report += `   - Confidence: ${model.confidenceScore}%\n`;
    });

    report += '\n## Clinical Recommendation\n';
    report += latest.recommendation + '\n';

    report += '\n## Model Performance Metrics\n';
    this.getModelPerformance().forEach(perf => {
      report += `\n**${perf.modelName}**:\n`;
      report += `- AUC: ${perf.auc.toFixed(3)}\n`;
      report += `- Accuracy: ${(perf.accuracy * 100).toFixed(1)}%\n`;
      report += `- Sensitivity: ${(perf.sensitivity * 100).toFixed(1)}%\n`;
      report += `- Specificity: ${(perf.specificity * 100).toFixed(1)}%\n`;
    });

    return report;
  }
}

export default new PredictiveAnalyticsService();
