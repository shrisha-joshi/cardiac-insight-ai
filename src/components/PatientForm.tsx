import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { Heart, Activity, User, Stethoscope, Upload, FileText } from 'lucide-react';

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  loading?: boolean;
}

export default function PatientForm({ onSubmit, loading }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientData>(defaultPatientData);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof PatientData, value: any) => {
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
                <Input
                  id="heartRate"
                  type="number"
                  value={formData.maxHR}
                  onChange={(e) => updateField('maxHR', parseInt(e.target.value) || 150)}
                  min="50"
                  max="220"
                  placeholder="e.g., 72"
                />
                <div className="text-xs text-muted-foreground">Your heart rate when at rest (beats per minute)</div>
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
                  <Label htmlFor="fastingBS" className="font-medium">High Blood Sugar</Label>
                  <div className="text-xs text-muted-foreground">Fasting blood sugar over 120 mg/dL</div>
                </div>
                <Switch
                  id="fastingBS"
                  checked={formData.fastingBS}
                  onCheckedChange={(checked) => updateField('fastingBS', checked)}
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
                  <Label htmlFor="diabetes" className="font-medium">Diabetes</Label>
                  <div className="text-xs text-muted-foreground">Diagnosed with diabetes</div>
                </div>
                <Switch
                  id="diabetes"
                  checked={formData.diabetes}
                  onCheckedChange={(checked) => updateField('diabetes', checked)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Analyzing...' : 'Predict Heart Attack Risk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}