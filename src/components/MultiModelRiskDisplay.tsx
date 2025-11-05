import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, AlertTriangle, CheckCircle, Activity, TrendingUp, BarChart3, Globe, Info } from 'lucide-react';

interface MultiModelResult {
  framinghamRisk: number;
  framinghamCategory: string;
  ascvdRisk: number;
  ascvdCategory: string;
  interheart: {
    percentage: number;
    category: string;
    score: number;
  };
  indianAdjustedRisk: number;
  indianCategory: string;
  combinedRisk: number;
  finalRiskCategory: string;
  topRiskFactors: Array<{
    factor: string;
    percentage: number;
    severity: 'High' | 'Moderate' | 'Low';
  }>;
  indianSpecificRecommendations: string[];
  indianPopulationInsights?: {
    ageEquivalent: number;
    triglycerideConcern: boolean;
    centralObesityConcern: boolean;
    metabolicSyndromeLikelihood?: string;
    betelQuidRisk?: boolean;
  };
  confidence: number;
  modelVersions: string[];
}

interface MultiModelRiskDisplayProps {
  result: MultiModelResult;
  patientAge?: number;
  patientSex?: string;
}

export const MultiModelRiskDisplay: React.FC<MultiModelRiskDisplayProps> = ({ 
  result, 
  patientAge = 0,
  patientSex = 'Unknown'
}) => {
  const getRiskColor = (risk: number, category: string): string => {
    if (category === 'Very High' || category === 'High' || risk >= 20) {
      return 'text-red-600';
    } else if (category === 'Moderate' || (risk >= 10 && risk < 20)) {
      return 'text-orange-600';
    } else if (category === 'Low' || category === 'Very Low' || risk < 10) {
      return 'text-green-600';
    }
    return 'text-gray-600';
  };

  const getBgColor = (risk: number, category: string): string => {
    if (category === 'Very High' || category === 'High' || risk >= 20) {
      return 'bg-red-50 border-red-200';
    } else if (category === 'Moderate' || (risk >= 10 && risk < 20)) {
      return 'bg-orange-50 border-orange-200';
    } else if (category === 'Low' || category === 'Very Low' || risk < 10) {
      return 'bg-green-50 border-green-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  const getRiskIcon = (category: string) => {
    if (category === 'Very High' || category === 'High') {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else if (category === 'Moderate') {
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    } else if (category === 'Low' || category === 'Very Low') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Activity className="h-5 w-5" />;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-red-600" />
            Multi-Model CVD Risk Assessment
          </CardTitle>
          <CardDescription>
            Combined Analysis: Framingham | ASCVD | INTERHEART | Indian-Adjusted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Patient: {patientAge}y {patientSex}</p>
            <div className={`text-5xl font-bold mt-3 ${getRiskColor(result.combinedRisk, result.finalRiskCategory)}`}>
              {result.combinedRisk.toFixed(1)}%
            </div>
            <Badge className={`mt-3 text-lg px-4 py-2 ${result.finalRiskCategory === 'High' ? 'bg-red-600' : result.finalRiskCategory === 'Moderate' ? 'bg-orange-600' : 'bg-green-600'}`}>
              {result.finalRiskCategory.toUpperCase()} RISK
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Confidence: {result.confidence}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Risk Model Comparison
          </CardTitle>
          <CardDescription>Individual predictions from each validated risk model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Framingham */}
            <div className={`p-4 rounded-lg border-2 ${getBgColor(result.framinghamRisk, result.framinghamCategory)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">FRAMINGHAM</p>
                  <p className={`text-3xl font-bold ${getRiskColor(result.framinghamRisk, result.framinghamCategory)}`}>
                    {result.framinghamRisk.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{result.framinghamCategory}</p>
                </div>
                {getRiskIcon(result.framinghamCategory)}
              </div>
              <p className="text-xs text-gray-500 mt-2">General population 10-year risk</p>
            </div>

            {/* ASCVD */}
            <div className={`p-4 rounded-lg border-2 ${getBgColor(result.ascvdRisk, result.ascvdCategory)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">ASCVD POOLED</p>
                  <p className={`text-3xl font-bold ${getRiskColor(result.ascvdRisk, result.ascvdCategory)}`}>
                    {result.ascvdRisk.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{result.ascvdCategory}</p>
                </div>
                {getRiskIcon(result.ascvdCategory)}
              </div>
              <p className="text-xs text-gray-500 mt-2">US population 10-year ASCVD risk</p>
            </div>

            {/* INTERHEART */}
            <div className={`p-4 rounded-lg border-2 ${getBgColor(result.interheart.percentage, result.interheart.category)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">INTERHEART</p>
                  <p className={`text-3xl font-bold ${getRiskColor(result.interheart.percentage, result.interheart.category)}`}>
                    {result.interheart.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{result.interheart.category}</p>
                </div>
                {getRiskIcon(result.interheart.category)}
              </div>
              <p className="text-xs text-gray-500 mt-2">Global MI risk from 52 countries</p>
            </div>

            {/* Indian-Adjusted */}
            <div className={`p-4 rounded-lg border-4 border-orange-500 ${getBgColor(result.indianAdjustedRisk, result.indianCategory)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-orange-700 mb-1">🇮🇳 INDIAN-ADJUSTED</p>
                  <p className={`text-3xl font-bold ${getRiskColor(result.indianAdjustedRisk, result.indianCategory)}`}>
                    {result.indianAdjustedRisk.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{result.indianCategory}</p>
                </div>
                {getRiskIcon(result.indianCategory)}
              </div>
              <p className="text-xs text-gray-500 mt-2">Optimized for Indian population</p>
            </div>
          </div>

          {/* Model Explanation */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <strong>Models Used:</strong> {result.modelVersions.join(', ')}. 
                The Indian-adjusted model incorporates population-specific risk factors including central obesity, triglycerides, and betel quid use.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factor Analysis */}
      {result.topRiskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Risk Factors
            </CardTitle>
            <CardDescription>Contributing factors to your cardiovascular risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.topRiskFactors.slice(0, 5).map((factor, idx) => {
                const riskColor = factor.severity === 'High' ? 'bg-red-100 text-red-800' : factor.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800';
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{idx + 1}. {factor.factor}</span>
                        <Badge className={`text-xs ${riskColor}`}>
                          {factor.severity}
                        </Badge>
                      </div>
                      <span className="font-semibold text-gray-700">{factor.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={factor.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indian Population Insights */}
      {result.indianPopulationInsights && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Globe className="h-5 w-5" />
              🇮🇳 Indian Population Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-600">Age Equivalent</p>
                <p className="text-lg font-bold text-orange-700">{result.indianPopulationInsights.ageEquivalent} yrs</p>
                <p className="text-xs text-gray-500">Adjusted for population</p>
              </div>

              {result.indianPopulationInsights.triglycerideConcern && (
                <div className="p-3 bg-red-100 rounded-lg border border-red-300">
                  <p className="text-xs text-red-700 font-semibold">⚠️ Triglycerides</p>
                  <p className="text-sm text-red-600 font-bold">ELEVATED</p>
                  <p className="text-xs text-red-600">Key risk in Indians</p>
                </div>
              )}

              {result.indianPopulationInsights.centralObesityConcern && (
                <div className="p-3 bg-red-100 rounded-lg border border-red-300">
                  <p className="text-xs text-red-700 font-semibold">⚠️ Central Obesity</p>
                  <p className="text-sm text-red-600 font-bold">CONCERN</p>
                  <p className="text-xs text-red-600">Most important for Indians</p>
                </div>
              )}

              {result.indianPopulationInsights.betelQuidRisk && (
                <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                  <p className="text-xs text-yellow-700 font-semibold">🍃 Betel/Areca</p>
                  <p className="text-sm text-yellow-700 font-bold">RISK FACTOR</p>
                  <p className="text-xs text-yellow-600">Regional risk increase</p>
                </div>
              )}
            </div>

            {result.indianPopulationInsights.metabolicSyndromeLikelihood && (
              <div className="p-3 bg-white rounded-lg border-l-4 border-orange-500">
                <p className="text-sm font-semibold text-gray-800">Metabolic Syndrome</p>
                <p className="text-sm text-gray-700">{result.indianPopulationInsights.metabolicSyndromeLikelihood}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indian-Specific Recommendations */}
      {result.indianSpecificRecommendations.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-orange-600" />
              🇮🇳 Indian-Specific Recommendations
            </CardTitle>
            <CardDescription>Tailored guidance for the Indian population context</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.indianSpecificRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 bg-orange-50 rounded">
                  <span className="text-orange-600 font-bold flex-shrink-0">→</span>
                  <p className="text-sm text-gray-800">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for General Recommendations */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General Recommendations</TabsTrigger>
          <TabsTrigger value="disclaimer">Important Notice</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Cardiovascular Health Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🏃 Lifestyle Modifications</h4>
                  <ul className="space-y-1 text-sm text-gray-700 ml-2">
                    <li>• Maintain regular physical activity (150 min/week moderate intensity)</li>
                    <li>• Follow a heart-healthy diet (low sodium, rich in vegetables/fruits)</li>
                    <li>• Maintain healthy weight (BMI 18.5-24.9)</li>
                    <li>• Limit alcohol consumption</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">💊 Medical Management</h4>
                  <ul className="space-y-1 text-sm text-gray-700 ml-2">
                    <li>• Consult with a cardiologist or physician</li>
                    <li>• Monitor blood pressure regularly</li>
                    <li>• Regular lipid panel screening</li>
                    <li>• Discuss medication if indicated</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">📊 Monitoring</h4>
                  <ul className="space-y-1 text-sm text-gray-700 ml-2">
                    <li>• Regular follow-up assessments</li>
                    <li>• Blood pressure monitoring at home</li>
                    <li>• Annual health check-ups</li>
                    <li>• Track lifestyle changes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disclaimer">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                ⚠️ IMPORTANT MEDICAL DISCLAIMER
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Alert className="border-red-500 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 font-semibold">
                  This assessment is for educational purposes only and does NOT constitute medical advice, diagnosis, or treatment.
                </AlertDescription>
              </Alert>

              <div className="bg-red-50 p-3 rounded-lg space-y-2 text-gray-800">
                <p><strong>🏥 Always consult with your healthcare provider:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• Seek immediate medical attention for chest pain or concerning symptoms</li>
                  <li>• Do not make medical decisions based solely on this assessment</li>
                  <li>• This tool cannot replace professional medical evaluation</li>
                  <li>• Discuss results with a qualified cardiologist or physician</li>
                  <li>• Individual risk varies based on medical history and other factors</li>
                </ul>
              </div>

              <div className="text-gray-600 text-xs">
                <p><strong>Limitations:</strong> Predictions are based on statistical models and population data. Individual outcomes may vary significantly based on factors not captured in this assessment.</p>
              </div>

              <div className="text-center p-3 bg-blue-50 rounded-lg font-semibold text-blue-800">
                🏥 Your healthcare provider should interpret these results in context of your full medical history
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiModelRiskDisplay;
