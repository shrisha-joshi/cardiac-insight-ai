import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Heart } from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';

export default function BasicDashboard() {
  const [formData, setFormData] = useState<PatientData>(defaultPatientData);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof PatientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Process uploaded documents to extract relevant data
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        // Simulate document processing - in real implementation, use document parsing
        console.log('Processing document:', file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Process basic assessment with limited features
      console.log('Basic assessment data:', formData);
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
              <Heart className="h-6 w-6 text-medical-primary" />
              Basic Heart Health Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Medical Documents Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Medical Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.dcm"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p>Upload ECG reports, medical PDFs, or images</p>
                      <p className="text-sm text-muted-foreground">PDF, JPG, PNG, DICOM files supported</p>
                    </Label>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="100"
                      max="250"
                      value={formData.height}
                      onChange={(e) => updateField('height', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="20"
                      max="300"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Basic Lifestyle Questions */}
              <Card>
                <CardHeader>
                  <CardTitle>Lifestyle Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smoking">Do you smoke?</Label>
                    <Switch
                      id="smoking"
                      checked={formData.smoking}
                      onCheckedChange={(checked) => updateField('smoking', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="diabetes">Do you have diabetes?</Label>
                    <Switch
                      id="diabetes"
                      checked={formData.diabetes}
                      onCheckedChange={(checked) => updateField('diabetes', checked)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="diet">Diet Type</Label>
                    <Select value={formData.dietType} onValueChange={(value) => updateField('dietType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Get Basic Assessment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}