/**
 * Patient Form with Comprehensive Validation
 * 
 * Provides a complete patient data entry form with real-time validation,
 * error handling, and integration with Zod schemas.
 * 
 * Created: November 4, 2025
 */

import { useState, useCallback } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import type { PatientData } from '../lib/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PatientFormProps {
  onSubmit: (data: PatientData) => Promise<void>;
  initialData?: Partial<PatientData>;
  isLoading?: boolean;
}

interface FormData extends Partial<PatientData> {
  // Additional display fields
  name?: string;
  email?: string;
  phone?: string;
  BMI?: number;
  medicalHistory?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  physicalActivityLevel?: string;
}

export default function PatientFormWithValidation({
  onSubmit,
  initialData,
  isLoading = false,
}: PatientFormProps) {
  const { state: validationState, actions: validationActions } = useFormValidation();
  const [formData, setFormData] = useState<FormData>(initialData || {});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      setFormData(prev => ({ ...prev, [fieldName]: value }));

      // Validate field on change
      validationActions.validateField(fieldName, value);

      // Auto-calculate BMI
      if (fieldName === 'weight' || fieldName === 'height') {
        if (formData.weight && formData.height) {
          const heightInMeters = (formData.height || 0) / 100;
          const weight = fieldName === 'weight' ? value : formData.weight;
          const height =
            fieldName === 'height'
              ? value / 100
              : (formData.height || 0) / 100;
          const bmi = weight / (height * height);
          setFormData(prev => ({ ...prev, BMI: Math.round(bmi * 10) / 10 }));
        }
      }

      // Mark as touched
      validationActions.setFieldTouched(fieldName);
    },
    [formData, validationActions]
  );

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      setSubmitSuccess(false);

      // Validate entire form
      const isValid = validationActions.validateForm(formData);
      if (!isValid) {
        setSubmitError('Please fix the validation errors above.');
        return;
      }

      try {
        // Filter form data to only include PatientData fields
        const patientData: PatientData = {
          age: formData.age || 0,
          gender: (formData.gender as 'male' | 'female') || 'male',
          chestPainType: (formData.chestPainType as any) || 'typical',
          restingBP: formData.restingBP || 0,
          cholesterol: formData.cholesterol || 0,
          fastingBS: formData.fastingBS || false,
          restingECG: (formData.restingECG as any) || 'normal',
          maxHR: formData.maxHR || 0,
          exerciseAngina: formData.exerciseAngina || false,
          oldpeak: formData.oldpeak || 0,
          stSlope: (formData.stSlope as any) || 'flat',
          smoking: formData.smoking || false,
          diabetes: formData.diabetes || false,
          previousHeartAttack: formData.previousHeartAttack || false,
          cholesterolMedication: formData.cholesterolMedication || false,
          bpMedication: formData.bpMedication || false,
          lifestyleChanges: formData.lifestyleChanges || false,
          dietType: (formData.dietType as any) || 'non-vegetarian',
          stressLevel: formData.stressLevel || 5,
          sleepHours: formData.sleepHours || 7,
          physicalActivity: (formData.physicalActivity as any) || 'moderate',
          height: formData.height,
          weight: formData.weight,
          heartRate: formData.maxHR,
          bloodSugar: formData.bloodSugar,
          sleepQuality: formData.sleepQuality,
          exerciseFrequency: formData.exerciseFrequency,
        };

        await onSubmit(patientData);
        setSubmitSuccess(true);
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({});
          validationActions.clearErrors();
          setSubmitSuccess(false);
        }, 2000);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to submit form'
        );
      }
    },
    [formData, onSubmit, validationActions]
  );

  /**
   * Get field status styling
   */
  const getFieldStatus = (fieldName: string) => {
    const error = validationActions.getFieldError(fieldName);
    const touched = validationState.touched[fieldName];

    if (!touched) return 'border-gray-300';
    if (error) return 'border-red-500';
    return 'border-green-500';
  };

  const getFieldStatusIcon = (fieldName: string) => {
    const error = validationActions.getFieldError(fieldName);
    const touched = validationState.touched[fieldName];

    if (!touched) return null;
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Health Assessment</CardTitle>
          <CardDescription>
            Enter your health information for cardiac risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Success Message */}
            {submitSuccess && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Form submitted successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {submitError && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {submitError}
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {validationState.warnings.length > 0 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="font-semibold mb-2">Health Warnings:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationState.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    className={`mt-1 ${getFieldStatus('name')}`}
                    placeholder="John Doe"
                    required
                  />
                  {validationActions.hasError('name') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('name')}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.age || ''}
                    onChange={e =>
                      handleFieldChange('age', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('age')}`}
                    placeholder="45"
                    required
                  />
                  {validationActions.hasError('age') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('age')}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={value => handleFieldChange('gender', value)}
                  >
                    <SelectTrigger className={`mt-1 ${getFieldStatus('gender')}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationActions.hasError('gender') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('gender')}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    className={`mt-1 ${getFieldStatus('email')}`}
                    placeholder="john@example.com"
                  />
                  {validationActions.hasError('email') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('email')}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={e => handleFieldChange('phone', e.target.value)}
                    className={`mt-1 ${getFieldStatus('phone')}`}
                    placeholder="+1-555-0000"
                  />
                  {validationActions.hasError('phone') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('phone')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Clinical Measurements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Clinical Measurements</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blood Pressure */}
                <div>
                  <Label htmlFor="restingBP">
                    Resting Blood Pressure (mmHg) *
                  </Label>
                  <Input
                    id="restingBP"
                    type="number"
                    min="60"
                    max="250"
                    value={formData.restingBP || ''}
                    onChange={e =>
                      handleFieldChange('restingBP', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('restingBP')}`}
                    placeholder="120"
                    required
                  />
                  {validationActions.hasError('restingBP') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('restingBP')}
                    </p>
                  )}
                </div>

                {/* Cholesterol */}
                <div>
                  <Label htmlFor="cholesterol">
                    Cholesterol (mg/dL) *
                  </Label>
                  <Input
                    id="cholesterol"
                    type="number"
                    min="0"
                    max="500"
                    value={formData.cholesterol || ''}
                    onChange={e =>
                      handleFieldChange('cholesterol', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('cholesterol')}`}
                    placeholder="200"
                    required
                  />
                  {validationActions.hasError('cholesterol') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('cholesterol')}
                    </p>
                  )}
                </div>

                {/* Max Heart Rate */}
                <div>
                  <Label htmlFor="maxHR">Max Heart Rate (bpm) *</Label>
                  <Input
                    id="maxHR"
                    type="number"
                    min="20"
                    max="250"
                    value={formData.maxHR || ''}
                    onChange={e =>
                      handleFieldChange('maxHR', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('maxHR')}`}
                    placeholder="150"
                    required
                  />
                  {validationActions.hasError('maxHR') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('maxHR')}
                    </p>
                  )}
                </div>

                {/* Blood Sugar */}
                <div>
                  <Label htmlFor="bloodSugar">
                    Blood Sugar (mg/dL)
                  </Label>
                  <Input
                    id="bloodSugar"
                    type="number"
                    value={formData.bloodSugar || ''}
                    onChange={e =>
                      handleFieldChange('bloodSugar', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('bloodSugar')}`}
                    placeholder="100"
                  />
                </div>

                {/* Weight */}
                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight || ''}
                    onChange={e =>
                      handleFieldChange('weight', parseFloat(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('weight')}`}
                    placeholder="70"
                    required
                  />
                  {validationActions.hasError('weight') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('weight')}
                    </p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height || ''}
                    onChange={e =>
                      handleFieldChange('height', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('height')}`}
                    placeholder="180"
                    required
                  />
                  {validationActions.hasError('height') && (
                    <p className="text-sm text-red-500 mt-1">
                      {validationActions.getFieldError('height')}
                    </p>
                  )}
                </div>

                {/* BMI (Auto-calculated) */}
                <div>
                  <Label htmlFor="BMI">BMI (Auto-calculated)</Label>
                  <Input
                    id="BMI"
                    type="number"
                    value={formData.BMI || ''}
                    readOnly
                    className="mt-1 bg-gray-100"
                    placeholder="--"
                  />
                </div>
              </div>
            </div>

            {/* Lifestyle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lifestyle Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Smoking Status */}
                <div>
                  <Label htmlFor="smokingStatus">Smoking Status</Label>
                  <Select
                    value={formData.smokingStatus || ''}
                    onValueChange={value =>
                      handleFieldChange('smokingStatus', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select smoking status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Alcohol Consumption */}
                <div>
                  <Label htmlFor="alcoholConsumption">
                    Alcohol Consumption
                  </Label>
                  <Select
                    value={formData.alcoholConsumption || ''}
                    onValueChange={value =>
                      handleFieldChange('alcoholConsumption', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select alcohol consumption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="occasionally">Occasionally</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Physical Activity */}
                <div>
                  <Label htmlFor="physicalActivityLevel">
                    Physical Activity Level
                  </Label>
                  <Select
                    value={formData.physicalActivityLevel || ''}
                    onValueChange={value =>
                      handleFieldChange('physicalActivityLevel', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="vigorous">Vigorous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stress Level */}
                <div>
                  <Label htmlFor="stressLevel">Stress Level (1-10)</Label>
                  <Input
                    id="stressLevel"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.stressLevel || ''}
                    onChange={e =>
                      handleFieldChange('stressLevel', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('stressLevel')}`}
                    placeholder="5"
                  />
                </div>

                {/* Sleep Hours */}
                <div>
                  <Label htmlFor="sleepHours">Sleep Hours per Night</Label>
                  <Input
                    id="sleepHours"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.sleepHours || ''}
                    onChange={e =>
                      handleFieldChange('sleepHours', parseFloat(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('sleepHours')}`}
                    placeholder="7"
                  />
                </div>

                {/* Sleep Quality */}
                <div>
                  <Label htmlFor="sleepQuality">Sleep Quality (1-10)</Label>
                  <Input
                    id="sleepQuality"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.sleepQuality || ''}
                    onChange={e =>
                      handleFieldChange('sleepQuality', parseInt(e.target.value))
                    }
                    className={`mt-1 ${getFieldStatus('sleepQuality')}`}
                    placeholder="7"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !validationState.isValid}
              >
                {isLoading ? 'Processing...' : 'Submit Assessment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({});
                  validationActions.clearErrors();
                }}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
