/**
 * Wearable Device Integration Service
 * Real-time health monitoring from Apple Watch, Fitbit, and other wearable devices
 * Processes continuous cardiac data for real-time risk assessment
 * 
 * Phase 5 Task 1: Real-Time Health Monitoring with Wearable Integration
 */

export interface WearableDevice {
  id: string;
  type: 'apple-watch' | 'fitbit' | 'garmin' | 'xiaomi' | 'oura-ring';
  name: string;
  model: string;
  lastSync: Date;
  batteryPercent: number;
  isConnected: boolean;
  dataTypes: string[];
}

export interface HeartRateData {
  timestamp: Date;
  heartRate: number;
  heartRateVariability?: number; // ms
  restingHeartRate?: number;
  maxHeartRate?: number;
  confidence?: number; // 0-100%
}

export interface StepData {
  date: Date;
  steps: number;
  distance: number; // km
  calories: number;
  activeMinutes: number;
}

export interface SleepData {
  date: Date;
  totalSleep: number; // minutes
  deepSleep: number; // minutes
  lightSleep: number;
  rem: number;
  quality: number; // 0-100
  restfulness: number; // 0-100
}

export interface BloodOxygenData {
  timestamp: Date;
  spO2: number; // percentage
  confidence?: number;
}

export interface TemperatureData {
  timestamp: Date;
  bodyTemp: number; // celsius
  skinTemp: number;
}

export interface WearableSnapshot {
  deviceId: string;
  timestamp: Date;
  heartRate?: number;
  heartRateVariability?: number;
  spO2?: number;
  steps?: number;
  activeMinutes?: number;
  sleepQuality?: number;
  bodyTemp?: number;
  stressLevel?: number; // 0-100
}

export interface WearableHealthScore {
  date: Date;
  overallScore: number; // 0-100
  cardiacHealth: number;
  activityLevel: number;
  sleepQuality: number;
  stressLevel: number;
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
  recommendations: string[];
}

export interface AnomalyDetection {
  detected: boolean;
  type: 'tachycardia' | 'bradycardia' | 'arrhythmia' | 'hypoxia' | 'fever' | 'anomalous-activity';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  timestamp: Date;
  details: string;
  recommendedAction: string;
}

class WearableIntegrationService {
  private readonly connectedDevices: Map<string, WearableDevice> = new Map();
  private heartRateHistory: HeartRateData[] = [];
  private stepHistory: StepData[] = [];
  private sleepHistory: SleepData[] = [];
  private oxygenHistory: BloodOxygenData[] = [];
  private anomalyLog: AnomalyDetection[] = [];
  private readonly lastProcessedTimestamp: Map<string, Date> = new Map();

  /**
   * Register wearable device
   */
  registerDevice(device: Omit<WearableDevice, 'lastSync' | 'isConnected'>): WearableDevice {
    const fullDevice: WearableDevice = {
      ...device,
      lastSync: new Date(),
      isConnected: true
    };

    this.connectedDevices.set(device.id, fullDevice);
    return fullDevice;
  }

  /**
   * Get connected devices
   */
  getConnectedDevices(): WearableDevice[] {
    return Array.from(this.connectedDevices.values()).filter(d => d.isConnected);
  }

  /**
   * Update heart rate data from wearable
   */
  updateHeartRateData(deviceId: string, data: Omit<HeartRateData, 'timestamp'> & { timestamp?: Date }): void {
    const heartRateEntry: HeartRateData = {
      heartRate: data.heartRate,
      heartRateVariability: data.heartRateVariability,
      restingHeartRate: data.restingHeartRate,
      maxHeartRate: data.maxHeartRate,
      confidence: data.confidence || 85,
      timestamp: data.timestamp || new Date()
    };

    this.heartRateHistory.push(heartRateEntry);

    // Keep only last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.heartRateHistory = this.heartRateHistory.filter(h => h.timestamp > sevenDaysAgo);

    // Check for anomalies
    this.detectHeartRateAnomalies(heartRateEntry);

    // Update device last sync
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.lastSync = new Date();
    }
  }

  /**
   * Update step data
   */
  updateStepData(deviceId: string, data: StepData): void {
    this.stepHistory.push(data);

    // Keep only last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.stepHistory = this.stepHistory.filter(s => s.date > thirtyDaysAgo);
  }

  /**
   * Update sleep data
   */
  updateSleepData(deviceId: string, data: SleepData): void {
    // Avoid duplicate entries
    const isDuplicate = this.sleepHistory.some(s =>
      s.date.toDateString() === data.date.toDateString()
    );

    if (!isDuplicate) {
      this.sleepHistory.push(data);

      // Keep only last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      this.sleepHistory = this.sleepHistory.filter(s => s.date > thirtyDaysAgo);
    }
  }

  /**
   * Update blood oxygen data
   */
  updateBloodOxygenData(deviceId: string, data: Omit<BloodOxygenData, 'timestamp'> & { timestamp?: Date }): void {
    const oxygenEntry: BloodOxygenData = {
      spO2: data.spO2,
      confidence: data.confidence || 90,
      timestamp: data.timestamp || new Date()
    };

    this.oxygenHistory.push(oxygenEntry);

    // Keep only last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.oxygenHistory = this.oxygenHistory.filter(o => o.timestamp > sevenDaysAgo);

    // Check for hypoxia
    if (oxygenEntry.spO2 < 95) {
      this.recordAnomaly({
        detected: true,
        type: 'hypoxia',
        severity: oxygenEntry.spO2 < 90 ? 'critical' : 'high',
        timestamp: oxygenEntry.timestamp,
        details: `SpO2 level: ${oxygenEntry.spO2}%`,
        recommendedAction: oxygenEntry.spO2 < 90 ? 'Seek immediate medical attention' : 'Monitor closely and consult healthcare provider'
      });
    }
  }

  /**
   * Get daily heart rate statistics
   */
  getDailyHeartRateStats(date?: Date): {
    average: number;
    min: number;
    max: number;
    readings: number;
    restingHR?: number;
    hrv?: number;
  } | null {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayReadings = this.heartRateHistory.filter(
      h => h.timestamp >= startOfDay && h.timestamp <= endOfDay
    );

    if (dayReadings.length === 0) return null;

    const hrs = dayReadings.map(r => r.heartRate);
    const average = hrs.reduce((a, b) => a + b, 0) / hrs.length;
    const hrv = dayReadings.find(r => r.heartRateVariability)?.heartRateVariability;
    const resting = dayReadings.find(r => r.restingHeartRate)?.restingHeartRate;

    return {
      average: Math.round(average),
      min: Math.min(...hrs),
      max: Math.max(...hrs),
      readings: dayReadings.length,
      restingHR: resting,
      hrv
    };
  }

  /**
   * Get activity metrics
   */
  getActivityMetrics(days: number = 7): {
    totalSteps: number;
    averageSteps: number;
    totalDistance: number;
    totalCalories: number;
    averageActiveMinutes: number;
    trend: 'improving' | 'stable' | 'declining';
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentData = this.stepHistory.filter(s => s.date > cutoffDate);

    if (recentData.length === 0) {
      return {
        totalSteps: 0,
        averageSteps: 0,
        totalDistance: 0,
        totalCalories: 0,
        averageActiveMinutes: 0,
        trend: 'stable'
      };
    }

    const totalSteps = recentData.reduce((sum, s) => sum + s.steps, 0);
    const totalDistance = recentData.reduce((sum, s) => sum + s.distance, 0);
    const totalCalories = recentData.reduce((sum, s) => sum + s.calories, 0);
    const totalActive = recentData.reduce((sum, s) => sum + s.activeMinutes, 0);

    // Determine trend
    const firstHalf = recentData.slice(0, Math.ceil(recentData.length / 2));
    const secondHalf = recentData.slice(Math.ceil(recentData.length / 2));
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.steps, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.steps, 0) / secondHalf.length;

    let trend: 'improving' | 'stable' | 'declining';
    if (secondAvg > firstAvg * 1.1) trend = 'improving';
    else if (secondAvg < firstAvg * 0.9) trend = 'declining';
    else trend = 'stable';

    return {
      totalSteps,
      averageSteps: Math.round(totalSteps / recentData.length),
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalCalories,
      averageActiveMinutes: Math.round(totalActive / recentData.length),
      trend
    };
  }

  /**
   * Get sleep quality metrics
   */
  getSleepMetrics(days: number = 7): {
    averageNightSleep: number;
    averageDeepSleep: number;
    averageQuality: number;
    trend: string;
    recommendations: string[];
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentSleep = this.sleepHistory.filter(s => s.date > cutoffDate);

    if (recentSleep.length === 0) {
      return {
        averageNightSleep: 0,
        averageDeepSleep: 0,
        averageQuality: 0,
        trend: 'No data',
        recommendations: ['Ensure wearable device is properly synced']
      };
    }

    const avgTotal = recentSleep.reduce((sum, s) => sum + s.totalSleep, 0) / recentSleep.length;
    const avgDeep = recentSleep.reduce((sum, s) => sum + s.deepSleep, 0) / recentSleep.length;
    const avgQuality = recentSleep.reduce((sum, s) => sum + s.quality, 0) / recentSleep.length;

    const recommendations: string[] = [];
    if (avgTotal < 360) recommendations.push('Try to increase sleep duration to at least 6-7 hours per night');
    if (avgDeep < 60) recommendations.push('Deep sleep is low; improve sleep hygiene and reduce caffeine');
    if (avgQuality < 70) recommendations.push('Sleep quality could be improved; maintain consistent sleep schedule');

    return {
      averageNightSleep: Math.round(avgTotal),
      averageDeepSleep: Math.round(avgDeep),
      averageQuality: Math.round(avgQuality),
      trend: avgQuality > 75 ? 'Good' : avgQuality > 60 ? 'Fair' : 'Poor',
      recommendations
    };
  }

  /**
   * Detect heart rate anomalies
   */
  private detectHeartRateAnomalies(data: HeartRateData): void {
    const hr = data.heartRate;

    if (hr > 100 && hr < 180) {
      // Tachycardia
      this.recordAnomaly({
        detected: true,
        type: 'tachycardia',
        severity: hr > 120 ? 'high' : 'moderate',
        timestamp: data.timestamp,
        details: `Heart rate: ${hr} bpm`,
        recommendedAction: 'Rest and relax. If persists, contact healthcare provider.'
      });
    } else if (hr < 60 && hr > 40) {
      // Bradycardia
      this.recordAnomaly({
        detected: true,
        type: 'bradycardia',
        severity: hr < 50 ? 'high' : 'moderate',
        timestamp: data.timestamp,
        details: `Heart rate: ${hr} bpm`,
        recommendedAction: 'Monitor closely. Bradycardia may indicate health concerns.'
      });
    }

    // Check for irregular heart rate variability patterns
    if (data.heartRateVariability && data.heartRateVariability < 20) {
      this.recordAnomaly({
        detected: true,
        type: 'arrhythmia',
        severity: 'moderate',
        timestamp: data.timestamp,
        details: `Low HRV: ${data.heartRateVariability} ms (elevated stress or arrhythmia risk)`,
        recommendedAction: 'Consider stress reduction techniques. Consult cardiologist if persistent.'
      });
    }
  }

  /**
   * Record anomaly detection
   */
  private recordAnomaly(anomaly: AnomalyDetection): void {
    this.anomalyLog.push(anomaly);

    // Keep only last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.anomalyLog = this.anomalyLog.filter(a => a.timestamp > thirtyDaysAgo);
  }

  /**
   * Get recent anomalies
   */
  getRecentAnomalies(hoursBack: number = 24): AnomalyDetection[] {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return this.anomalyLog.filter(a => a.timestamp > cutoffTime);
  }

  /**
   * Calculate daily health score
   */
  calculateDailyHealthScore(date?: Date): WearableHealthScore {
    const targetDate = date || new Date();

    const hrStats = this.getDailyHeartRateStats(targetDate);
    const activityStats = this.getActivityMetrics(1);
    const sleepStats = this.getSleepMetrics(1);

    // Calculate individual scores (0-100)
    let cardiacHealth = 75;
    if (hrStats) {
      if (hrStats.average < 80 && hrStats.average > 60) cardiacHealth = 95;
      else if (hrStats.average < 90 && hrStats.average > 50) cardiacHealth = 85;
      else cardiacHealth = 60;
    }

    let activityScore = (activityStats.averageSteps / 10000) * 100;
    activityScore = Math.min(100, activityScore);

    let sleepScore = (sleepStats.averageNightSleep / 480) * 100; // 8 hours = 480 min
    sleepScore = Math.min(100, sleepScore);

    // Stress level (inverse of HRV)
    let stressLevel = 50;
    if (hrStats?.hrv) {
      stressLevel = Math.max(10, Math.min(100, 100 - (hrStats.hrv * 2)));
    }

    // Overall score (weighted average)
    const overallScore = Math.round(
      (cardiacHealth * 0.35 + activityScore * 0.25 + sleepScore * 0.25 + (100 - stressLevel) * 0.15)
    );

    // Determine trend
    const trend: 'improving' | 'stable' | 'declining' = 'stable';

    const insights: string[] = [];
    if (cardiacHealth > 85) insights.push('✓ Excellent cardiac health metrics');
    if (cardiacHealth < 70) insights.push('⚠ Heart rate patterns suggest stress or fitness concerns');
    if (activityScore > 80) insights.push('✓ Great activity level! Exceeding daily step goals');
    if (activityScore < 50) insights.push('⚠ Activity levels are low. Increase daily movement.');
    if (sleepScore > 85) insights.push('✓ Excellent sleep quality and duration');
    if (sleepScore < 60) insights.push('⚠ Sleep quality needs improvement');
    if (stressLevel > 70) insights.push('⚠ Stress levels are elevated. Practice relaxation techniques.');

    const recommendations: string[] = [];
    if (overallScore < 60) recommendations.push('Schedule a health check-up with your healthcare provider');
    if (activityScore < 50) recommendations.push('Aim for 10,000 steps daily. Start with 15-minute walks.');
    if (sleepScore < 70) recommendations.push('Maintain consistent sleep schedule and reduce screen time before bed');
    if (stressLevel > 70) recommendations.push('Practice daily meditation or yoga (10-15 minutes)');

    return {
      date: targetDate,
      overallScore,
      cardiacHealth: Math.round(cardiacHealth),
      activityLevel: Math.round(activityScore),
      sleepQuality: Math.round(sleepScore),
      stressLevel: Math.round(stressLevel),
      trend,
      insights,
      recommendations
    };
  }

  /**
   * Generate wearable data report
   */
  generateWearableReport(days: number = 7): string {
    let report = '# Wearable Health Report\n\n';

    const activityMetrics = this.getActivityMetrics(days);
    const sleepMetrics = this.getSleepMetrics(days);
    const anomalies = this.getRecentAnomalies(days * 24);
    const score = this.calculateDailyHealthScore();

    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    report += '## Overall Health Score\n';
    report += `- **Daily Score**: ${score.overallScore}/100\n`;
    report += `- **Status**: ${score.overallScore > 80 ? 'Excellent' : score.overallScore > 60 ? 'Good' : 'Fair'}\n\n`;

    report += '## Activity Metrics (Last ' + days + ' days)\n';
    report += `- **Total Steps**: ${activityMetrics.totalSteps.toLocaleString()}\n`;
    report += `- **Average Daily Steps**: ${activityMetrics.averageSteps.toLocaleString()}\n`;
    report += `- **Total Distance**: ${activityMetrics.totalDistance} km\n`;
    report += `- **Active Minutes**: ${activityMetrics.averageActiveMinutes} min/day\n`;
    report += `- **Trend**: ${activityMetrics.trend.toUpperCase()}\n\n`;

    report += '## Sleep Metrics\n';
    report += `- **Average Sleep**: ${sleepMetrics.averageNightSleep} minutes (${(sleepMetrics.averageNightSleep / 60).toFixed(1)} hours)\n`;
    report += `- **Deep Sleep**: ${sleepMetrics.averageDeepSleep} minutes\n`;
    report += `- **Sleep Quality**: ${sleepMetrics.averageQuality}/100\n`;
    report += `- **Trend**: ${sleepMetrics.trend}\n\n`;

    if (anomalies.length > 0) {
      report += '## Recent Anomalies Detected\n';
      for (const a of anomalies.slice(0, 5)) {
        report += `- **${a.type}** (${a.severity}): ${a.details}\n`;
        report += `  Action: ${a.recommendedAction}\n`;
      }
    } else {
      report += '## Anomalies\n- No significant anomalies detected\n\n';
    }

    report += '## Insights & Recommendations\n';
    for (let i = 0; i < score.insights.length; i++) {
      report += `${i + 1}. ${score.insights[i]}\n`;
    }

    report += '\n## Recommended Actions\n';
    for (let i = 0; i < score.recommendations.length; i++) {
      report += `${i + 1}. ${score.recommendations[i]}\n`;
    }

    return report;
  }

  /**
   * Disconnect device
   */
  disconnectDevice(deviceId: string): boolean {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.isConnected = false;
      return true;
    }
    return false;
  }
}

export default new WearableIntegrationService();
