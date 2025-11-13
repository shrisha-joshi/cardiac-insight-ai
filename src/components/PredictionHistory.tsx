import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PredictionWithFeedback } from '@/hooks/use-prediction-history';
import { History, Calendar, TrendingUp, Eye, Heart, BarChart3, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { continuousLearning } from '@/services/continuousLearning';

interface PredictionHistoryProps {
  predictions: PredictionWithFeedback[];
  userId?: string;
  onAddFeedback?: (predictionId: string, feedback: 'correct' | 'incorrect') => void;
  feedbackStats?: { correct: number; incorrect: number; total: number };
}

export default function PredictionHistory({ predictions, userId, onAddFeedback, feedbackStats }: PredictionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null);

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate statistics
  const stats = {
    total: predictions.length,
    lowRisk: predictions.filter(p => p.riskLevel === 'low').length,
    mediumRisk: predictions.filter(p => p.riskLevel === 'medium').length,
    highRisk: predictions.filter(p => p.riskLevel === 'high').length,
    averageRisk: Math.round(predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length || 0),
    withFeedback: predictions.filter(p => p.feedback).length
  };

  const handleFeedback = async (predictionId: string, feedback: 'correct' | 'incorrect') => {
    if (!onAddFeedback) return;
    
    setFeedbackSubmitting(predictionId);
    try {
      // Update local state
      onAddFeedback(predictionId, feedback);
      
      // Find the prediction
      const prediction = predictions.find(p => p.id === predictionId);
      if (prediction) {
        // Send feedback to continuous learning system
        await continuousLearning.addPredictionFeedback(
          predictionId,
          prediction.patientData,
          prediction.riskScore,
          feedback
        );
        if (import.meta.env.DEV) console.log(`✅ Feedback sent to continuous learning system`);
      }
      
      // Simulate API call delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error submitting feedback:', error);
    } finally {
      setFeedbackSubmitting(null);
    }
  };

  if (predictions.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <History className="h-6 w-6" />
            No History Available
          </CardTitle>
          <CardDescription>
            Your prediction history will appear here after you complete assessments
          </CardDescription>
          {userId && (
            <div className="mt-2 text-xs text-muted-foreground">
              User ID: {userId.substring(0, 15)}...
            </div>
          )}
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      {userId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Your Personal History</strong> • User: {userId.substring(0, 20)}...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-medical-primary">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Assessments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.lowRisk}</div>
              <p className="text-xs text-muted-foreground">Low Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{stats.mediumRisk}</div>
              <p className="text-xs text-muted-foreground">Medium Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
              <p className="text-xs text-muted-foreground">High Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageRisk}%</div>
              <p className="text-xs text-muted-foreground">Average Risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Stats */}
      {feedbackStats && feedbackStats.total > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-700">{feedbackStats.correct}</div>
                <p className="text-xs text-green-600">Correct Predictions</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-700">{feedbackStats.incorrect}</div>
                <p className="text-xs text-red-600">Needs Refinement</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-700">
                  {feedbackStats.total > 0 ? Math.round((feedbackStats.correct / feedbackStats.total) * 100) : 0}%
                </div>
                <p className="text-xs text-blue-600">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Assessment History
          </CardTitle>
          <CardDescription>
            Your previous heart attack risk assessments • Most recent first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className="border rounded-lg hover:bg-accent/50 transition-colors overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 pt-1">
                        <Heart className={`h-8 w-8 ${getRiskColor(prediction.riskLevel)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={getRiskBadgeVariant(prediction.riskLevel)}>
                            {prediction.riskLevel.toUpperCase()}
                          </Badge>
                          <span className={`text-lg font-bold ${getRiskColor(prediction.riskLevel)}`}>
                            {prediction.riskScore}%
                          </span>
                          {prediction.feedback && (
                            <Badge variant={prediction.feedback === 'correct' ? 'default' : 'secondary'}>
                              {prediction.feedback === 'correct' ? '✓ Verified' : '⚠ Feedback Given'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(prediction.timestamp)}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {prediction.confidence}% confidence
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Age {prediction.patientData.age}, {prediction.patientData.gender}, 
                          BP: {prediction.patientData.restingBP}, Chol: {prediction.patientData.cholesterol}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setExpandedId(expandedId === prediction.id ? null : prediction.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === prediction.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm font-semibold mb-1">Assessment Result:</p>
                        <p className="text-sm text-muted-foreground">{prediction.prediction}</p>
                      </div>
                      
                      {prediction.explanation && (
                        <div className="bg-muted p-3 rounded">
                          <p className="text-sm font-semibold mb-1">Explanation:</p>
                          <p className="text-sm text-muted-foreground line-clamp-3">{prediction.explanation}</p>
                        </div>
                      )}

                      {/* Feedback Section */}
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm font-semibold mb-2 text-blue-900">
                          Was this assessment accurate?
                        </p>
                        <p className="text-xs text-blue-800 mb-3">
                          Your feedback helps improve predictions for everyone
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant={prediction.feedback === 'correct' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFeedback(prediction.id, 'correct')}
                            disabled={feedbackSubmitting === prediction.id}
                            className="flex-1"
                          >
                            {feedbackSubmitting === prediction.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <ThumbsUp className="h-4 w-4 mr-1" />
                            )}
                            Correct
                          </Button>
                          <Button
                            variant={prediction.feedback === 'incorrect' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleFeedback(prediction.id, 'incorrect')}
                            disabled={feedbackSubmitting === prediction.id}
                            className="flex-1"
                          >
                            {feedbackSubmitting === prediction.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 mr-1" />
                            )}
                            Incorrect
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}