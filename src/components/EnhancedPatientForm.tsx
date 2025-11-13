import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assessEnhancedCVDRisk, EnhancedCVDPatientData } from '@/lib/enhancedCVDRiskAssessment';
import { AlertCircle } from 'lucide-react';

interface FormErrors {
  [key: string]: string;
}

interface RiskFactor {
  factor: string;
  percentage: number;
  severity: 'Low' | 'Moderate' | 'High';
}

interface PopulationInsights {
  ageEquivalent: number;
  triglycerideConcern: boolean;
  centralObesityConcern: boolean;
  metabolicSyndromeLikelihood: string;
}

interface RiskAssessmentResult {
  framinghamRisk: number;
  framinghamCategory: string;
  ascvdRisk: number;
  ascvdCategory: string;
  interheart: {
    percentage: number;
    category: string;
  };
  indianAdjustedRisk: number;
  indianCategory: string;
  combinedRisk: number;
  finalRiskCategory: string;
  topRiskFactors: RiskFactor[];
  indianSpecificRecommendations: string[];
  indianPopulationInsights: PopulationInsights;
  confidence: number;
  modelVersions: string[];
}

export const EnhancedPatientForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<EnhancedCVDPatientData>>({
    populationGroup: 'Indian',
    smokingStatus: 'Never',
    physicalActivity: 'Moderate',
    alcoholConsumption: 'None',
    diabetesStatus: 'No',
    sex: 'M'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [riskResult, setRiskResult] = useState<RiskAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.age || formData.age < 18 || formData.age > 120) {
      newErrors.age = 'Age must be between 18 and 120';
    }

    if (!formData.systolicBP || formData.systolicBP < 60 || formData.systolicBP > 250) {
      newErrors.systolicBP = 'Systolic BP must be between 60 and 250';
    }

    if (!formData.diastolicBP || formData.diastolicBP < 30 || formData.diastolicBP > 150) {
      newErrors.diastolicBP = 'Diastolic BP must be between 30 and 150';
    }

    if (!formData.triglycerides || formData.triglycerides < 0 || formData.triglycerides > 1000) {
      newErrors.triglycerides = 'Triglycerides must be between 0 and 1000';
    }

    if (!formData.totalCholesterol || formData.totalCholesterol < 0 || formData.totalCholesterol > 300) {
      newErrors.totalCholesterol = 'Total cholesterol must be between 0 and 300';
    }

    if (!formData.ldlCholesterol || formData.ldlCholesterol < 0 || formData.ldlCholesterol > 300) {
      newErrors.ldlCholesterol = 'LDL cholesterol must be between 0 and 300';
    }

    if (!formData.hdlCholesterol || formData.hdlCholesterol < 0 || formData.hdlCholesterol > 200) {
      newErrors.hdlCholesterol = 'HDL cholesterol must be between 0 and 200';
    }

    if (!formData.waistCircumference || formData.waistCircumference < 40 || formData.waistCircumference > 200) {
      newErrors.waistCircumference = 'Waist circumference must be between 40 and 200 cm';
    }

    if (!formData.height || formData.height < 100 || formData.height > 250) {
      newErrors.height = 'Height must be between 100 and 250 cm';
    }

    if (!formData.weight || formData.weight < 30 || formData.weight > 300) {
      newErrors.weight = 'Weight must be between 30 and 300 kg';
    }

    if (!formData.fastingBloodGlucose || formData.fastingBloodGlucose < 30 || formData.fastingBloodGlucose > 600) {
      newErrors.fastingBloodGlucose = 'Fasting glucose must be between 30 and 600';
    }

    if (!formData.hba1c || formData.hba1c < 3 || formData.hba1c > 15) {
      newErrors.hba1c = 'HbA1c must be between 3 and 15';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssessRisk = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const completeData = {
        age: formData.age!,
        sex: formData.sex as 'M' | 'F',
        region: (formData.region || 'Urban') as 'Urban' | 'Rural' | 'Mixed',
        socioeconomicStatus: (formData.socioeconomicStatus || 'Middle') as 'Low' | 'Middle' | 'High',
        populationGroup: (formData.populationGroup || 'Indian') as 'Indian' | 'SouthAsian' | 'Global',
        previousMI: formData.previousMI || false,
        previousStroke: formData.previousStroke || false,
        heartFailureHistory: formData.heartFailureHistory || false,
        systolicBP: formData.systolicBP!,
        diastolicBP: formData.diastolicBP!,
        heartRate: formData.heartRate,
        waistCircumference: formData.waistCircumference!,
        height: formData.height!,
        weight: formData.weight!,
        totalCholesterol: formData.totalCholesterol!,
        ldlCholesterol: formData.ldlCholesterol!,
        hdlCholesterol: formData.hdlCholesterol!,
        triglycerides: formData.triglycerides!,
        lipoproteinA: formData.lipoproteinA,
        fastingBloodGlucose: formData.fastingBloodGlucose!,
        hba1c: formData.hba1c!,
        urineAlbuminCreatinineRatio: formData.urineAlbuminCreatinineRatio,
        smokingStatus: (formData.smokingStatus || 'Never') as 'Never' | 'Former' | 'Current',
        betelQuinUse: (formData.betelQuinUse || 'Never') as 'Never' | 'Former' | 'Current',
        physicalActivity: (formData.physicalActivity || 'Moderate') as 'None' | 'Low' | 'Moderate' | 'High',
        alcoholConsumption: (formData.alcoholConsumption || 'None') as 'None' | 'Moderate' | 'Heavy',
        dietaryPattern: (formData.dietaryPattern || 'Mixed') as 'Traditional' | 'Mixed' | 'Western',
        diabetesStatus: (formData.diabetesStatus || 'No') as 'No' | 'Prediabetic' | 'Diabetic',
      } as EnhancedCVDPatientData;

      const result = assessEnhancedCVDRisk(completeData);
      setRiskResult(result);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Risk assessment error:', error);
      setErrors({ form: 'Error calculating risk. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced CVD Risk Assessment - 25 Features</CardTitle>
          <CardDescription>Comprehensive cardiovascular risk evaluation with Indian population optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demographics" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="history">CVD History</TabsTrigger>
              <TabsTrigger value="clinical">Clinical</TabsTrigger>
              <TabsTrigger value="lipids">Lipids</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
              <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
            </TabsList>

            {/* Demographics Tab */}
            <TabsContent value="demographics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age (years) *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.age || ''}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && <span className="text-red-500 text-sm">{errors.age}</span>}
                </div>

                <div>
                  <Label htmlFor="sex">Sex *</Label>
                  <Select value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select value={formData.region || 'Urban'} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urban">Urban</SelectItem>
                      <SelectItem value="Rural">Rural</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="socioeconomicStatus">Socioeconomic Status</Label>
                  <Select value={formData.socioeconomicStatus || 'Middle'} onValueChange={(value) => handleInputChange('socioeconomicStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Middle">Middle</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="populationGroup">Population Group</Label>
                  <Select value={formData.populationGroup || 'Indian'} onValueChange={(value) => handleInputChange('populationGroup', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indian">Indian</SelectItem>
                      <SelectItem value="SouthAsian">South Asian</SelectItem>
                      <SelectItem value="Global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* CVD History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="previousMI"
                    checked={formData.previousMI || false}
                    onChange={(e) => handleInputChange('previousMI', e.target.checked)}
                  />
                  <Label htmlFor="previousMI">Previous Myocardial Infarction (MI)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="previousStroke"
                    checked={formData.previousStroke || false}
                    onChange={(e) => handleInputChange('previousStroke', e.target.checked)}
                  />
                  <Label htmlFor="previousStroke">Previous Stroke</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="heartFailureHistory"
                    checked={formData.heartFailureHistory || false}
                    onChange={(e) => handleInputChange('heartFailureHistory', e.target.checked)}
                  />
                  <Label htmlFor="heartFailureHistory">Heart Failure History</Label>
                </div>
              </div>
            </TabsContent>

            {/* Clinical Tab */}
            <TabsContent value="clinical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systolicBP">Systolic BP (mmHg) *</Label>
                  <Input
                    id="systolicBP"
                    type="number"
                    value={formData.systolicBP || ''}
                    onChange={(e) => handleInputChange('systolicBP', parseInt(e.target.value) || 0)}
                    className={errors.systolicBP ? 'border-red-500' : ''}
                  />
                  {errors.systolicBP && <span className="text-red-500 text-sm">{errors.systolicBP}</span>}
                </div>

                <div>
                  <Label htmlFor="diastolicBP">Diastolic BP (mmHg) *</Label>
                  <Input
                    id="diastolicBP"
                    type="number"
                    value={formData.diastolicBP || ''}
                    onChange={(e) => handleInputChange('diastolicBP', parseInt(e.target.value) || 0)}
                    className={errors.diastolicBP ? 'border-red-500' : ''}
                  />
                  {errors.diastolicBP && <span className="text-red-500 text-sm">{errors.diastolicBP}</span>}
                </div>

                <div>
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    value={formData.heartRate || ''}
                    onChange={(e) => handleInputChange('heartRate', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="waistCircumference">Waist Circumference (cm) *</Label>
                  <Input
                    id="waistCircumference"
                    type="number"
                    step="0.1"
                    value={formData.waistCircumference || ''}
                    onChange={(e) => handleInputChange('waistCircumference', parseFloat(e.target.value) || 0)}
                    className={errors.waistCircumference ? 'border-red-500' : ''}
                  />
                  {errors.waistCircumference && <span className="text-red-500 text-sm">{errors.waistCircumference}</span>}
                </div>

                <div>
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)}
                    className={errors.height ? 'border-red-500' : ''}
                  />
                  {errors.height && <span className="text-red-500 text-sm">{errors.height}</span>}
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    className={errors.weight ? 'border-red-500' : ''}
                  />
                  {errors.weight && <span className="text-red-500 text-sm">{errors.weight}</span>}
                </div>

                <div>
                  <Label htmlFor="fastingBloodGlucose">Fasting Blood Glucose (mg/dL) *</Label>
                  <Input
                    id="fastingBloodGlucose"
                    type="number"
                    value={formData.fastingBloodGlucose || ''}
                    onChange={(e) => handleInputChange('fastingBloodGlucose', parseInt(e.target.value) || 0)}
                    className={errors.fastingBloodGlucose ? 'border-red-500' : ''}
                  />
                  {errors.fastingBloodGlucose && <span className="text-red-500 text-sm">{errors.fastingBloodGlucose}</span>}
                </div>

                <div>
                  <Label htmlFor="hba1c">HbA1c (%) *</Label>
                  <Input
                    id="hba1c"
                    type="number"
                    step="0.1"
                    value={formData.hba1c || ''}
                    onChange={(e) => handleInputChange('hba1c', parseFloat(e.target.value) || 0)}
                    className={errors.hba1c ? 'border-red-500' : ''}
                  />
                  {errors.hba1c && <span className="text-red-500 text-sm">{errors.hba1c}</span>}
                </div>

                <div>
                  <Label htmlFor="urineAlbuminCreatinineRatio">Urine Albumin-Creatinine Ratio (ACR)</Label>
                  <Input
                    id="urineAlbuminCreatinineRatio"
                    type="number"
                    step="0.1"
                    value={formData.urineAlbuminCreatinineRatio || ''}
                    onChange={(e) => handleInputChange('urineAlbuminCreatinineRatio', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Lipids Tab */}
            <TabsContent value="lipids" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalCholesterol">Total Cholesterol (mg/dL) *</Label>
                  <Input
                    id="totalCholesterol"
                    type="number"
                    value={formData.totalCholesterol || ''}
                    onChange={(e) => handleInputChange('totalCholesterol', parseInt(e.target.value) || 0)}
                    className={errors.totalCholesterol ? 'border-red-500' : ''}
                  />
                  {errors.totalCholesterol && <span className="text-red-500 text-sm">{errors.totalCholesterol}</span>}
                </div>

                <div>
                  <Label htmlFor="ldlCholesterol">LDL Cholesterol (mg/dL) *</Label>
                  <Input
                    id="ldlCholesterol"
                    type="number"
                    value={formData.ldlCholesterol || ''}
                    onChange={(e) => handleInputChange('ldlCholesterol', parseInt(e.target.value) || 0)}
                    className={errors.ldlCholesterol ? 'border-red-500' : ''}
                  />
                  {errors.ldlCholesterol && <span className="text-red-500 text-sm">{errors.ldlCholesterol}</span>}
                </div>

                <div>
                  <Label htmlFor="hdlCholesterol">HDL Cholesterol (mg/dL) *</Label>
                  <Input
                    id="hdlCholesterol"
                    type="number"
                    value={formData.hdlCholesterol || ''}
                    onChange={(e) => handleInputChange('hdlCholesterol', parseInt(e.target.value) || 0)}
                    className={errors.hdlCholesterol ? 'border-red-500' : ''}
                  />
                  {errors.hdlCholesterol && <span className="text-red-500 text-sm">{errors.hdlCholesterol}</span>}
                </div>

                <div>
                  <Label htmlFor="triglycerides">Triglycerides (mg/dL) *</Label>
                  <Input
                    id="triglycerides"
                    type="number"
                    value={formData.triglycerides || ''}
                    onChange={(e) => handleInputChange('triglycerides', parseInt(e.target.value) || 0)}
                    className={errors.triglycerides ? 'border-red-500' : ''}
                  />
                  {errors.triglycerides && <span className="text-red-500 text-sm">{errors.triglycerides}</span>}
                </div>

                <div>
                  <Label htmlFor="lipoproteinA">Lipoprotein(a) (mg/dL)</Label>
                  <Input
                    id="lipoproteinA"
                    type="number"
                    step="0.1"
                    value={formData.lipoproteinA || ''}
                    onChange={(e) => handleInputChange('lipoproteinA', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Lifestyle Tab */}
            <TabsContent value="lifestyle" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smokingStatus">Smoking Status</Label>
                  <Select value={formData.smokingStatus || 'Never'} onValueChange={(value) => handleInputChange('smokingStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never">Never</SelectItem>
                      <SelectItem value="Former">Former</SelectItem>
                      <SelectItem value="Current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="betelQuinUse">Betel Quid/Areca Nut Use</Label>
                  <Select value={formData.betelQuinUse || 'Never'} onValueChange={(value) => handleInputChange('betelQuinUse', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never">Never</SelectItem>
                      <SelectItem value="Former">Former</SelectItem>
                      <SelectItem value="Current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="physicalActivity">Physical Activity Level</Label>
                  <Select value={formData.physicalActivity || 'Moderate'} onValueChange={(value) => handleInputChange('physicalActivity', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="alcoholConsumption">Alcohol Consumption</Label>
                  <Select value={formData.alcoholConsumption || 'None'} onValueChange={(value) => handleInputChange('alcoholConsumption', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dietaryPattern">Dietary Pattern</Label>
                  <Select value={formData.dietaryPattern || 'Mixed'} onValueChange={(value) => handleInputChange('dietaryPattern', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Traditional">Traditional</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                      <SelectItem value="Western">Western</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Diagnosis Tab */}
            <TabsContent value="diagnosis" className="space-y-4">
              <div>
                <Label htmlFor="diabetesStatus">Diabetes Status</Label>
                <Select value={formData.diabetesStatus || 'No'} onValueChange={(value) => handleInputChange('diabetesStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Prediabetic">Prediabetic</SelectItem>
                    <SelectItem value="Diabetic">Diabetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex gap-4">
            <Button onClick={handleAssessRisk} disabled={loading} size="lg">
              {loading ? 'Calculating Risk...' : 'Assess CVD Risk'}
            </Button>
          </div>

          {errors.form && (
            <Alert className="mt-4 border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">{errors.form}</AlertDescription>
            </Alert>
          )}

          {riskResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Risk Assessment Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Framingham Risk</p>
                    <p className="text-2xl font-bold text-blue-600">{riskResult.framinghamRisk.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{riskResult.framinghamCategory}</p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">ASCVD Risk</p>
                    <p className="text-2xl font-bold text-purple-600">{riskResult.ascvdRisk.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{riskResult.ascvdCategory}</p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">INTERHEART Score</p>
                    <p className="text-2xl font-bold text-green-600">{riskResult.interheart.percentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{riskResult.interheart.category}</p>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg border-2 border-orange-300">
                    <p className="text-sm text-gray-600 font-semibold">🇮🇳 Indian-Adjusted</p>
                    <p className="text-2xl font-bold text-orange-600">{riskResult.indianAdjustedRisk.toFixed(1)}%</p>
                    <p className="text-xs text-gray-600 font-semibold">{riskResult.indianCategory}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700">Combined Risk Score</p>
                  <p className="text-2xl font-bold text-gray-800">{riskResult.combinedRisk.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">{riskResult.finalRiskCategory}</p>
                </div>

                {riskResult.topRiskFactors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Top Risk Factors</h4>
                    <div className="space-y-2">
                      {riskResult.topRiskFactors.slice(0, 5).map((factor: RiskFactor, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                          <span className="text-sm text-gray-700">{factor.factor}</span>
                          <span className={`font-semibold ${factor.severity === 'High' ? 'text-red-600' : factor.severity === 'Moderate' ? 'text-orange-600' : 'text-green-600'}`}>
                            {factor.percentage.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {riskResult.indianSpecificRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🇮🇳 Indian-Specific Recommendations</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {riskResult.indianSpecificRecommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {riskResult.indianPopulationInsights && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Population Insights</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Age Equivalent: {riskResult.indianPopulationInsights.ageEquivalent} years</p>
                      {riskResult.indianPopulationInsights.triglycerideConcern && <p className="text-orange-600">⚠️ Triglyceride concern detected</p>}
                      {riskResult.indianPopulationInsights.centralObesityConcern && <p className="text-red-600">⚠️ Central obesity concern detected</p>}
                      {riskResult.indianPopulationInsights.metabolicSyndromeLikelihood && (
                        <p>Metabolic Syndrome: {riskResult.indianPopulationInsights.metabolicSyndromeLikelihood}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Confidence: {riskResult.confidence}% | Models: {riskResult.modelVersions.join(', ')}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPatientForm;
