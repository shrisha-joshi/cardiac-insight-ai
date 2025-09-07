import { supabase } from '@/lib/supabase';

export interface MLPredictionRequest {
  patientData: any;
  userId?: string;
  useHistoricalData?: boolean;
}

export interface MLPredictionResponse {
  prediction: {
    riskLevel: 'Low' | 'Medium' | 'High';
    riskScore: number;
    confidence: number;
    prediction: 'No Risk' | 'Risk Detected';
  };
  explanation: string;
  recommendations: string[];
  factorsAnalyzed: string[];
  modelVersion: string;
}

class MLService {
  private apiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000/api';

  async uploadDataset(file: File, userId: string): Promise<{ success: boolean; message: string; datasetId?: string }> {
    try {
      // Upload file to Supabase storage
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save dataset metadata
      const { data: datasetData, error: datasetError } = await supabase
        .from('ml_datasets')
        .insert({
          user_id: userId,
          dataset_name: file.name,
          file_path: uploadData.path,
          file_type: file.type,
          processing_status: 'uploaded',
          metadata: {
            size: file.size,
            uploadedAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (datasetError) {
        throw datasetError;
      }

      // Trigger ML pipeline processing
      await this.processDataset(datasetData.id, userId);

      return {
        success: true,
        message: 'Dataset uploaded and processing started',
        datasetId: datasetData.id
      };
    } catch (error) {
      console.error('Dataset upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async processDataset(datasetId: string, userId: string): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('ml_datasets')
        .update({ processing_status: 'processing' })
        .eq('id', datasetId);

      // Call ML API for dataset processing
      const response = await fetch(`${this.apiUrl}/process-dataset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: datasetId,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process dataset');
      }

      // Update status to completed
      await supabase
        .from('ml_datasets')
        .update({ 
          processing_status: 'completed',
          metadata: {
            processedAt: new Date().toISOString()
          }
        })
        .eq('id', datasetId);

    } catch (error) {
      console.error('Dataset processing error:', error);
      
      // Update status to failed
      await supabase
        .from('ml_datasets')
        .update({ 
          processing_status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : 'Processing failed',
            failedAt: new Date().toISOString()
          }
        })
        .eq('id', datasetId);
    }
  }

  async predictHeartAttackRisk(request: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      let historicalData = null;

      // Fetch user's historical data if requested and userId is provided
      if (request.useHistoricalData && request.userId) {
        const { data: history } = await supabase
          .from('medical_history')
          .select('*')
          .eq('user_id', request.userId)
          .order('assessment_date', { ascending: false })
          .limit(5);

        historicalData = history || [];
      }

      // Call ML API for prediction
      const response = await fetch(`${this.apiUrl}/predict-heart-attack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_data: request.patientData,
          historical_data: historicalData,
          user_id: request.userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction from ML service');
      }

      const result = await response.json();

      // Enhanced prediction based on historical data
      const enhancedResult: MLPredictionResponse = {
        prediction: {
          riskLevel: this.calculateRiskLevel(result.risk_score),
          riskScore: result.risk_score * 100,
          confidence: result.confidence * 100,
          prediction: result.risk_score > 0.5 ? 'Risk Detected' : 'No Risk'
        },
        explanation: result.explanation || this.generateExplanation(result.risk_score, request.patientData),
        recommendations: result.recommendations || this.generateRecommendations(result.risk_score, request.patientData),
        factorsAnalyzed: result.factors_analyzed || this.getAnalyzedFactors(request.patientData),
        modelVersion: result.model_version || 'v1.0.0'
      };

      // Save prediction to user's medical history
      if (request.userId) {
        await this.savePredictionToHistory(request.userId, request.patientData, enhancedResult);
      }

      return enhancedResult;

    } catch (error) {
      console.error('ML prediction error:', error);
      
      // Fallback to rule-based prediction
      return this.fallbackPrediction(request.patientData);
    }
  }

  private calculateRiskLevel(riskScore: number): 'Low' | 'Medium' | 'High' {
    if (riskScore < 0.3) return 'Low';
    if (riskScore < 0.7) return 'Medium';
    return 'High';
  }

  private generateExplanation(riskScore: number, patientData: any): string {
    const factors = [];
    
    if (patientData.age > 60) factors.push('advanced age');
    if (patientData.cholesterol > 240) factors.push('high cholesterol');
    if (patientData.bloodPressureSystolic > 140) factors.push('high blood pressure');
    if (patientData.smoking) factors.push('smoking history');
    if (patientData.diabetes) factors.push('diabetes');

    const riskLevel = this.calculateRiskLevel(riskScore);
    
    return `Based on the analysis of your health parameters, you have a ${riskLevel.toLowerCase()} risk of cardiovascular events. ${
      factors.length > 0 
        ? `Key contributing factors include: ${factors.join(', ')}.` 
        : 'Your current health indicators show favorable cardiovascular health.'
    }`;
  }

  private generateRecommendations(riskScore: number, patientData: any): string[] {
    const recommendations = [];

    if (patientData.cholesterol > 240) {
      recommendations.push('Consider dietary changes to reduce cholesterol levels');
    }
    if (patientData.bloodPressureSystolic > 140) {
      recommendations.push('Monitor and manage blood pressure through lifestyle changes');
    }
    if (patientData.smoking) {
      recommendations.push('Smoking cessation is highly recommended');
    }
    if (patientData.exerciseHours < 3) {
      recommendations.push('Increase physical activity to at least 150 minutes per week');
    }

    recommendations.push('Regular check-ups with your healthcare provider');
    recommendations.push('Maintain a heart-healthy diet rich in fruits and vegetables');

    return recommendations;
  }

  private getAnalyzedFactors(patientData: any): string[] {
    return [
      'Age and Gender',
      'Blood Pressure',
      'Cholesterol Levels',
      'Blood Sugar',
      'Lifestyle Factors',
      'Medical History',
      'Physical Activity',
      'BMI and Weight'
    ];
  }

  private async savePredictionToHistory(userId: string, patientData: any, prediction: MLPredictionResponse): Promise<void> {
    try {
      await supabase.from('medical_history').insert({
        user_id: userId,
        assessment_date: new Date().toISOString(),
        patient_data: patientData,
        prediction_result: prediction
      });
    } catch (error) {
      console.error('Failed to save prediction to history:', error);
    }
  }

  private fallbackPrediction(patientData: any): MLPredictionResponse {
    // Simple rule-based fallback
    let riskScore = 0.2;
    
    // Age factor
    if (patientData.age > 65) riskScore += 0.3;
    else if (patientData.age > 50) riskScore += 0.2;
    
    // Cholesterol
    if (patientData.cholesterol > 300) riskScore += 0.3;
    else if (patientData.cholesterol > 240) riskScore += 0.2;
    
    // Blood pressure
    if (patientData.bloodPressureSystolic > 160) riskScore += 0.3;
    else if (patientData.bloodPressureSystolic > 140) riskScore += 0.2;
    
    // Risk factors
    if (patientData.smoking) riskScore += 0.2;
    if (patientData.diabetes) riskScore += 0.2;
    if (patientData.familyHistory) riskScore += 0.1;

    riskScore = Math.min(riskScore, 0.95);

    return {
      prediction: {
        riskLevel: this.calculateRiskLevel(riskScore),
        riskScore: riskScore * 100,
        confidence: 75,
        prediction: riskScore > 0.5 ? 'Risk Detected' : 'No Risk'
      },
      explanation: this.generateExplanation(riskScore, patientData),
      recommendations: this.generateRecommendations(riskScore, patientData),
      factorsAnalyzed: this.getAnalyzedFactors(patientData),
      modelVersion: 'fallback-v1.0.0'
    };
  }

  async getUserDatasets(userId: string) {
    const { data, error } = await supabase
      .from('ml_datasets')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async getMedicalHistory(userId: string) {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('user_id', userId)
      .order('assessment_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }
}

export const mlService = new MLService();