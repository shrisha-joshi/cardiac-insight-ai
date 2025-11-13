/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALERTS PANEL - Alert Management & History
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DataDriftReport, ModelHealthReport } from '@/services/mlPipelineMonitoring';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Bell,
  BellOff
} from 'lucide-react';
import { useState } from 'react';

interface AlertsPanelProps {
  driftReport: DataDriftReport;
  healthReport: ModelHealthReport;
}

interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'critical';
  category: 'drift' | 'health' | 'performance' | 'calibration';
  title: string;
  description: string;
  timestamp: Date;
  actionRequired: boolean;
  recommendation?: string;
}

export function AlertsPanel({ driftReport, healthReport }: AlertsPanelProps) {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Generate alerts from reports
  const generateAlerts = (): AlertItem[] => {
    const alerts: AlertItem[] = [];

    // Drift alerts
    if (driftReport.driftSeverity === 'severe') {
      alerts.push({
        id: 'drift-severe',
        type: 'critical',
        category: 'drift',
        title: 'Severe Data Drift Detected',
        description: `Overall drift score is ${(driftReport.overallDriftScore * 100).toFixed(1)}%, which is above critical threshold.`,
        timestamp: driftReport.timestamp,
        actionRequired: true,
        recommendation: 'Immediate model retraining recommended. Review data pipeline for issues.'
      });
    } else if (driftReport.driftSeverity === 'moderate') {
      alerts.push({
        id: 'drift-moderate',
        type: 'warning',
        category: 'drift',
        title: 'Moderate Data Drift Detected',
        description: `Overall drift score is ${(driftReport.overallDriftScore * 100).toFixed(1)}%. Monitor closely for further degradation.`,
        timestamp: driftReport.timestamp,
        actionRequired: false,
        recommendation: 'Schedule model retraining within 48 hours.'
      });
    }

    // Feature-level drift alerts
    driftReport.featureDrift.forEach(fd => {
      if (fd.driftScore > 0.25) {
        alerts.push({
          id: `feature-drift-${fd.featureName}`,
          type: 'warning',
          category: 'drift',
          title: `High Drift in Feature: ${fd.featureName}`,
          description: `Drift score: ${(fd.driftScore * 100).toFixed(1)}%. Distribution has changed significantly.`,
          timestamp: driftReport.timestamp,
          actionRequired: false,
          recommendation: `Investigate changes in ${fd.featureName} data collection or preprocessing.`
        });
      }
    });

    // Target drift alert
    if (driftReport.targetDrift.driftScore > 0.1) {
      alerts.push({
        id: 'target-drift',
        type: 'warning',
        category: 'drift',
        title: 'Target Distribution Drift',
        description: `Target class distribution has shifted by ${(driftReport.targetDrift.driftScore * 100).toFixed(1)}%.`,
        timestamp: driftReport.timestamp,
        actionRequired: false,
        recommendation: 'Review recent data sources and ensure class balance is maintained.'
      });
    }

    // Health alerts
    if (healthReport.overallHealth === 'critical') {
      alerts.push({
        id: 'health-critical',
        type: 'critical',
        category: 'health',
        title: 'Critical Model Health Status',
        description: `Model health score: ${healthReport.healthScore}%. Multiple issues detected.`,
        timestamp: healthReport.timestamp,
        actionRequired: true,
        recommendation: 'Immediate investigation required. Consider rolling back to previous model version.'
      });
    } else if (healthReport.overallHealth === 'degraded') {
      alerts.push({
        id: 'health-degraded',
        type: 'warning',
        category: 'health',
        title: 'Model Health Degraded',
        description: `Model health score: ${healthReport.healthScore}%. Performance below optimal levels.`,
        timestamp: healthReport.timestamp,
        actionRequired: false,
        recommendation: 'Monitor closely. Investigate potential causes of degradation.'
      });
    }

    // Accuracy drift alert
    if (Math.abs(healthReport.accuracyDrift) > 2) {
      alerts.push({
        id: 'accuracy-drift',
        type: 'warning',
        category: 'performance',
        title: 'Significant Accuracy Drift',
        description: `Accuracy has changed by ${healthReport.accuracyDrift.toFixed(2)}% from baseline.`,
        timestamp: healthReport.timestamp,
        actionRequired: false,
        recommendation: 'Review recent predictions and data quality. Consider retraining.'
      });
    }

    // Latency alert
    if (healthReport.avgPredictionLatency > 100) {
      alerts.push({
        id: 'latency-high',
        type: 'warning',
        category: 'performance',
        title: 'High Prediction Latency',
        description: `Average latency: ${healthReport.avgPredictionLatency}ms. Above target threshold of 100ms.`,
        timestamp: healthReport.timestamp,
        actionRequired: false,
        recommendation: 'Optimize model inference or increase compute resources.'
      });
    }

    // Error rate alert
    if (healthReport.errorRate > 1) {
      alerts.push({
        id: 'error-rate-high',
        type: 'critical',
        category: 'performance',
        title: 'High Error Rate',
        description: `Error rate: ${healthReport.errorRate.toFixed(2)}%. ${healthReport.failedPredictions} predictions failed.`,
        timestamp: healthReport.timestamp,
        actionRequired: true,
        recommendation: 'Investigate error logs immediately. Check input validation and model compatibility.'
      });
    }

    // Calibration alert
    if (!healthReport.isWellCalibrated) {
      alerts.push({
        id: 'calibration-poor',
        type: 'warning',
        category: 'calibration',
        title: 'Poor Model Calibration',
        description: `Calibration error: ${(healthReport.calibrationError * 100).toFixed(2)}%. Confidence scores may be unreliable.`,
        timestamp: healthReport.timestamp,
        actionRequired: false,
        recommendation: 'Apply calibration techniques (e.g., Platt scaling, isotonic regression).'
      });
    }

    // Feature importance change alert
    if (healthReport.featureImportanceChanged) {
      alerts.push({
        id: 'feature-importance-change',
        type: 'info',
        category: 'drift',
        title: 'Feature Importance Changed',
        description: 'The ranking of feature importance has changed significantly.',
        timestamp: healthReport.timestamp,
        actionRequired: false,
        recommendation: 'Review feature engineering pipeline and model interpretability.'
      });
    }

    // Warnings from health report
    healthReport.warnings.forEach((warning, index) => {
      alerts.push({
        id: `health-warning-${index}`,
        type: 'warning',
        category: 'health',
        title: 'Model Warning',
        description: warning,
        timestamp: healthReport.timestamp,
        actionRequired: false
      });
    });

    // Issues from health report
    healthReport.issues.forEach((issue, index) => {
      alerts.push({
        id: `health-issue-${index}`,
        type: 'critical',
        category: 'health',
        title: 'Model Issue',
        description: issue,
        timestamp: healthReport.timestamp,
        actionRequired: true,
        recommendation: 'Immediate action required.'
      });
    });

    // Retraining recommendation
    if (driftReport.retrainingNeeded) {
      alerts.push({
        id: 'retraining-needed',
        type: driftReport.retrainingUrgency === 'high' ? 'critical' : 'warning',
        category: 'drift',
        title: 'Model Retraining Recommended',
        description: `Retraining urgency: ${driftReport.retrainingUrgency}. ${driftReport.recommendation}`,
        timestamp: driftReport.timestamp,
        actionRequired: driftReport.retrainingUrgency === 'high',
        recommendation: 'Schedule retraining with latest data. Maintain model version control.'
      });
    }

    return alerts.sort((a, b) => {
      // Sort by type (critical > warning > info), then by timestamp (newest first)
      const typeOrder = { critical: 0, warning: 1, info: 2 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  };

  const alerts = generateAlerts();
  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === 'critical' ? 'destructive' : 'default';
  };

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const infoCount = alerts.filter(a => a.type === 'info').length;

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert Summary</CardTitle>
              <CardDescription>
                Current alerts and notifications
              </CardDescription>
            </div>
            <Button
              variant={alertsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
            >
              {alertsEnabled ? (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Alerts On
                </>
              ) : (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Alerts Off
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setFilter('critical')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Critical</span>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setFilter('warning')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Warnings</span>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-600">{warningCount}</p>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setFilter('info')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Info</span>
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{infoCount}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({alerts.length})
            </Button>
            <Button
              variant={filter === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
            >
              Critical ({criticalCount})
            </Button>
            <Button
              variant={filter === 'warning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('warning')}
            >
              Warnings ({warningCount})
            </Button>
            <Button
              variant={filter === 'info' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('info')}
            >
              Info ({infoCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} {filter !== 'all' ? `(${filter})` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    {filter === 'all' 
                      ? 'All systems operating normally' 
                      : `No ${filter} alerts at this time`}
                  </p>
                </div>
              ) : (
                filteredAlerts.map(alert => (
                  <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <AlertTitle className="flex items-center gap-2">
                            {alert.title}
                            {alert.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                          </AlertTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {alert.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <AlertDescription>{alert.description}</AlertDescription>
                        {alert.recommendation && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-xs font-medium mb-1">Recommendation:</p>
                            <p className="text-xs text-muted-foreground">{alert.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Configuration</CardTitle>
          <CardDescription>
            Thresholds and notification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Drift Thresholds</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mild:</span>
                    <span className="font-mono">0.10 - 0.15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moderate:</span>
                    <span className="font-mono">0.15 - 0.25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severe:</span>
                    <span className="font-mono">&gt; 0.25</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Performance Thresholds</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accuracy Drop:</span>
                    <span className="font-mono">&gt; 2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Error Rate:</span>
                    <span className="font-mono">&gt; 1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="font-mono">&gt; 100ms</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Notification Channels</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">In-App Notifications</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Email Alerts</span>
                  <Badge variant="secondary">Configured</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">SMS Alerts (Critical Only)</span>
                  <Badge variant="secondary">Configured</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
