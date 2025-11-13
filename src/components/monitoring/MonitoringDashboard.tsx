/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MONITORING DASHBOARD - Week 2 Implementation
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Real-time monitoring system for:
 * - Data drift detection (KS test, PSI)
 * - Model health tracking
 * - Performance metrics
 * - Automated alerts
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { DriftMonitorChart } from './DriftMonitorChart';
import { ModelHealthWidget } from './ModelHealthWidget';
import { AlertsPanel } from './AlertsPanel';
import { MLPipelineMonitoringService } from '@/services/mlPipelineMonitoring';
import type { DataDriftReport, ModelHealthReport } from '@/services/mlPipelineMonitoring';

export function MonitoringDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [driftReport, setDriftReport] = useState<DataDriftReport | null>(null);
  const [healthReport, setHealthReport] = useState<ModelHealthReport | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  const monitoringService = new MLPipelineMonitoringService();

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      const interval = setInterval(() => {
        runMonitoring();
      }, 60000); // 60 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, isMonitoring]);

  const runMonitoring = async () => {
    setLoading(true);
    try {
      // Simulate monitoring (in production, this would fetch from backend)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock drift report
      const mockDriftReport: DataDriftReport = {
        overallDriftScore: 0.15,
        driftDetected: false,
        driftSeverity: 'mild',
        featureDrift: [
          {
            featureName: 'age',
            driftScore: 0.12,
            driftType: 'distribution',
            pValue: 0.23,
            ksStatistic: 0.08,
            psiScore: 0.05
          },
          {
            featureName: 'cholesterol',
            driftScore: 0.18,
            driftType: 'distribution',
            pValue: 0.15,
            ksStatistic: 0.12,
            psiScore: 0.09
          },
          {
            featureName: 'bloodPressure',
            driftScore: 0.22,
            driftType: 'distribution',
            pValue: 0.08,
            ksStatistic: 0.15,
            psiScore: 0.11
          }
        ],
        targetDrift: {
          originalDistribution: { class0: 0.55, class1: 0.45 },
          currentDistribution: { class0: 0.58, class1: 0.42 },
          driftScore: 0.03
        },
        retrainingNeeded: false,
        retrainingUrgency: 'low',
        recommendation: 'No immediate action required. Continue monitoring.',
        timestamp: new Date()
      };

      // Generate mock health report
      const mockHealthReport: ModelHealthReport = {
        modelName: 'Ensemble Cardiac Risk Predictor',
        modelVersion: '2.1.0',
        currentAccuracy: 0.973,
        baselineAccuracy: 0.978,
        accuracyDrift: -0.5,
        currentPrecision: 0.965,
        currentRecall: 0.981,
        currentF1Score: 0.973,
        currentAUCROC: 0.989,
        avgPredictionLatency: 87,
        maxPredictionLatency: 245,
        p95Latency: 156,
        p99Latency: 203,
        errorRate: 0.2,
        totalPredictions: 15847,
        predictionsSinceRetrain: 8420,
        successfulPredictions: 15815,
        failedPredictions: 32,
        calibrationError: 0.023,
        isWellCalibrated: true,
        overallHealth: 'healthy',
        healthScore: 96,
        issues: [],
        warnings: ['Slight accuracy drift detected (-0.5%). Monitor closely.'],
        featureImportanceChanged: false,
        topFeaturesChanged: false,
        timestamp: new Date()
      };

      setDriftReport(mockDriftReport);
      setHealthReport(mockHealthReport);
      setLastUpdate(new Date());
      setIsMonitoring(true);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Monitoring error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'none': return 'text-green-600';
      case 'mild': return 'text-yellow-600';
      case 'moderate': return 'text-orange-600';
      case 'severe': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">ML Pipeline Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Real-time drift detection, model health tracking, and automated alerts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Last Updated</p>
            <p className="font-medium">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <Button
            onClick={runMonitoring}
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Run Monitoring
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {isMonitoring && driftReport && healthReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${getHealthColor(healthReport.overallHealth)}`}>
                      {healthReport.healthScore}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {healthReport.overallHealth}
                    </p>
                  </div>
                  {healthReport.overallHealth === 'healthy' ? (
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  ) : healthReport.overallHealth === 'degraded' ? (
                    <AlertTriangle className="h-12 w-12 text-orange-600" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600" />
                  )}
                </div>
                <Progress value={healthReport.healthScore} className="mt-4" />
              </CardContent>
            </Card>

            {/* Drift Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Drift Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${getSeverityColor(driftReport.driftSeverity)}`}>
                      {(driftReport.overallDriftScore * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {driftReport.driftSeverity} drift
                    </p>
                  </div>
                  <TrendingUp className={`h-12 w-12 ${getSeverityColor(driftReport.driftSeverity)}`} />
                </div>
                <Badge 
                  variant={driftReport.driftDetected ? "destructive" : "secondary"}
                  className="mt-4"
                >
                  {driftReport.driftDetected ? 'Action Required' : 'Normal'}
                </Badge>
              </CardContent>
            </Card>

            {/* Prediction Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">
                      {(healthReport.currentAccuracy * 100).toFixed(1)}%
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {healthReport.accuracyDrift < 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      )}
                      <p className={`text-xs ${healthReport.accuracyDrift < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.abs(healthReport.accuracyDrift).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <Target className="h-12 w-12 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Baseline: {(healthReport.baselineAccuracy * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            {/* Latency */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-600">
                      {healthReport.avgPredictionLatency}ms
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      P95: {healthReport.p95Latency}ms
                    </p>
                  </div>
                  <Zap className="h-12 w-12 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {healthReport.totalPredictions.toLocaleString()} predictions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(healthReport.warnings.length > 0 || healthReport.issues.length > 0) && (
            <div className="space-y-2">
              {healthReport.issues.map((issue, index) => (
                <Alert key={`issue-${index}`} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Critical Issue</AlertTitle>
                  <AlertDescription>{issue}</AlertDescription>
                </Alert>
              ))}
              {healthReport.warnings.map((warning, index) => (
                <Alert key={`warning-${index}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Detailed Monitoring Tabs */}
          <Tabs defaultValue="drift" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="drift">Drift Detection</TabsTrigger>
              <TabsTrigger value="health">Model Health</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & History</TabsTrigger>
            </TabsList>

            <TabsContent value="drift" className="space-y-4">
              <DriftMonitorChart driftReport={driftReport} />
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <ModelHealthWidget healthReport={healthReport} />
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <AlertsPanel 
                driftReport={driftReport} 
                healthReport={healthReport}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Initial State */}
      {!isMonitoring && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Start Monitoring</CardTitle>
            <CardDescription>
              Click the "Run Monitoring" button to analyze data drift and model health
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Activity className="h-16 w-16 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Monitoring will check for:
              </p>
              <ul className="text-sm text-left space-y-2 inline-block">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Data drift (KS test, PSI)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Model accuracy trends
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Prediction latency
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Calibration errors
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-refresh Toggle */}
      {isMonitoring && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Auto-refresh every 60 seconds</span>
              </div>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
