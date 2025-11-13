/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DRIFT MONITOR CHART - Visualization for Data Drift Detection
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DataDriftReport } from '@/services/mlPipelineMonitoring';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface DriftMonitorChartProps {
  driftReport: DataDriftReport;
}

export function DriftMonitorChart({ driftReport }: DriftMonitorChartProps) {
  // Prepare data for feature drift chart
  const featureDriftData = driftReport.featureDrift.map(fd => ({
    name: fd.featureName,
    'Drift Score': (fd.driftScore * 100).toFixed(1),
    'PSI': fd.psiScore ? (fd.psiScore * 100).toFixed(1) : 0,
    'KS Statistic': fd.ksStatistic ? (fd.ksStatistic * 100).toFixed(1) : 0,
    severity: fd.driftScore > 0.25 ? 'high' : fd.driftScore > 0.15 ? 'medium' : 'low'
  }));

  // Historical drift data (simulated - in production, this would come from backend)
  const historicalDrift = [
    { date: 'Nov 5', drift: 0.08, threshold: 0.25 },
    { date: 'Nov 6', drift: 0.10, threshold: 0.25 },
    { date: 'Nov 7', drift: 0.09, threshold: 0.25 },
    { date: 'Nov 8', drift: 0.11, threshold: 0.25 },
    { date: 'Nov 9', drift: 0.13, threshold: 0.25 },
    { date: 'Nov 10', drift: 0.14, threshold: 0.25 },
    { date: 'Nov 11', drift: 0.15, threshold: 0.25 },
    { date: 'Nov 12', drift: driftReport.overallDriftScore, threshold: 0.25 }
  ];

  const getCellColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const getDriftSeverityBadge = (score: number) => {
    if (score > 0.25) return <Badge variant="destructive">Severe</Badge>;
    if (score > 0.15) return <Badge className="bg-orange-600">Moderate</Badge>;
    if (score > 0.10) return <Badge className="bg-yellow-600">Mild</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overall Drift Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Drift Status</CardTitle>
          <CardDescription>
            Data drift score over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Drift Score</p>
                <p className="text-3xl font-bold">
                  {(driftReport.overallDriftScore * 100).toFixed(1)}%
                </p>
              </div>
              {getDriftSeverityBadge(driftReport.overallDriftScore)}
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalDrift}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    label={{ value: 'Drift Score', angle: -90, position: 'insideLeft' }}
                    domain={[0, 0.3]}
                  />
                  <Tooltip 
                    formatter={(value: unknown) => `${((value as number) * 100).toFixed(1)}%`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="drift" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name="Drift Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="threshold" 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    name="Threshold"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Retraining Needed</p>
                <p className="text-lg font-bold">
                  {driftReport.retrainingNeeded ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Urgency</p>
                <p className="text-lg font-bold capitalize">
                  {driftReport.retrainingUrgency}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Severity</p>
                <p className="text-lg font-bold capitalize">
                  {driftReport.driftSeverity}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature-Level Drift */}
      <Card>
        <CardHeader>
          <CardTitle>Feature-Level Drift Analysis</CardTitle>
          <CardDescription>
            Individual feature drift scores (KS test & PSI)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureDriftData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 30]} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Drift Score" name="Drift Score (%)">
                  {featureDriftData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCellColor(entry.severity)} />
                  ))}
                </Bar>
                <Bar dataKey="PSI" fill="#8b5cf6" name="PSI Score (%)" />
                <Bar dataKey="KS Statistic" fill="#06b6d4" name="KS Statistic (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-3">
            {driftReport.featureDrift.map((fd, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fd.featureName}</span>
                    {fd.driftScore > 0.2 && (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">p-value:</span>
                    <span className="font-mono">{fd.pValue?.toFixed(3)}</span>
                  </div>
                </div>
                <Progress value={fd.driftScore * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    KS: {fd.ksStatistic?.toFixed(3)} | PSI: {fd.psiScore?.toFixed(3)}
                  </span>
                  <span className="capitalize">{fd.driftType}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target Distribution Drift */}
      <Card>
        <CardHeader>
          <CardTitle>Target Distribution Drift</CardTitle>
          <CardDescription>
            Changes in class distribution over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Original Distribution */}
            <div className="space-y-3">
              <h4 className="font-medium">Baseline Distribution</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Low Risk (Class 0)</span>
                    <span className="font-mono">
                      {(driftReport.targetDrift.originalDistribution.class0 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={driftReport.targetDrift.originalDistribution.class0 * 100} 
                    className="h-3"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>High Risk (Class 1)</span>
                    <span className="font-mono">
                      {(driftReport.targetDrift.originalDistribution.class1 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={driftReport.targetDrift.originalDistribution.class1 * 100} 
                    className="h-3"
                  />
                </div>
              </div>
            </div>

            {/* Current Distribution */}
            <div className="space-y-3">
              <h4 className="font-medium">Current Distribution</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Low Risk (Class 0)</span>
                    <span className="font-mono">
                      {(driftReport.targetDrift.currentDistribution.class0 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={driftReport.targetDrift.currentDistribution.class0 * 100} 
                    className="h-3"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>High Risk (Class 1)</span>
                    <span className="font-mono">
                      {(driftReport.targetDrift.currentDistribution.class1 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={driftReport.targetDrift.currentDistribution.class1 * 100} 
                    className="h-3"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Recommendation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {driftReport.recommendation}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Target Drift Score:</span>
                    <span className="ml-2 font-mono font-medium">
                      {(driftReport.targetDrift.driftScore * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retraining:</span>
                    <span className="ml-2 font-medium">
                      {driftReport.retrainingNeeded ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drift Detection Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Methods Used</CardTitle>
          <CardDescription>
            Statistical tests for drift detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Kolmogorov-Smirnov Test</h4>
              <p className="text-sm text-muted-foreground">
                Tests if two samples come from the same distribution. 
                Threshold: p-value &lt; 0.05
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Population Stability Index</h4>
              <p className="text-sm text-muted-foreground">
                Measures change in variable distribution. 
                PSI &gt; 0.25 indicates significant drift
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Distribution Comparison</h4>
              <p className="text-sm text-muted-foreground">
                Compares baseline vs current distributions using Jensen-Shannon divergence
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
