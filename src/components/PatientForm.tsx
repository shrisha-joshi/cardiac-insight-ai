import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { PatientData, defaultPatientData } from '@/lib/mockData';
import { Heart, Activity, User, Stethoscope } from 'lucide-react';

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  loading?: boolean;
}

export default function PatientForm({ onSubmit, loading }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientData>(defaultPatientData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof PatientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cardiovascular Metrics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Activity className="h-5 w-5" />
              Cardiovascular Metrics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restingBP">Resting Blood Pressure (mmHg)</Label>
                <div className="px-3">
                  <Slider
                    value={[formData.restingBP]}
                    onValueChange={(value) => updateField('restingBP', value[0])}
                    max={200}
                    min={80}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>80</span>
                    <span className="font-medium">{formData.restingBP}</span>
                    <span>200</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cholesterol">Cholesterol (mg/dl)</Label>
                <div className="px-3">
                  <Slider
                    value={[formData.cholesterol]}
                    onValueChange={(value) => updateField('cholesterol', value[0])}
                    max={400}
                    min={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>100</span>
                    <span className="font-medium">{formData.cholesterol}</span>
                    <span>400</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHR">Maximum Heart Rate</Label>
                <div className="px-3">
                  <Slider
                    value={[formData.maxHR]}
                    onValueChange={(value) => updateField('maxHR', value[0])}
                    max={220}
                    min={60}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>60</span>
                    <span className="font-medium">{formData.maxHR}</span>
                    <span>220</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldpeak">ST Depression (Oldpeak)</Label>
                <div className="px-3">
                  <Slider
                    value={[formData.oldpeak]}
                    onValueChange={(value) => updateField('oldpeak', value[0])}
                    max={6}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>0</span>
                    <span className="font-medium">{formData.oldpeak.toFixed(1)}</span>
                    <span>6</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Stethoscope className="h-5 w-5" />
              Clinical Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chestPainType">Chest Pain Type</Label>
                <Select value={formData.chestPainType} onValueChange={(value) => updateField('chestPainType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typical">Typical Angina</SelectItem>
                    <SelectItem value="atypical">Atypical Angina</SelectItem>
                    <SelectItem value="non-anginal">Non-Anginal Pain</SelectItem>
                    <SelectItem value="asymptomatic">Asymptomatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="restingECG">Resting ECG</Label>
                <Select value={formData.restingECG} onValueChange={(value) => updateField('restingECG', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="st-t">ST-T Wave Abnormality</SelectItem>
                    <SelectItem value="lvh">Left Ventricular Hypertrophy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stSlope">ST Slope</Label>
                <Select value={formData.stSlope} onValueChange={(value) => updateField('stSlope', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Upsloping</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="down">Downsloping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-medical-primary">
              <Heart className="h-5 w-5" />
              Risk Factors
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="fastingBS" className="font-medium">Fasting Blood Sugar &gt; 120 mg/dl</Label>
                <Switch
                  id="fastingBS"
                  checked={formData.fastingBS}
                  onCheckedChange={(checked) => updateField('fastingBS', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="exerciseAngina" className="font-medium">Exercise Induced Angina</Label>
                <Switch
                  id="exerciseAngina"
                  checked={formData.exerciseAngina}
                  onCheckedChange={(checked) => updateField('exerciseAngina', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="smoking" className="font-medium">Smoking</Label>
                <Switch
                  id="smoking"
                  checked={formData.smoking}
                  onCheckedChange={(checked) => updateField('smoking', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="diabetes" className="font-medium">Diabetes</Label>
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