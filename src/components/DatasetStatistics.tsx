/**
 * 📊 Dataset Statistics Dashboard
 * 
 * Shows information about loaded Indian cardiac patient datasets,
 * model performance, and continuous learning progress.
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { indianDatasetLoader, IndianPatientRecord } from '@/services/indianDatasetLoader';
import { continuousLearning } from '@/services/continuousLearning';
import { Database, TrendingUp, Users, BarChart3, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DatasetStatistics() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<unknown>(null);
  const [modelPerformance, setModelPerformance] = useState<unknown>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const { toast } = useToast();

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load datasets
      await indianDatasetLoader.loadAllDatasets();
      const datasetStats = indianDatasetLoader.getStatistics();
      setStats(datasetStats);

      // Get model performance
      const performance = await continuousLearning.getModelPerformance();
      setModelPerformance(performance);

    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading statistics:', error);
      toast({
        title: 'Error Loading Statistics',
        description: 'Failed to load dataset statistics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleExportDataset = () => {
    try {
      const csv = indianDatasetLoader.exportAsCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `indian-cardiac-dataset-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Dataset Exported',
        description: 'Indian cardiac patient dataset exported successfully',
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error exporting dataset:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export dataset',
        variant: 'destructive'
      });
    }
  };

  const handleExportFeedback = async () => {
    try {
      const csv = await continuousLearning.exportFeedbackAsCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-feedback-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Feedback Exported',
        description: 'User feedback data exported successfully',
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error exporting feedback:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export feedback',
        variant: 'destructive'
      });
    }
  };

  const handleForceRetrain = async () => {
    setIsRetraining(true);
    toast({
      title: 'Retraining Started',
      description: 'Model retraining in progress...',
    });

    try {
      await continuousLearning.forceRetraining();
      
      // Reload statistics
      await loadStatistics();

      toast({
        title: 'Retraining Complete',
        description: 'Models have been retrained with latest data',
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error retraining:', error);
      toast({
        title: 'Retraining Failed',
        description: 'Failed to retrain models',
        variant: 'destructive'
      });
    } finally {
      setIsRetraining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-medical-primary" />
          <p className="text-lg text-muted-foreground">Loading dataset statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-medical-primary flex items-center gap-2">
            <Database className="h-8 w-8" />
            Dataset Statistics
          </h1>
          <p className="text-muted-foreground mt-2">
            Indian cardiac patient datasets and model performance
          </p>
        </div>
        <Button onClick={loadStatistics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold text-blue-600">{(stats as { totalRecords?: number })?.totalRecords || 0}</div>
              <p className="text-sm text-muted-foreground">Total Patient Records</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold text-green-600">{(stats as { indianSpecific?: number })?.indianSpecific || 0}</div>
              <p className="text-sm text-muted-foreground">Indian-Specific Records</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-3xl font-bold text-orange-600">
                {modelPerformance ? Math.round((modelPerformance as { accuracy: number }).accuracy) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Model Accuracy</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold text-purple-600">
                {(modelPerformance as { totalPredictions?: number })?.totalPredictions || 0}
              </div>
              <p className="text-sm text-muted-foreground">User Feedback Records</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dataset Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dataset Sources
          </CardTitle>
          <CardDescription>
            Breakdown of patient records by source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(stats as { sources?: unknown[] })?.sources?.map((source: unknown) => {
              const src = source as { source: string; count: number; ageRange: { min: number; max: number; avg: number }; positiveClass: number; negativeClass: number };
              return (
              <div key={src.source} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{src.source}</h3>
                    <p className="text-sm text-muted-foreground">
                      {src.count} patients • Age: {src.ageRange.min}-{src.ageRange.max} (avg: {src.ageRange.avg})
                    </p>
                  </div>
                  <Badge variant="outline">
                    {src.count} records
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">With Heart Disease: </span>
                    <span className="font-semibold text-red-600">{src.positiveClass}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Without Heart Disease: </span>
                    <span className="font-semibold text-green-600">{src.negativeClass}</span>
                  </div>
                </div>
              </div>
            );})}
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Age:</span>
                <span className="font-semibold">{(stats as { ageDistribution?: { min: number } })?.ageDistribution?.min || 0} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum Age:</span>
                <span className="font-semibold">{(stats as { ageDistribution?: { max: number } })?.ageDistribution?.max || 0} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Age:</span>
                <span className="font-semibold">{(stats as { ageDistribution?: { avg: number } })?.ageDistribution?.avg || 0} years</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Male Patients:</span>
                <span className="font-semibold text-blue-600">{(stats as { genderDistribution?: { male: number } })?.genderDistribution?.male || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Female Patients:</span>
                <span className="font-semibold text-pink-600">{(stats as { genderDistribution?: { female: number } })?.genderDistribution?.female || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Male %:</span>
                <span className="font-semibold">
                  {Math.round(((stats as { genderDistribution?: { male: number }; totalRecords: number })?.genderDistribution?.male || 0) / ((stats as { totalRecords: number })?.totalRecords || 1) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance */}
      {modelPerformance && (modelPerformance as { totalPredictions: number }).totalPredictions >= 10 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Model Performance (Based on User Feedback)
            </CardTitle>
            <CardDescription>
              Real-world performance metrics from {(modelPerformance as { totalPredictions: number }).totalPredictions} user feedback records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((modelPerformance as { accuracy: number }).accuracy)}%
                </div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((modelPerformance as { precision: number }).precision)}%
                </div>
                <p className="text-sm text-muted-foreground">Precision</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((modelPerformance as { recall: number }).recall)}%
                </div>
                <p className="text-sm text-muted-foreground">Recall</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((modelPerformance as { f1Score: number }).f1Score)}%
                </div>
                <p className="text-sm text-muted-foreground">F1 Score</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold">{(modelPerformance as { correctPredictions: number }).correctPredictions}</p>
                  <p className="text-sm text-muted-foreground">Correct Predictions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold">{(modelPerformance as { incorrectPredictions: number }).incorrectPredictions}</p>
                  <p className="text-sm text-muted-foreground">Incorrect Predictions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Target Distribution</CardTitle>
          <CardDescription>Classification balance in dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">
                {(stats as { targetDistribution?: { positive: number } })?.targetDistribution?.positive || 0}
              </div>
              <p className="text-sm text-muted-foreground">With Heart Disease</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(((stats as { targetDistribution?: { positive: number }; totalRecords: number })?.targetDistribution?.positive || 0) / ((stats as { totalRecords: number })?.totalRecords || 1) * 100)}%
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {(stats as { targetDistribution?: { negative: number } })?.targetDistribution?.negative || 0}
              </div>
              <p className="text-sm text-muted-foreground">Without Heart Disease</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(((stats as { targetDistribution?: { negative: number }; totalRecords: number })?.targetDistribution?.negative || 0) / ((stats as { totalRecords: number })?.totalRecords || 1) * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Actions</CardTitle>
          <CardDescription>
            Export datasets or retrain models with latest data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleExportDataset} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Dataset (CSV)
            </Button>
            <Button onClick={handleExportFeedback} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Feedback (CSV)
            </Button>
            <Button 
              onClick={handleForceRetrain} 
              disabled={isRetraining}
              className="w-full"
            >
              {isRetraining ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retraining...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retrain Models
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Version Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-900 font-semibold">Current Model Version</p>
              <p className="text-2xl font-bold text-blue-700">
                v{continuousLearning.getCurrentModelVersion()}
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
