/**
 * 📊 Data Loading Dashboard - Week 1 UI Component
 * 
 * Shows real-time progress of loading 80,000+ records
 * Displays quality metrics and dataset statistics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Database, 
  TrendingUp,
  Activity,
  BarChart3,
  FileCheck
} from 'lucide-react';
import { enhancedDatasetLoader } from '@/services/enhancedDatasetLoader';

interface LoadingProgress {
  total: number;
  loaded: number;
  currentSource: string;
  percentage: number;
  status: 'loading' | 'processing' | 'completed' | 'error';
  message: string;
}

export const DataLoadingDashboard: React.FC = () => {
  const [progress, setProgress] = useState<LoadingProgress>({
    total: 80000,
    loaded: 0,
    currentSource: '',
    percentage: 0,
    status: 'loading',
    message: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState<unknown>(null);
  const [summaryReport, setSummaryReport] = useState('');

  /**
   * Start loading datasets
   */
  const startLoading = async () => {
    setIsLoading(true);
    setProgress({
      total: 80000,
      loaded: 0,
      currentSource: 'Initializing',
      percentage: 0,
      status: 'loading',
      message: 'Starting enhanced dataset loading...'
    });

    // Set progress callback
    enhancedDatasetLoader.setProgressCallback((progressData) => {
      setProgress(progressData);
    });

    try {
      // Load all datasets
      const records = await enhancedDatasetLoader.loadAllDatasets();
      
      // Get statistics
      const stats = enhancedDatasetLoader.getStatistics();
      setStatistics(stats);
      
      // Generate summary report
      const report = enhancedDatasetLoader.generateSummaryReport();
      setSummaryReport(report);
      
      setProgress({
        total: stats.totalRecords,
        loaded: stats.totalRecords,
        currentSource: 'Complete',
        percentage: 100,
        status: 'completed',
        message: `Successfully loaded ${stats.totalRecords.toLocaleString()} records at ${stats.qualityScore.toFixed(1)}% quality!`
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading datasets:', error);
      setProgress({
        ...progress,
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
      case 'processing':
        return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'loading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  /**
   * Get quality badge color
   */
  const getQualityColor = (quality: number) => {
    if (quality >= 95) return 'bg-green-500';
    if (quality >= 85) return 'bg-blue-500';
    if (quality >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Enhanced Dataset Loader</h1>
          <p className="text-muted-foreground mt-2">
            Week 1: Load 80,000+ high-quality cardiac patient records
          </p>
        </div>
        {!isLoading && progress.status !== 'completed' && (
          <Button 
            size="lg" 
            onClick={startLoading}
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            Start Loading
          </Button>
        )}
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Loading Progress
          </CardTitle>
          <CardDescription>
            {progress.currentSource && `Current: ${progress.currentSource}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {progress.loaded.toLocaleString()} / {progress.total.toLocaleString()} records
              </span>
              <span className="text-muted-foreground">
                {progress.percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
          </div>

          {/* Status Message */}
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${getStatusColor()} ${
                  progress.status === 'loading' || progress.status === 'processing' 
                    ? 'animate-pulse' 
                    : ''
                }`}
              />
              {progress.message}
            </AlertDescription>
          </Alert>

          {/* Loading States */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage > 1 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                UCI Full (920)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage > 10 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Kaggle (70,000)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage > 90 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Heart Failure (299)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage > 91 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Indian (500)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage > 92 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                SMOTE Synthetic
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage > 97 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Quality Enhancement
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage === 100 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Validation
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  progress.percentage === 100 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Complete
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards - Show after completion */}
      {statistics && progress.status === 'completed' && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {(statistics as { totalRecords: number }).totalRecords.toLocaleString()}
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Target: 80,000+ ✅
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {(statistics as { qualityScore: number }).qualityScore.toFixed(1)}%
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <Badge className={`mt-2 ${getQualityColor((statistics as { qualityScore: number }).qualityScore)}`}>
                  {(statistics as { qualityScore: number }).qualityScore >= 95 ? 'Excellent' : 
                   (statistics as { qualityScore: number }).qualityScore >= 85 ? 'Good' : 
                   (statistics as { qualityScore: number }).qualityScore >= 70 ? 'Fair' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {(statistics as { features: number }).features}
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Enhanced with engineering
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Validation Passed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {(((statistics as { validationPassed: number; totalRecords: number }).validationPassed / (statistics as { validationPassed: number; totalRecords: number }).totalRecords) * 100).toFixed(1)}%
                  </div>
                  <FileCheck className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {(statistics as { validationPassed: number }).validationPassed.toLocaleString()} records
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dataset Sources Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dataset Sources</CardTitle>
              <CardDescription>
                Breakdown by source with quality metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Source</th>
                      <th className="text-right py-3 px-4">Records</th>
                      <th className="text-right py-3 px-4">Percentage</th>
                      <th className="text-right py-3 px-4">Quality</th>
                      <th className="text-right py-3 px-4">Positive Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(statistics as { sources: unknown[]; totalRecords: number }).sources.map((source: unknown, index: number) => {
                      const s = source as { name: string; records: number; quality: number; positiveRate: number };
                      return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{s.name}</td>
                        <td className="text-right py-3 px-4">
                          {s.records.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          {((s.records / (statistics as { totalRecords: number }).totalRecords) * 100).toFixed(1)}%
                        </td>
                        <td className="text-right py-3 px-4">
                          <Badge className={getQualityColor(s.quality)}>
                            {s.quality.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          {s.positiveRate.toFixed(1)}%
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Report */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Report</CardTitle>
              <CardDescription>
                Complete dataset loading report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                {summaryReport}
              </pre>
            </CardContent>
          </Card>

          {/* Success Alert */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900">Week 1 Complete! ✅</AlertTitle>
            <AlertDescription className="text-green-800">
              Successfully loaded {(statistics as { totalRecords: number }).totalRecords.toLocaleString()} records at {(statistics as { qualityScore: number }).qualityScore.toFixed(1)}% quality.
              Ready for Week 2: Pipeline Monitoring & Dashboard UI.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
};
