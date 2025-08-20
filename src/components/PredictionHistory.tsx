import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PredictionResult } from '@/lib/mockData';
import { History, Calendar, TrendingUp, Eye, Heart, BarChart3 } from 'lucide-react';

interface PredictionHistoryProps {
  predictions: PredictionResult[];
}

export default function PredictionHistory({ predictions }: PredictionHistoryProps) {
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

  // Calculate statistics
  const stats = {
    total: predictions.length,
    lowRisk: predictions.filter(p => p.riskLevel === 'low').length,
    mediumRisk: predictions.filter(p => p.riskLevel === 'medium').length,
    highRisk: predictions.filter(p => p.riskLevel === 'high').length,
    averageRisk: Math.round(predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length || 0)
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
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Assessment History
          </CardTitle>
          <CardDescription>
            Your previous heart attack risk assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Heart className={`h-8 w-8 ${getRiskColor(prediction.riskLevel)}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getRiskBadgeVariant(prediction.riskLevel)}>
                        {prediction.riskLevel.toUpperCase()}
                      </Badge>
                      <span className={`text-lg font-bold ${getRiskColor(prediction.riskLevel)}`}>
                        {prediction.riskScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {prediction.timestamp.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {prediction.confidence}% confidence
                      </div>
                    </div>
                    <div className="text-sm mt-1">
                      Age {prediction.patientData.age}, {prediction.patientData.gender}, 
                      BP: {prediction.patientData.restingBP}, Chol: {prediction.patientData.cholesterol}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}