/**
 * Predictive Alert System Service
 * Uses ML anomaly detection and predictive modeling to generate early warning alerts
 * Monitors patient status and alerts for elevated risk situations
 * 
 * Phase 5 Task 2: Predictive Alert System for High-Risk Situations
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  lookbackPeriodMinutes: number;
  cooldownMinutes: number; // prevent alert spam
  metadata: Record<string, any>;
}

export interface PredictiveAlert {
  id: string;
  ruleId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredValue?: number;
  probability?: number; // prediction confidence
  recommendedActions: string[];
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
}

export interface RiskAnomaly {
  type: 'heart-rate-spike' | 'irregular-pattern' | 'sleep-deficit' | 'activity-drop' | 'stress-elevation' | 'data-anomaly';
  timestamp: Date;
  severity: number; // 0-100
  description: string;
  affectedMetrics: string[];
  confidence: number; // 0-1
}

export interface AnomalyDetectionModel {
  metric: string;
  mean: number;
  stdDeviation: number;
  anomalyThreshold: number; // z-score threshold
}

export interface PredictionResult {
  metricName: string;
  currentValue: number;
  predictedValue: number;
  predictionConfidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  timeframeMinutes: number;
}

export interface AlertHistory {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  mostCommonType: string;
  averageResponseTime?: number; // minutes
  falsePositiveRate?: number; // percentage
}

class PredictiveAlertSystem {
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: PredictiveAlert[] = [];
  private anomalies: RiskAnomaly[] = [];
  private anomalyModels: Map<string, AnomalyDetectionModel> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  private patientMetricsHistory: Map<string, number[]> = new Map();

  constructor() {
    this.initializeDefaultAlertRules();
    this.initializeAnomalyDetectionModels();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    const rules: AlertRule[] = [
      {
        id: 'hr-spike',
        name: 'Heart Rate Spike Alert',
        description: 'Alert when heart rate exceeds safe levels',
        enabled: true,
        severity: 'high',
        threshold: 120,
        lookbackPeriodMinutes: 5,
        cooldownMinutes: 30,
        metadata: { metric: 'heartRate', unit: 'bpm' }
      },
      {
        id: 'hr-drop',
        name: 'Bradycardia Alert',
        description: 'Alert when resting heart rate drops below 50',
        enabled: true,
        severity: 'medium',
        threshold: 50,
        lookbackPeriodMinutes: 10,
        cooldownMinutes: 45,
        metadata: { metric: 'restingHeartRate', unit: 'bpm', comparison: 'below' }
      },
      {
        id: 'bp-elevation',
        name: 'Blood Pressure Elevation',
        description: 'Alert when systolic BP exceeds 160 mmHg',
        enabled: true,
        severity: 'high',
        threshold: 160,
        lookbackPeriodMinutes: 3,
        cooldownMinutes: 20,
        metadata: { metric: 'systolicBP', unit: 'mmHg' }
      },
      {
        id: 'spo2-low',
        name: 'Low Oxygen Saturation',
        description: 'Alert when SpO2 drops below 95%',
        enabled: true,
        severity: 'critical',
        threshold: 95,
        lookbackPeriodMinutes: 2,
        cooldownMinutes: 15,
        metadata: { metric: 'spO2', unit: '%', comparison: 'below' }
      },
      {
        id: 'arrhythmia-detection',
        name: 'Potential Arrhythmia',
        description: 'Alert on irregular heart rhythm patterns',
        enabled: true,
        severity: 'high',
        threshold: 0.7, // confidence threshold
        lookbackPeriodMinutes: 5,
        cooldownMinutes: 30,
        metadata: { metric: 'heartRateVariability', threshold: 20 }
      },
      {
        id: 'risk-score-increase',
        name: 'Risk Score Escalation',
        description: 'Alert when risk score increases significantly',
        enabled: true,
        severity: 'medium',
        threshold: 15, // 15% increase
        lookbackPeriodMinutes: 60,
        cooldownMinutes: 120,
        metadata: { metric: 'riskScore', comparison: 'percentageIncrease' }
      },
      {
        id: 'activity-drop',
        name: 'Significant Activity Decrease',
        description: 'Alert when daily activity drops unexpectedly',
        enabled: true,
        severity: 'low',
        threshold: 50, // 50% decrease
        lookbackPeriodMinutes: 1440, // 1 day
        cooldownMinutes: 1440,
        metadata: { metric: 'dailySteps', comparison: 'percentageDecrease' }
      },
      {
        id: 'sleep-deficit',
        name: 'Sleep Deficit Alert',
        description: 'Alert when sleep duration is critically low',
        enabled: true,
        severity: 'low',
        threshold: 240, // 4 hours
        lookbackPeriodMinutes: 1440,
        cooldownMinutes: 1440,
        metadata: { metric: 'sleepDuration', unit: 'minutes', comparison: 'below' }
      }
    ];

    rules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize anomaly detection models
   */
  private initializeAnomalyDetectionModels(): void {
    const models: AnomalyDetectionModel[] = [
      {
        metric: 'heartRate',
        mean: 72,
        stdDeviation: 12,
        anomalyThreshold: 2.5 // 2.5 standard deviations
      },
      {
        metric: 'systolicBP',
        mean: 125,
        stdDeviation: 15,
        anomalyThreshold: 2.0
      },
      {
        metric: 'spO2',
        mean: 97,
        stdDeviation: 1.5,
        anomalyThreshold: 3.0
      },
      {
        metric: 'dailySteps',
        mean: 8000,
        stdDeviation: 3000,
        anomalyThreshold: 2.0
      },
      {
        metric: 'sleepDuration',
        mean: 450, // 7.5 hours
        stdDeviation: 60,
        anomalyThreshold: 2.5
      }
    ];

    models.forEach(model => {
      this.anomalyModels.set(model.metric, model);
    });
  }

  /**
   * Register new alert rule
   */
  registerAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Process incoming health metric
   */
  processMetric(
    metricName: string,
    value: number,
    timestamp: Date = new Date()
  ): PredictiveAlert | null {
    // Store in history
    if (!this.patientMetricsHistory.has(metricName)) {
      this.patientMetricsHistory.set(metricName, []);
    }
    this.patientMetricsHistory.get(metricName)!.push(value);

    // Keep only last 1000 readings
    const history = this.patientMetricsHistory.get(metricName)!;
    if (history.length > 1000) {
      history.shift();
    }

    // Check against alert rules
    const triggeredAlert = this.evaluateAlertRules(metricName, value, timestamp);

    // Check for anomalies
    const anomaly = this.detectAnomaly(metricName, value);
    if (anomaly) {
      this.anomalies.push(anomaly);
      // Keep only last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      this.anomalies = this.anomalies.filter(a => a.timestamp > thirtyDaysAgo);
    }

    return triggeredAlert;
  }

  /**
   * Evaluate alert rules
   */
  private evaluateAlertRules(metricName: string, value: number, timestamp: Date): PredictiveAlert | null {
    // Find matching rule
    const rule = Array.from(this.alertRules.values()).find(r =>
      r.metadata.metric === metricName && r.enabled
    );

    if (!rule) return null;

    // Check cooldown
    const lastAlert = this.lastAlertTime.get(rule.id);
    if (lastAlert && Date.now() - lastAlert.getTime() < rule.cooldownMinutes * 60 * 1000) {
      return null; // Still in cooldown
    }

    // Evaluate threshold
    let shouldAlert = false;
    if (rule.metadata.comparison === 'below') {
      shouldAlert = value < rule.threshold;
    } else if (rule.metadata.comparison === 'percentageIncrease') {
      // Check historical increase
      const history = this.patientMetricsHistory.get(metricName) || [];
      if (history.length >= 2) {
        const previousValue = history[history.length - 2];
        const percentChange = ((value - previousValue) / previousValue) * 100;
        shouldAlert = percentChange > rule.threshold;
      }
    } else {
      shouldAlert = value > rule.threshold;
    }

    if (shouldAlert) {
      const alert = this.createAlert(rule, value, timestamp);
      this.alerts.push(alert);
      this.lastAlertTime.set(rule.id, timestamp);
      return alert;
    }

    return null;
  }

  /**
   * Detect anomalies using statistical methods
   */
  private detectAnomaly(metricName: string, value: number): RiskAnomaly | null {
    const model = this.anomalyModels.get(metricName);
    if (!model) return null;

    // Calculate z-score
    const zScore = Math.abs((value - model.mean) / model.stdDeviation);

    if (zScore > model.anomalyThreshold) {
      const severity = Math.min(100, (zScore - model.anomalyThreshold) * 20);
      
      return {
        type: this.getAnomalyType(metricName),
        timestamp: new Date(),
        severity: Math.round(severity),
        description: `${metricName} anomaly detected: value ${value} is ${zScore.toFixed(1)} standard deviations from mean`,
        affectedMetrics: [metricName],
        confidence: Math.min(1, zScore / 5)
      };
    }

    return null;
  }

  /**
   * Get anomaly type from metric name
   */
  private getAnomalyType(metricName: string):
    | 'heart-rate-spike'
    | 'irregular-pattern'
    | 'sleep-deficit'
    | 'activity-drop'
    | 'stress-elevation'
    | 'data-anomaly' {
    switch (metricName) {
      case 'heartRate':
        return 'heart-rate-spike';
      case 'heartRateVariability':
        return 'irregular-pattern';
      case 'sleepDuration':
        return 'sleep-deficit';
      case 'dailySteps':
        return 'activity-drop';
      case 'stressLevel':
        return 'stress-elevation';
      default:
        return 'data-anomaly';
    }
  }

  /**
   * Create alert
   */
  private createAlert(rule: AlertRule, triggeredValue: number, timestamp: Date): PredictiveAlert {
    const id = `alert-${Date.now()}-${Math.random()}`;

    return {
      id,
      ruleId: rule.id,
      timestamp,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      triggeredValue,
      recommendedActions: this.getRecommendedActions(rule, triggeredValue),
      isAcknowledged: false
    };
  }

  /**
   * Get recommended actions for alert
   */
  private getRecommendedActions(rule: AlertRule, value: number): string[] {
    const actions: string[] = [];

    switch (rule.id) {
      case 'hr-spike':
        actions.push('Stop current activity and sit down');
        actions.push('Practice slow, deep breathing (4-7-8 technique)');
        actions.push('If persists > 10 min, contact healthcare provider');
        break;
      case 'hr-drop':
        actions.push('Sit up and move slowly');
        actions.push('If dizzy or fatigued, lie down');
        actions.push('Seek medical attention if symptoms persist');
        break;
      case 'bp-elevation':
        actions.push('Relax and avoid stressful situations');
        actions.push('Stay hydrated and avoid caffeine');
        actions.push('Schedule urgent checkup with healthcare provider');
        break;
      case 'spo2-low':
        actions.push('⚠️ URGENT: Seek immediate medical attention');
        actions.push('Move to well-ventilated area');
        actions.push('Call emergency services if SpO2 < 90%');
        break;
      case 'arrhythmia-detection':
        actions.push('Remain calm and note the pattern');
        actions.push('Track any associated symptoms');
        actions.push('Contact cardiologist for evaluation');
        break;
      case 'risk-score-increase':
        actions.push('Review recent lifestyle changes');
        actions.push('Verify accuracy of health data entry');
        actions.push('Schedule follow-up with healthcare provider');
        break;
      case 'activity-drop':
        actions.push('Check if illness or injury is limiting activity');
        actions.push('Resume activity gradually when able');
        actions.push('Contact healthcare provider if prolonged');
        break;
      case 'sleep-deficit':
        actions.push('Prioritize sleep - aim for 7-9 hours tonight');
        actions.push('Establish consistent sleep schedule');
        actions.push('Avoid screens 1 hour before bedtime');
        break;
    }

    return actions;
  }

  /**
   * Predict future metric values
   */
  predictMetricValue(metricName: string, minutesAhead: number = 60): PredictionResult | null {
    const history = this.patientMetricsHistory.get(metricName);
    if (!history || history.length < 5) return null;

    const recent = history.slice(-10);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);

    // Simple trend analysis
    const trend = this.analyzeTrend(recent);

    // Prediction using exponential smoothing
    let predicted = recent[recent.length - 1];
    const alpha = 0.3; // smoothing factor
    for (let i = 0; i < Math.ceil(minutesAhead / 5); i++) {
      predicted = alpha * predicted + (1 - alpha) * mean;
    }

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    const threshold = this.alertRules.get('hr-spike')?.threshold || 120;
    if (predicted > threshold) riskLevel = 'critical';
    else if (predicted > threshold * 0.8) riskLevel = 'high';
    else if (predicted > threshold * 0.6) riskLevel = 'moderate';

    return {
      metricName,
      currentValue: recent[recent.length - 1],
      predictedValue: Math.round(predicted * 10) / 10,
      predictionConfidence: Math.min(0.95, 1 - (stdDev / mean) * 0.2),
      trend,
      riskLevel,
      timeframeMinutes: minutesAhead
    };
  }

  /**
   * Analyze trend
   */
  private analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const first = values.slice(0, 3).reduce((a, b) => a + b) / 3;
    const last = values.slice(-3).reduce((a, b) => a + b) / 3;
    const change = ((last - first) / first) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PredictiveAlert[] {
    return this.alerts.filter(a => !a.isAcknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isAcknowledged = true;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get recent anomalies
   */
  getRecentAnomalies(hoursBack: number = 24): RiskAnomaly[] {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return this.anomalies.filter(a => a.timestamp > cutoff);
  }

  /**
   * Get alert history statistics
   */
  getAlertHistory(): AlertHistory {
    const critical = this.alerts.filter(a => a.severity === 'critical').length;
    const high = this.alerts.filter(a => a.severity === 'high').length;
    const medium = this.alerts.filter(a => a.severity === 'medium').length;
    const low = this.alerts.filter(a => a.severity === 'low').length;

    // Find most common alert type
    const ruleCounts = new Map<string, number>();
    this.alerts.forEach(a => {
      ruleCounts.set(a.ruleId, (ruleCounts.get(a.ruleId) || 0) + 1);
    });

    let mostCommonType = 'Unknown';
    let maxCount = 0;
    ruleCounts.forEach((count, ruleId) => {
      if (count > maxCount) {
        maxCount = count;
        const rule = this.alertRules.get(ruleId);
        mostCommonType = rule?.name || ruleId;
      }
    });

    return {
      totalAlerts: this.alerts.length,
      criticalAlerts: critical,
      highAlerts: high,
      mediumAlerts: medium,
      lowAlerts: low,
      mostCommonType,
      falsePositiveRate: this.calculateFalsePositiveRate()
    };
  }

  /**
   * Calculate false positive rate (simplified)
   */
  private calculateFalsePositiveRate(): number {
    // Simple heuristic: low percentage if most alerts are acknowledged
    const acknowledged = this.alerts.filter(a => a.isAcknowledged).length;
    if (this.alerts.length === 0) return 0;

    // Estimate based on alert resolution
    return Math.max(0, Math.min(50, 100 - (acknowledged / this.alerts.length) * 100));
  }

  /**
   * Generate alert report
   */
  generateAlertReport(days: number = 7): string {
    const history = this.getAlertHistory();
    const activeAlerts = this.getActiveAlerts();
    const recentAnomalies = this.getRecentAnomalies(days * 24);

    let report = '# Predictive Alert System Report\n\n';

    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    report += '## Alert Summary (All Time)\n';
    report += `- **Total Alerts**: ${history.totalAlerts}\n`;
    report += `- **Critical**: ${history.criticalAlerts}\n`;
    report += `- **High**: ${history.highAlerts}\n`;
    report += `- **Medium**: ${history.mediumAlerts}\n`;
    report += `- **Low**: ${history.lowAlerts}\n`;
    report += `- **Most Common**: ${history.mostCommonType}\n`;
    if (history.falsePositiveRate) {
      report += `- **Estimated False Positive Rate**: ${history.falsePositiveRate.toFixed(1)}%\n`;
    }

    report += '\n## Active Alerts\n';
    if (activeAlerts.length === 0) {
      report += 'No active alerts at this time.\n';
    } else {
      activeAlerts.forEach(alert => {
        report += `\n### ${alert.title} (${alert.severity.toUpperCase()})\n`;
        report += `- **Time**: ${alert.timestamp.toLocaleString()}\n`;
        report += `- **Value**: ${alert.triggeredValue}\n`;
        report += `- **Actions**:\n`;
        alert.recommendedActions.forEach(action => {
          report += `  - ${action}\n`;
        });
      });
    }

    report += `\n## Recent Anomalies (Last ${days} days: ${recentAnomalies.length})\n`;
    recentAnomalies.slice(0, 5).forEach(anomaly => {
      report += `- **${anomaly.type}**: ${anomaly.description} (Severity: ${anomaly.severity})\n`;
    });

    return report;
  }

  /**
   * Export alert configuration
   */
  exportAlertConfiguration(): string {
    const config = {
      rules: Array.from(this.alertRules.values()),
      models: Array.from(this.anomalyModels.values())
    };

    return JSON.stringify(config, null, 2);
  }
}

export default new PredictiveAlertSystem();
