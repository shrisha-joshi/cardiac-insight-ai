import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { validatePatientDataComprehensive, getChecksBySeverity, type EdgeCaseValidationResult } from '@/lib/edgeCaseHandler';
import { Heart, Activity, User, Stethoscope, Upload, FileText, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  loading?: boolean;
}

export default function PatientForm({ onSubmit, loading }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientData>(defaultPatientData);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [validationResult, setValidationResult] = useState<EdgeCaseValidationResult | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate data before submitting
    const validation = validatePatientDataComprehensive(formData);
    setValidationResult(validation);
    
    if (validation.hasError) {
      setShowValidationErrors(true);
      return; // Don't submit if there are errors
    }
    
    // If validation passes or only has warnings, proceed
    onSubmit(formData);
  };

  const updateField = (field: keyof PatientData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Heart className="h-6 w-6 text-medical-primary" />
          Patient Information
        </CardTitle>
        <CardDescription>
          Enter patient details for heart attack risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Medical Documents Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Upload className="h-5 w-5" />
              Medical Documents (Optional)
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Upload medical reports, ECG results, or other relevant documents
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" className="mt-2">
                      Choose Files
                    </Button>
                  </Label>
                </div>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Uploaded Files:</div>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <User className="h-5 w-5" />
              Basic Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                  min="1"
                  max="120"
                  placeholder="Enter your age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm) - Optional</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  min="100"
                  max="250"
                />
                <div className="text-xs text-muted-foreground">Your height in centimeters</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) - Optional</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  min="30"
                  max="300"
                />
                <div className="text-xs text-muted-foreground">Your weight in kilograms</div>
              </div>
            </div>
          </div>

          {/* Health Metrics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Activity className="h-5 w-5" />
              Health Metrics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restingBP">Blood Pressure Category</Label>
                <Select value={formData.restingBP > 140 ? 'high' : formData.restingBP > 120 ? 'elevated' : 'normal'} 
                        onValueChange={(value) => updateField('restingBP', value === 'high' ? 160 : value === 'elevated' ? 130 : 110)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood pressure range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (Less than 120/80)</SelectItem>
                    <SelectItem value="elevated">Elevated (120-129/Less than 80)</SelectItem>
                    <SelectItem value="high">High (130/80 or higher)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">Choose the range that best describes your usual blood pressure</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cholesterol">Cholesterol Level</Label>
                <Select value={formData.cholesterol > 240 ? 'high' : formData.cholesterol > 200 ? 'borderline' : 'normal'} 
                        onValueChange={(value) => updateField('cholesterol', value === 'high' ? 280 : value === 'borderline' ? 220 : 180)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cholesterol range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (Less than 200 mg/dL)</SelectItem>
                    <SelectItem value="borderline">Borderline High (200-239 mg/dL)</SelectItem>
                    <SelectItem value="high">High (240 mg/dL or higher)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">From your recent blood test results</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Resting Heart Rate</Label>
                <Select 
                  value={formData.maxHR < 70 ? 'low' : formData.maxHR > 100 ? 'high' : 'normal'} 
                  onValueChange={(value) => updateField('maxHR', value === 'low' ? 60 : value === 'high' ? 110 : 80)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select heart rate range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (50-69 bpm) - Athletic/Very Fit</SelectItem>
                    <SelectItem value="normal">Normal (70-100 bpm) - Healthy Range</SelectItem>
                    <SelectItem value="high">High (100+ bpm) - May Need Attention</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">Your typical resting heart rate</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exerciseCapacity">Exercise Capacity</Label>
                <Select value={formData.oldpeak > 2 ? 'low' : formData.oldpeak > 1 ? 'moderate' : 'good'} 
                        onValueChange={(value) => updateField('oldpeak', value === 'low' ? 3 : value === 'moderate' ? 1.5 : 0.5)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How well can you exercise?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good - Can exercise vigorously without issues</SelectItem>
                    <SelectItem value="moderate">Moderate - Some difficulty with intense exercise</SelectItem>
                    <SelectItem value="low">Limited - Difficulty with most physical activities</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">Your general ability to perform physical activities</div>
              </div>
            </div>
          </div>

          {/* Symptoms & Medical History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Stethoscope className="h-5 w-5" />
              Symptoms & Medical History
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chestPainType">Chest Pain Experience</Label>
                <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chest pain type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typical">Severe chest pain during physical activity</SelectItem>
                    <SelectItem value="atypical">Mild chest discomfort occasionally</SelectItem>
                    <SelectItem value="non-anginal">Chest pain not related to heart</SelectItem>
                    <SelectItem value="asymptomatic">No chest pain</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">How would you describe your chest pain experience?</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="restingECG">Recent Heart Test (ECG/EKG) Results</Label>
                <Select value={formData.restingECG} onValueChange={(value) => updateField('restingECG', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ECG result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal - No issues found</SelectItem>
                    <SelectItem value="st-t">Abnormal - Minor irregularities detected</SelectItem>
                    <SelectItem value="lvh">Abnormal - Heart enlargement detected</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">From your most recent heart test (if available)</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stSlope">Exercise Test Results</Label>
                <Select value={formData.stSlope} onValueChange={(value) => updateField('stSlope', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exercise test result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Normal - Heart responds well to exercise</SelectItem>
                    <SelectItem value="flat">Mild concern - Flat response to exercise</SelectItem>
                    <SelectItem value="down">Concerning - Poor response to exercise</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">Results from stress test or exercise ECG (if done)</div>
              </div>
            </div>
          </div>

          {/* Lifestyle & Health Conditions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Heart className="h-5 w-5" />
              Lifestyle & Health Conditions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="diabetes" className="font-medium">Diabetes/High Blood Sugar</Label>
                  <div className="text-xs text-muted-foreground">Diagnosed with diabetes or high blood sugar</div>
                </div>
                <Switch
                  id="diabetes"
                  checked={formData.diabetes}
                  onCheckedChange={(checked) => updateField('diabetes', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="exerciseAngina" className="font-medium">Chest Pain During Exercise</Label>
                  <div className="text-xs text-muted-foreground">Experience chest pain when exercising</div>
                </div>
                <Switch
                  id="exerciseAngina"
                  checked={formData.exerciseAngina}
                  onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="smoking" className="font-medium">Smoking</Label>
                  <div className="text-xs text-muted-foreground">Current or past smoker</div>
                </div>
                <Switch
                  id="smoking"
                  checked={formData.smoking}
                  onCheckedChange={(checked) => updateField('smoking', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="hasPositiveFamilyHistory" className="font-medium">✅ Family History of Heart Disease</Label>
                  <div className="text-xs text-muted-foreground">Parent/sibling with heart attack or cardiac disease</div>
                </div>
                <Switch
                  id="hasPositiveFamilyHistory"
                  checked={formData.hasPositiveFamilyHistory || false}
                  onCheckedChange={(checked) => updateField('hasPositiveFamilyHistory', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="hasHypertension" className="font-medium">✅ Diagnosed Hypertension</Label>
                  <div className="text-xs text-muted-foreground">Doctor diagnosed with high blood pressure condition</div>
                </div>
                <Switch
                  id="hasHypertension"
                  checked={formData.hasHypertension || false}
                  onCheckedChange={(checked) => updateField('hasHypertension', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="hasMentalHealthIssues" className="font-medium">✅ Depression/Anxiety History</Label>
                  <div className="text-xs text-muted-foreground">History of depression, anxiety, or mental health conditions</div>
                </div>
                <Switch
                  id="hasMentalHealthIssues"
                  checked={formData.hasMentalHealthIssues || false}
                  onCheckedChange={(checked) => updateField('hasMentalHealthIssues', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="previousHeartAttack" className="font-medium">Previous Heart Attack</Label>
                  <div className="text-xs text-muted-foreground">History of heart attack or cardiac event</div>
                </div>
                <Switch
                  id="previousHeartAttack"
                  checked={formData.previousHeartAttack}
                  onCheckedChange={(checked) => updateField('previousHeartAttack', checked)}
                />
              </div>
            </div>
          </div>

          {/* Conditional Questions */}
          {(formData.previousHeartAttack || formData.diabetes || formData.restingBP > 130) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
                <Heart className="h-5 w-5" />
                Additional Medical Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.previousHeartAttack && (
                  <div className="space-y-2">
                    <Label>Are you taking cholesterol medication?</Label>
                    <Select value={formData.cholesterolMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('cholesterolMedication', value === 'yes')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, taking cholesterol medication</SelectItem>
                        <SelectItem value="no">No, not taking medication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.diabetes && (
                  <div className="space-y-2">
                    <Label>What diabetes treatment are you taking?</Label>
                    <Select value={formData.diabetesMedication} onValueChange={(value) => updateField('diabetesMedication', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insulin">Insulin injections</SelectItem>
                        <SelectItem value="tablets">Oral tablets/pills</SelectItem>
                        <SelectItem value="both">Both insulin and tablets</SelectItem>
                        <SelectItem value="none">No medication currently</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.restingBP > 130 && (
                  <>
                    <div className="space-y-2">
                      <Label>Are you taking blood pressure medication?</Label>
                      <Select value={formData.bpMedication ? 'yes' : 'no'} onValueChange={(value) => updateField('bpMedication', value === 'yes')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes, taking BP medication</SelectItem>
                          <SelectItem value="no">No, not taking medication</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Have you made lifestyle/diet changes recently?</Label>
                      <Select value={formData.lifestyleChanges ? 'yes' : 'no'} onValueChange={(value) => updateField('lifestyleChanges', value === 'yes')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes, made significant changes</SelectItem>
                          <SelectItem value="no">No, no major changes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ✅ NEW: Current Medications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Stethoscope className="h-5 w-5" />
              ✅ Current Medications
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentMedicationsList">List All Current Medications</Label>
              <Textarea
                id="currentMedicationsList"
                value={formData.currentMedicationsList || ''}
                onChange={(e) => updateField('currentMedicationsList', e.target.value)}
                placeholder="E.g., Metformin 500mg twice daily, Lisinopril 10mg, Aspirin 81mg, etc."
                className="min-h-20"
              />
              <div className="text-xs text-muted-foreground">List all medications, supplements, and dosages. This helps assess medication interactions and adherence to treatment.</div>
            </div>
          </div>

          {/* ✅ NEW (Phase 2): Advanced Cardiac Markers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Stethoscope className="h-5 w-5" />
              ✅ Advanced Cardiac Markers (Optional)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lipoproteinA">Lipoprotein(a) - Lp(a) (mg/dL)</Label>
                <Input
                  id="lipoproteinA"
                  type="number"
                  value={formData.lipoproteinA || ''}
                  onChange={(e) => updateField('lipoproteinA', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Normal: less than 30"
                  step="0.1"
                />
                <div className="text-xs text-muted-foreground">Genetically determined. 30% of Indians have elevated levels. (Normal: &lt;30 mg/dL)</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hscrp">High-Sensitivity CRP (mg/L)</Label>
                <Input
                  id="hscrp"
                  type="number"
                  value={formData.hscrp || ''}
                  onChange={(e) => updateField('hscrp', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Normal: less than 1.0"
                  step="0.1"
                />
                <div className="text-xs text-muted-foreground">Inflammation marker. (Normal: &lt;1.0 mg/L, Low risk: 1-3, High risk: &gt;3)</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="homocysteine">Homocysteine (µmol/L)</Label>
                <Input
                  id="homocysteine"
                  type="number"
                  value={formData.homocysteine || ''}
                  onChange={(e) => updateField('homocysteine', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Normal: less than 15"
                  step="0.1"
                />
                <div className="text-xs text-muted-foreground">Independent CVD risk factor. (Normal: &lt;15 µmol/L)</div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-900">
                💡 <strong>Optional Advanced Markers:</strong> If you have recent lab test results, enter these values for more accurate risk assessment. These advanced markers are especially important for Indian populations with genetic predisposition to CVD.
              </p>
            </div>
          </div>

          {/* ✅ NEW (Phase 2 Task 3): Regional Calibration for Indian Demographics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Stethoscope className="h-5 w-5" />
              ✅ Regional Calibration (Optional)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Indian Region</Label>
                <Select value={formData.region || 'unknown'} onValueChange={(value) => updateField('region', value)}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown/Not specified</SelectItem>
                    <SelectItem value="north">North India (+5% risk adjustment)</SelectItem>
                    <SelectItem value="south">South India (+8% risk adjustment)</SelectItem>
                    <SelectItem value="east">East India (+4% risk adjustment)</SelectItem>
                    <SelectItem value="west">West India (+6% risk adjustment)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">Regional CVD prevalence varies across India</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaType">Area Type</Label>
                <Select value={formData.areaType || 'unknown'} onValueChange={(value) => updateField('areaType', value)}>
                  <SelectTrigger id="areaType">
                    <SelectValue placeholder="Select area type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="urban">Urban (+3% adjustment)</SelectItem>
                    <SelectItem value="rural">Rural (+2% adjustment)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">Urban stress vs. rural physical activity patterns</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode (for auto-detection)</Label>
                <Input
                  id="pincode"
                  type="text"
                  value={formData.pincode || ''}
                  onChange={(e) => updateField('pincode', e.target.value)}
                  placeholder="e.g., 560001"
                  maxLength={6}
                />
                <div className="text-xs text-muted-foreground">Optional: Auto-detect region from pincode</div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-900">
                🗺️ <strong>Regional Calibration:</strong> CVD risk varies significantly by region in India. South India has the highest prevalence. Your risk assessment will be adjusted based on regional CVD epidemiology to provide more accurate predictions.
              </p>
            </div>
          </div>

          {/* Lifestyle Assessment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Activity className="h-5 w-5" />
              Lifestyle Assessment
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dietary Preference</Label>
                <Select value={formData.dietType} onValueChange={(value) => updateField('dietType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select diet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Physical Activity Level</Label>
                <Select value={formData.physicalActivity} onValueChange={(value) => updateField('physicalActivity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Minimal exercise</SelectItem>
                    <SelectItem value="moderate">Moderate - Regular light exercise</SelectItem>
                    <SelectItem value="high">High - Intensive regular exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stressLevel">Stress Level (1-10)</Label>
                <Input
                  id="stressLevel"
                  type="number"
                  value={formData.stressLevel}
                  onChange={(e) => updateField('stressLevel', parseInt(e.target.value) || 5)}
                  min="1"
                  max="10"
                  placeholder="5"
                />
                <div className="text-xs text-muted-foreground">1 = Very relaxed, 10 = Extremely stressed</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleepHours">Average Sleep Hours</Label>
                <Input
                  id="sleepHours"
                  type="number"
                  value={formData.sleepHours}
                  onChange={(e) => updateField('sleepHours', parseInt(e.target.value) || 7)}
                  min="3"
                  max="12"
                  placeholder="7"
                />
                <div className="text-xs text-muted-foreground">Hours of sleep per night on average</div>
              </div>
            </div>
          </div>

          {/* Validation Alerts */}
          {showValidationErrors && validationResult && (
            <div className="space-y-3">
              {/* Error Alerts */}
              {validationResult.hasError && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <div className="font-semibold mb-2">❌ Data Validation Failed</div>
                    {getChecksBySeverity(validationResult, 'error').map((check, idx) => (
                      <div key={idx} className="mb-2 text-sm">
                        <div className="font-medium">{check.field.toUpperCase()}:</div>
                        <div className="ml-2">{check.message}</div>
                        {check.suggestion && (
                          <div className="ml-2 text-xs italic">💡 {check.suggestion}</div>
                        )}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Warning Alerts */}
              {!validationResult.hasError && validationResult.isWarning && (
                <Alert className="border-yellow-600/50 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <div className="font-semibold mb-2">⚠️ Data Warnings</div>
                    {getChecksBySeverity(validationResult, 'warning').map((check, idx) => (
                      <div key={idx} className="mb-2 text-sm">
                        <div className="font-medium">{check.field.toUpperCase()}:</div>
                        <div className="ml-2">{check.message}</div>
                        {check.suggestion && (
                          <div className="ml-2 text-xs italic">💡 {check.suggestion}</div>
                        )}
                      </div>
                    ))}
                    <div className="mt-3 text-xs">
                      <strong>Note:</strong> You can proceed with submission, but please review the warnings carefully.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Alerts */}
              {!validationResult.hasError && !validationResult.isWarning && validationResult.checks.length > 0 && (
                <Alert className="border-blue-600/50 bg-blue-50">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="font-semibold">✅ Data Validation Passed</div>
                    <div className="text-sm mt-1">{validationResult.summary}</div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Analyzing...' : 'Predict Heart Attack Risk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}