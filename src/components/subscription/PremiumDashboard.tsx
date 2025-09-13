import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Upload, FileText, Heart, Activity } from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';

export default function PremiumDashboard() {
  const [formData, setFormData] = useState<PatientData>({
    ...defaultPatientData,
    stressLevel: 5,
    sleepQuality: 7,
    exerciseFrequency: 3
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof PatientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Enhanced document processing for premium users
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        console.log('Processing premium document:', file.name);
        // Simulate ECG reading and auto-filling form data
        if (file.name.toLowerCase().includes('ecg') || file.name.toLowerCase().includes('ekg')) {
          // Simulate ECG analysis results
          updateField('ecgResults', 'abnormal');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Premium assessment data:', formData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Activity className="h-6 w-6 text-medical-primary" />
              Premium Heart Health Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Enhanced Medical Documents Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Advanced Medical Document Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.dcm,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p>Upload ECG, lab reports, medical PDFs with AI analysis</p>
                      <p className="text-sm text-muted-foreground">Enhanced parsing for ECG values and lab results</p>
                    </Label>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{file.name}</span>
                          <div className="flex gap-2">
                            <span className="text-xs text-green-600">✓ Processed</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comprehensive Health Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Health Metrics</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systolicBP">Systolic Blood Pressure</Label>
                    <Input
                      id="systolicBP"
                      type="number"
                      min="80"
                      max="220"
                      value={formData.systolicBP}
                      onChange={(e) => updateField('systolicBP', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="diastolicBP">Diastolic Blood Pressure</Label>
                    <Input
                      id="diastolicBP"
                      type="number"
                      min="40"
                      max="140"
                      value={formData.diastolicBP}
                      onChange={(e) => updateField('diastolicBP', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cholesterol">Total Cholesterol (mg/dL)</Label>
                    <Input
                      id="cholesterol"
                      type="number"
                      min="100"
                      max="400"
                      value={formData.cholesterol}
                      onChange={(e) => updateField('cholesterol', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="heartRate">Resting Heart Rate</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      min="30"
                      max="150"
                      value={formData.heartRate}
                      onChange={(e) => updateField('heartRate', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Lifestyle Assessment with Sliders */}
              <Card>
                <CardHeader>
                  <CardTitle>Comprehensive Lifestyle Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Stress Level (1-10)</Label>
                    <Slider
                      value={[formData.stressLevel]}
                      onValueChange={(value) => updateField('stressLevel', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Current: {formData.stressLevel}/10</p>
                  </div>
                  
                  <div>
                    <Label>Sleep Quality (1-10)</Label>
                    <Slider
                      value={[formData.sleepQuality]}
                      onValueChange={(value) => updateField('sleepQuality', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Current: {formData.sleepQuality}/10</p>
                  </div>
                  
                  <div>
                    <Label>Exercise Frequency (days per week)</Label>
                    <Slider
                      value={[formData.exerciseFrequency]}
                      onValueChange={(value) => updateField('exerciseFrequency', value[0])}
                      max={7}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">{formData.exerciseFrequency} days per week</p>
                  </div>

                  <div>
                    <Label htmlFor="dietHabits">Describe your daily diet habits</Label>
                    <Textarea
                      id="dietHabits"
                      placeholder="Include typical meals, portion sizes, timing..."
                      value={formData.dietHabits || ''}
                      onChange={(e) => updateField('dietHabits', e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="previousHeartAttack">Previous heart attack?</Label>
                      <Switch
                        id="previousHeartAttack"
                        checked={formData.previousHeartAttack}
                        onCheckedChange={(checked) => updateField('previousHeartAttack', checked)}
                      />
                    </div>
                    
                    {formData.previousHeartAttack && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cholesterolMedication">Taking cholesterol medication?</Label>
                        <Switch
                          id="cholesterolMedication"
                          checked={formData.cholesterolMedication}
                          onCheckedChange={(checked) => updateField('cholesterolMedication', checked)}
                        />
                      </div>
                    )}
                  </div>

                  {formData.diabetes && (
                    <div>
                      <Label htmlFor="diabetesTreatment">Diabetes treatment</Label>
                      <Select value={formData.diabetesTreatment} onValueChange={(value) => updateField('diabetesTreatment', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="insulin">Insulin</SelectItem>
                          <SelectItem value="tablets">Oral medication</SelectItem>
                          <SelectItem value="both">Both insulin and tablets</SelectItem>
                          <SelectItem value="diet">Diet control only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Analyzing...' : 'Get Premium Assessment with Ayurvedic Recommendations'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}