import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PredictionResult } from '@/lib/mockData';
import { Heart, AlertTriangle, CheckCircle, Activity, Calendar, TrendingUp } from 'lucide-react';

interface RiskDisplayProps {
  prediction: PredictionResult;
}

export default function RiskDisplay({ prediction }: RiskDisplayProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'high': return <Heart className="h-5 w-5 text-destructive" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Risk Score Card */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {getRiskIcon(prediction.riskLevel)}
            Risk Assessment Results
          </CardTitle>
          <CardDescription>
            Analysis completed on {prediction.timestamp.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Risk Score Visualization */}
          <div className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getRiskColor(prediction.riskLevel)}`}>
              {prediction.riskScore}%
            </div>
            <Badge variant={getRiskBadgeVariant(prediction.riskLevel)} className="text-lg px-4 py-2">
              {prediction.riskLevel.toUpperCase()} RISK
            </Badge>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Risk Level</span>
                <span>{prediction.confidence}% Confidence</span>
              </div>
              <Progress 
                value={prediction.riskScore} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low Risk</span>
                <span>Medium Risk</span>
                <span>High Risk</span>
              </div>
            </div>
          </div>

          {/* Prediction */}
          <Alert className={prediction.prediction === 'Risk' ? 'border-destructive' : 'border-success'}>
            <div className={prediction.prediction === 'Risk' ? 'text-destructive' : 'text-success'}>
              {prediction.prediction === 'Risk' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </div>
            <AlertDescription className="font-medium">
              <strong>Prediction:</strong> {prediction.prediction} of Heart Attack
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Explanation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analysis Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {prediction.explanation}
          </p>
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-medical-primary" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Follow these guidelines to improve your cardiovascular health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {prediction.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-medical-primary mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Patient Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Patient Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Age:</span>
              <div className="font-medium">{prediction.patientData.age} years</div>
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span>
              <div className="font-medium capitalize">{prediction.patientData.gender}</div>
            </div>
            <div>
              <span className="text-muted-foreground">BP:</span>
              <div className="font-medium">{prediction.patientData.restingBP} mmHg</div>
            </div>
            <div>
              <span className="text-muted-foreground">Cholesterol:</span>
              <div className="font-medium">{prediction.patientData.cholesterol} mg/dl</div>
            </div>
            <div>
              <span className="text-muted-foreground">Max HR:</span>
              <div className="font-medium">{prediction.patientData.maxHR} bpm</div>
            </div>
            <div>
              <span className="text-muted-foreground">Chest Pain:</span>
              <div className="font-medium capitalize">{prediction.patientData.chestPainType.replace('-', ' ')}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Smoking:</span>
              <div className="font-medium">{prediction.patientData.smoking ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Diabetes:</span>
              <div className="font-medium">{prediction.patientData.diabetes ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Medical Disclaimer:</strong> This prediction tool is for educational purposes only and should not replace professional medical advice. 
          Always consult with a qualified healthcare provider for medical diagnosis and treatment decisions.
        </AlertDescription>
      </Alert>
    </div>
  );
}