/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MODEL HEALTH WIDGET - Performance Tracking & Monitoring
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ModelHealthReport } from '@/services/mlPipelineMonitoring';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Target, 
  Clock, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ModelHealthWidgetProps {
  healthReport: ModelHealthReport;
}

export function ModelHealthWidget({ healthReport }: ModelHealthWidgetProps) {
  // Historical accuracy data (simulated - in production, from backend)
  const accuracyHistory = [
    { date: 'Nov 5', accuracy: 0.978, precision: 0.975, recall: 0.982 },
    { date: 'Nov 6', accuracy: 0.979, precision: 0.976, recall: 0.983 },
    { date: 'Nov 7', accuracy: 0.977, precision: 0.974, recall: 0.981 },
    { date: 'Nov 8', accuracy: 0.976, precision: 0.973, recall: 0.980 },
    { date: 'Nov 9', accuracy: 0.975, precision: 0.972, recall: 0.979 },
    { date: 'Nov 10', accuracy: 0.974, precision: 0.970, recall: 0.978 },
    { date: 'Nov 11', accuracy: 0.973, precision: 0.968, recall: 0.981 },
    { date: 'Nov 12', accuracy: healthReport.currentAccuracy, precision: healthReport.currentPrecision, recall: healthReport.currentRecall }
  ];

  // Latency history (simulated)
  const latencyHistory = [
    { date: 'Nov 5', avg: 82, p95: 145, p99: 198 },
    { date: 'Nov 6', avg: 84, p95: 148, p99: 201 },
    { date: 'Nov 7', avg: 83, p95: 147, p99: 199 },
    { date: 'Nov 8', avg: 85, p95: 150, p99: 203 },
    { date: 'Nov 9', avg: 86, p95: 152, p99: 205 },
    { date: 'Nov 10', avg: 85, p95: 151, p99: 204 },
    { date: 'Nov 11', avg: 87, p95: 154, p99: 207 },
    { date: 'Nov 12', avg: healthReport.avgPredictionLatency, p95: healthReport.p95Latency, p99: healthReport.p99Latency }
  ];

  // Performance radar chart data
  const performanceMetrics = [
    { metric: 'Accuracy', value: healthReport.currentAccuracy * 100 },
    { metric: 'Precision', value: healthReport.currentPrecision * 100 },
    { metric: 'Recall', value: healthReport.currentRecall * 100 },
    { metric: 'F1-Score', value: healthReport.currentF1Score * 100 },
    { metric: 'AUC-ROC', value: healthReport.currentAUCROC * 100 },
    { metric: 'Calibration', value: (1 - healthReport.calibrationError) * 100 }
  ];

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-600">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-orange-600">Degraded</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{healthReport.modelName}</CardTitle>
              <CardDescription>Version {healthReport.modelVersion}</CardDescription>
            </div>
            {getHealthBadge(healthReport.overallHealth)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Health Score</span>
              </div>
              <p className="text-2xl font-bold">{healthReport.healthScore}%</p>
              <Progress value={healthReport.healthScore} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Current Accuracy</span>
              </div>
              <p className="text-2xl font-bold">{(healthReport.currentAccuracy * 100).toFixed(2)}%</p>
              <div className="flex items-center gap-1 text-xs">
                {healthReport.accuracyDrift < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                )}
                <span className={healthReport.accuracyDrift < 0 ? 'text-red-600' : 'text-green-600'}>
                  {Math.abs(healthReport.accuracyDrift).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Avg Latency</span>
              </div>
              <p className="text-2xl font-bold">{healthReport.avgPredictionLatency}ms</p>
              <p className="text-xs text-muted-foreground">P95: {healthReport.p95Latency}ms</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Success Rate</span>
              </div>
              <p className="text-2xl font-bold">
                {((healthReport.successfulPredictions / healthReport.totalPredictions) * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {healthReport.successfulPredictions.toLocaleString()} / {healthReport.totalPredictions.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Trends (7 Days)</CardTitle>
            <CardDescription>
              Model performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={[0.96, 0.98]} 
                    tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                  />
                  <Tooltip 
                    formatter={(value: unknown) => `${((value as number) * 100).toFixed(2)}%`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Accuracy"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="precision" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Precision"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="recall" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Recall"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">F1-Score</p>
                <p className="text-lg font-bold">{((healthReport.currentF1Score as number) * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AUC-ROC</p>
                <p className="text-lg font-bold">{(healthReport.currentAUCROC * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Baseline</p>
                <p className="text-lg font-bold">{(healthReport.baselineAccuracy * 100).toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Multi-dimensional performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={performanceMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[90, 100]} />
                  <Radar 
                    name="Performance" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip formatter={(value: unknown) => `${(value as number).toFixed(2)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${healthReport.isWellCalibrated ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-sm font-medium">Model Calibration</span>
                </div>
                <Badge variant={healthReport.isWellCalibrated ? "secondary" : "destructive"}>
                  {healthReport.isWellCalibrated ? 'Well Calibrated' : 'Needs Calibration'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Calibration Error: {(healthReport.calibrationError * 100).toFixed(2)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latency Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Latency (7 Days)</CardTitle>
          <CardDescription>
            Response time tracking and percentiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="avg" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  name="Average"
                />
                <Area 
                  type="monotone" 
                  dataKey="p95" 
                  stackId="2"
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  name="P95"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="p99" 
                  stackId="3"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  name="P99"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-lg font-bold">{healthReport.avgPredictionLatency}ms</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">P95</p>
              <p className="text-lg font-bold">{healthReport.p95Latency}ms</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">P99</p>
              <p className="text-lg font-bold">{healthReport.p99Latency}ms</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max</p>
              <p className="text-lg font-bold">{healthReport.maxPredictionLatency}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Error Monitoring</CardTitle>
          <CardDescription>
            Prediction failures and error rate tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {healthReport.errorRate < 1 ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="text-sm font-medium">Error Rate</p>
                  <p className="text-2xl font-bold">{healthReport.errorRate.toFixed(2)}%</p>
                </div>
              </div>
              <Badge variant={healthReport.errorRate < 1 ? "secondary" : "destructive"}>
                {healthReport.errorRate < 1 ? 'Within Threshold' : 'Exceeds Threshold'}
              </Badge>
            </div>

            <Progress value={100 - healthReport.errorRate} className="h-3" />

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Total Predictions</p>
                <p className="text-lg font-bold">{healthReport.totalPredictions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Successful</p>
                <p className="text-lg font-bold text-green-600">
                  {healthReport.successfulPredictions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-lg font-bold text-red-600">
                  {healthReport.failedPredictions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Importance */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Importance Status</CardTitle>
          <CardDescription>
            Changes in feature importance rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Feature Importance Changed</span>
              <Badge variant={healthReport.featureImportanceChanged ? "destructive" : "secondary"}>
                {healthReport.featureImportanceChanged ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Top Features Changed</span>
              <Badge variant={healthReport.topFeaturesChanged ? "destructive" : "secondary"}>
                {healthReport.topFeaturesChanged ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
