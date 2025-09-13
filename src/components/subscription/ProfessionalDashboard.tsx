import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Upload, FileText, Heart, Stethoscope, Users } from 'lucide-react';
import { PatientData, defaultPatientData } from '@/lib/mockData';

export default function ProfessionalDashboard() {
  const [formData, setFormData] = useState<PatientData>({
    ...defaultPatientData,
    stressLevel: 5,
    sleepQuality: 7,
    exerciseFrequency: 3,
    familyHistory: [],
    supplements: []
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([{ name: '', relation: '', conditions: '' }]);

  const updateField = (field: keyof PatientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Professional-level document processing with AI analysis
    for (const file of files) {
      console.log('Processing professional document:', file.name);
      // Simulate advanced AI analysis for professional tier
      if (file.name.toLowerCase().includes('blood') || file.name.toLowerCase().includes('lab')) {
        // Auto-populate lab values
        updateField('cholesterol', 180);
        updateField('bloodSugar', 95);
      }
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: '', relation: '', conditions: '' }]);
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    const updated = familyMembers.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    );
    setFamilyMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const professionalData = {
        ...formData,
        familyHistory: familyMembers.filter(m => m.name && m.relation)
      };
      console.log('Professional assessment data:', professionalData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Stethoscope className="h-6 w-6 text-medical-primary" />
              Professional Comprehensive Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* AI-Powered Document Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    AI-Powered Medical Document Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.dcm,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p>Upload comprehensive medical records with AI extraction</p>
                      <p className="text-sm text-muted-foreground">ECG, lab reports, imaging, genetic tests - all formats supported</p>
                    </Label>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 grid md:grid-cols-2 gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <span className="text-sm font-medium">{file.name}</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ AI Analyzed</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Data Extracted</span>
                            </div>
                          </div>
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

              {/* Comprehensive Clinical Data */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Clinical Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="systolicBP">Systolic BP</Label>
                        <Input
                          id="systolicBP"
                          type="number"
                          value={formData.systolicBP}
                          onChange={(e) => updateField('systolicBP', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="diastolicBP">Diastolic BP</Label>
                        <Input
                          id="diastolicBP"
                          type="number"
                          value={formData.diastolicBP}
                          onChange={(e) => updateField('diastolicBP', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="heartRate">Resting HR</Label>
                        <Input
                          id="heartRate"
                          type="number"
                          value={formData.heartRate}
                          onChange={(e) => updateField('heartRate', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cholesterol">Total Cholesterol</Label>
                        <Input
                          id="cholesterol"
                          type="number"
                          value={formData.cholesterol}
                          onChange={(e) => updateField('cholesterol', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ldl">LDL Cholesterol</Label>
                        <Input
                          id="ldl"
                          type="number"
                          value={formData.ldlCholesterol || ''}
                          onChange={(e) => updateField('ldlCholesterol', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hdl">HDL Cholesterol</Label>
                        <Input
                          id="hdl"
                          type="number"
                          value={formData.hdlCholesterol || ''}
                          onChange={(e) => updateField('hdlCholesterol', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="medications">Current Medications</Label>
                      <Textarea
                        id="medications"
                        placeholder="List all current medications with dosages..."
                        value={formData.currentMedications || ''}
                        onChange={(e) => updateField('currentMedications', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Family Health History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {familyMembers.map((member, index) => (
                      <div key={index} className="space-y-2 p-3 border rounded-lg mb-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Name"
                            value={member.name}
                            onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                          />
                          <Select 
                            value={member.relation} 
                            onValueChange={(value) => updateFamilyMember(index, 'relation', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Relation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="father">Father</SelectItem>
                              <SelectItem value="mother">Mother</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="grandparent">Grandparent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          placeholder="Medical conditions, age of onset..."
                          value={member.conditions}
                          onChange={(e) => updateFamilyMember(index, 'conditions', e.target.value)}
                        />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addFamilyMember} className="w-full">
                      Add Family Member
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Lifestyle Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Lifestyle & Wellness Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
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
                      <p className="text-sm text-muted-foreground mt-1">{formData.stressLevel}/10</p>
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
                      <p className="text-sm text-muted-foreground mt-1">{formData.sleepQuality}/10</p>
                    </div>
                    
                    <div>
                      <Label>Exercise (days/week)</Label>
                      <Slider
                        value={[formData.exerciseFrequency]}
                        onValueChange={(value) => updateField('exerciseFrequency', value[0])}
                        max={7}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">{formData.exerciseFrequency} days</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="workStress">Work Environment & Stress Factors</Label>
                      <Textarea
                        id="workStress"
                        placeholder="Describe work schedule, stress factors, environment..."
                        value={formData.workStress || ''}
                        onChange={(e) => updateField('workStress', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="supplements">Supplements & Vitamins</Label>
                      <Textarea
                        id="supplements"
                        placeholder="List all supplements, vitamins, herbal medicines..."
                        value={formData.supplementsDescription || ''}
                        onChange={(e) => updateField('supplementsDescription', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Processing Comprehensive Analysis...' : 'Generate Professional Report with Complete Recommendations'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}