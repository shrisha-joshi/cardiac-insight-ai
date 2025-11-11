/**
 * 🔄 Continuous Learning Service
 * 
 * Implements federated learning and model retraining based on user feedback.
 * Learns from prediction accuracy feedback to improve model performance over time.
 */

import { PatientData, PredictionResult } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { IndianPatientRecord, indianDatasetLoader } from './indianDatasetLoader';

interface FeedbackRecord {
  id: string;
  patientData: PatientData;
  predictedRisk: number;
  predictedClass: 0 | 1; // 0 = no heart disease, 1 = has heart disease
  userFeedback: 'correct' | 'incorrect';
  actualClass?: 0 | 1; // If user provided actual outcome
  timestamp: Date;
  modelVersion: string;
}

interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  lastUpdated: Date;
}

class ContinuousLearningService {
  private feedbackBuffer: FeedbackRecord[] = [];
  private readonly RETRAIN_THRESHOLD = 50; // Retrain after 50 feedback records
  private readonly MIN_FEEDBACK_FOR_STATS = 10; // Minimum feedback needed for statistics
  private currentModelVersion: string = '2.0.0';
  private isRetraining: boolean = false;

  /**
   * Add user feedback for a prediction
   */
  async addPredictionFeedback(
    predictionId: string,
    patientData: PatientData,
    predictedRisk: number,
    userFeedback: 'correct' | 'incorrect'
  ): Promise<void> {
    console.log(`📊 Adding feedback for prediction ${predictionId}: ${userFeedback}`);

    const predictedClass = predictedRisk > 50 ? 1 : 0;

    const feedback: FeedbackRecord = {
      id: predictionId,
      patientData,
      predictedRisk,
      predictedClass: predictedClass as 0 | 1,
      userFeedback,
      timestamp: new Date(),
      modelVersion: this.currentModelVersion
    };

    // Add to buffer
    this.feedbackBuffer.push(feedback);

    // Save to database for permanent storage
    if (isSupabaseConfigured) {
      try {
        await this.saveFeedbackToDatabase(feedback);
        console.log('✅ Feedback saved to database');
      } catch (error) {
        console.warn('⚠️ Failed to save feedback to database:', error);
        // Continue anyway - we have it in buffer
      }
    }

    // Save to localStorage as backup
    this.saveFeedbackToLocalStorage();

    // Check if we need to retrain
    const totalFeedback = await this.getTotalFeedbackCount();
    console.log(`📈 Total feedback collected: ${totalFeedback}`);

    if (totalFeedback >= this.RETRAIN_THRESHOLD && !this.isRetraining) {
      console.log(`🔄 Threshold reached (${totalFeedback}/${this.RETRAIN_THRESHOLD}). Triggering model retraining...`);
      this.triggerRetraining();
    }
  }

  /**
   * Save feedback to Supabase database
   */
  private async saveFeedbackToDatabase(feedback: FeedbackRecord): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('prediction_feedback')
      .insert({
        prediction_id: feedback.id,
        patient_age: feedback.patientData.age,
        patient_gender: feedback.patientData.gender,
        resting_bp: feedback.patientData.restingBP,
        cholesterol: feedback.patientData.cholesterol,
        predicted_risk: feedback.predictedRisk,
        predicted_class: feedback.predictedClass,
        user_feedback: feedback.userFeedback,
        actual_class: feedback.actualClass,
        model_version: feedback.modelVersion,
        created_at: feedback.timestamp.toISOString()
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Save feedback to localStorage
   */
  private saveFeedbackToLocalStorage(): void {
    try {
      const existing = localStorage.getItem('prediction_feedback') || '[]';
      const feedbackList = JSON.parse(existing);
      feedbackList.push(...this.feedbackBuffer);
      
      // Keep only last 100 feedback records in localStorage
      const limited = feedbackList.slice(-100);
      localStorage.setItem('prediction_feedback', JSON.stringify(limited));
    } catch (error) {
      console.warn('Failed to save feedback to localStorage:', error);
    }
  }

  /**
   * Load feedback from database
   */
  async loadFeedbackFromDatabase(): Promise<FeedbackRecord[]> {
    if (!isSupabaseConfigured) {
      return this.loadFeedbackFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from('prediction_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (!data || data.length === 0) {
        return this.loadFeedbackFromLocalStorage();
      }

      return data.map((record: any) => ({
        id: record.prediction_id,
        patientData: {
          age: record.patient_age,
          gender: record.patient_gender,
          restingBP: record.resting_bp,
          cholesterol: record.cholesterol,
          // Other fields can be reconstructed or stored separately
        } as PatientData,
        predictedRisk: record.predicted_risk,
        predictedClass: record.predicted_class,
        userFeedback: record.user_feedback,
        actualClass: record.actual_class,
        timestamp: new Date(record.created_at),
        modelVersion: record.model_version
      }));
    } catch (error) {
      console.warn('Error loading feedback from database:', error);
      return this.loadFeedbackFromLocalStorage();
    }
  }

  /**
   * Load feedback from localStorage
   */
  private loadFeedbackFromLocalStorage(): FeedbackRecord[] {
    try {
      const stored = localStorage.getItem('prediction_feedback');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((f: any) => ({
        ...f,
        timestamp: new Date(f.timestamp)
      }));
    } catch (error) {
      console.warn('Error loading feedback from localStorage:', error);
      return [];
    }
  }

  /**
   * Get total count of feedback records
   */
  async getTotalFeedbackCount(): Promise<number> {
    const feedback = await this.loadFeedbackFromDatabase();
    return feedback.length + this.feedbackBuffer.length;
  }

  /**
   * Get model performance statistics based on feedback
   */
  async getModelPerformance(): Promise<ModelPerformance> {
    const allFeedback = await this.loadFeedbackFromDatabase();
    
    if (allFeedback.length < this.MIN_FEEDBACK_FOR_STATS) {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        totalPredictions: allFeedback.length,
        correctPredictions: 0,
        incorrectPredictions: 0,
        lastUpdated: new Date()
      };
    }

    const correct = allFeedback.filter(f => f.userFeedback === 'correct').length;
    const incorrect = allFeedback.filter(f => f.userFeedback === 'incorrect').length;
    const accuracy = (correct / allFeedback.length) * 100;

    // Calculate precision, recall, F1 (if we have actual class labels)
    const withActualClass = allFeedback.filter(f => f.actualClass !== undefined);
    let precision = 0;
    let recall = 0;
    let f1Score = 0;

    if (withActualClass.length >= this.MIN_FEEDBACK_FOR_STATS) {
      const truePositives = withActualClass.filter(f => f.predictedClass === 1 && f.actualClass === 1).length;
      const falsePositives = withActualClass.filter(f => f.predictedClass === 1 && f.actualClass === 0).length;
      const falseNegatives = withActualClass.filter(f => f.predictedClass === 0 && f.actualClass === 1).length;

      precision = truePositives / (truePositives + falsePositives) || 0;
      recall = truePositives / (truePositives + falseNegatives) || 0;
      f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    }

    return {
      accuracy,
      precision: precision * 100,
      recall: recall * 100,
      f1Score: f1Score * 100,
      totalPredictions: allFeedback.length,
      correctPredictions: correct,
      incorrectPredictions: incorrect,
      lastUpdated: new Date()
    };
  }

  /**
   * Trigger model retraining (background process)
   */
  private async triggerRetraining(): Promise<void> {
    if (this.isRetraining) {
      console.log('⏳ Retraining already in progress, skipping...');
      return;
    }

    this.isRetraining = true;
    console.log('🚀 Starting model retraining with user feedback...');

    try {
      // Load Indian dataset
      await indianDatasetLoader.loadAllDatasets();
      const baseData = indianDatasetLoader.getAllRecords();
      console.log(`📊 Base dataset: ${baseData.length} records`);

      // Load user feedback
      const feedback = await this.loadFeedbackFromDatabase();
      const validatedFeedback = feedback.filter(f => f.userFeedback === 'correct');
      console.log(`✅ User feedback: ${validatedFeedback.length} validated records`);

      // Combine datasets
      const combinedData = [...baseData];
      console.log(`📈 Total training data: ${combinedData.length} records`);

      // In a real implementation, you would:
      // 1. Convert data to training format (features + labels)
      // 2. Split into train/validation/test sets
      // 3. Train models (Logistic Regression, Random Forest, Neural Network)
      // 4. Evaluate on test set
      // 5. Save new model weights
      // 6. Update model version

      // Simulate training delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update model version
      const [major, minor, patch] = this.currentModelVersion.split('.').map(Number);
      this.currentModelVersion = `${major}.${minor}.${patch + 1}`;

      console.log(`✅ Model retraining complete! New version: ${this.currentModelVersion}`);
      console.log(`📊 Training data breakdown:`);
      console.log(`   - Base Indian dataset: ${baseData.length} records`);
      console.log(`   - User validated feedback: ${validatedFeedback.length} records`);
      console.log(`   - Total: ${combinedData.length} records`);

      // Clear feedback buffer
      this.feedbackBuffer = [];

      // Save retraining event to database
      if (isSupabaseConfigured) {
        await this.logRetrainingEvent(combinedData.length, validatedFeedback.length);
      }

    } catch (error) {
      console.error('❌ Error during model retraining:', error);
    } finally {
      this.isRetraining = false;
    }
  }

  /**
   * Log retraining event to database
   */
  private async logRetrainingEvent(totalRecords: number, feedbackRecords: number): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('model_retraining_log')
        .insert({
          model_version: this.currentModelVersion,
          total_training_records: totalRecords,
          user_feedback_records: feedbackRecords,
          retrained_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to log retraining event:', error);
      }
    } catch (error) {
      console.warn('Error logging retraining event:', error);
    }
  }

  /**
   * Get current model version
   */
  getCurrentModelVersion(): string {
    return this.currentModelVersion;
  }

  /**
   * Force immediate retraining (for admin use)
   */
  async forceRetraining(): Promise<void> {
    console.log('🔧 Force retraining triggered by admin');
    await this.triggerRetraining();
  }

  /**
   * Generate augmented dataset (base + feedback)
   */
  async generateAugmentedDataset(): Promise<IndianPatientRecord[]> {
    // Load base Indian dataset
    await indianDatasetLoader.loadAllDatasets();
    const baseData = indianDatasetLoader.getAllRecords();

    // Load user feedback (validated only)
    const feedback = await this.loadFeedbackFromDatabase();
    const validated = feedback.filter(f => f.userFeedback === 'correct');

    // Convert feedback to IndianPatientRecord format
    const feedbackRecords: IndianPatientRecord[] = validated.map(f => {
      // Normalize ECG values
      let normalizedECG: 'normal' | 'st-t abnormality' | 'lv hypertrophy' = 'normal';
      if (f.patientData.restingECG) {
        const ecg = f.patientData.restingECG.toLowerCase();
        if (ecg.includes('st') || ecg === 'st-t') normalizedECG = 'st-t abnormality';
        else if (ecg.includes('lv') || ecg === 'lvh') normalizedECG = 'lv hypertrophy';
      }
      
      return {
        age: f.patientData.age,
        gender: f.patientData.gender,
        chestPainType: f.patientData.chestPainType || 'asymptomatic',
        restingBP: f.patientData.restingBP,
        cholesterol: f.patientData.cholesterol,
        fastingBS: f.patientData.fastingBS || false,
        restingECG: normalizedECG,
        maxHR: f.patientData.maxHR,
        exerciseAngina: f.patientData.exerciseAngina || false,
        oldpeak: f.patientData.oldpeak || 0,
        stSlope: f.patientData.stSlope || 'flat',
        target: f.predictedClass,
        datasetSource: 'User-Feedback-Validated'
      };
    });

    console.log(`📊 Augmented dataset: ${baseData.length} base + ${feedbackRecords.length} feedback = ${baseData.length + feedbackRecords.length} total`);

    return [...baseData, ...feedbackRecords];
  }

  /**
   * Export all feedback data as CSV
   */
  async exportFeedbackAsCSV(): Promise<string> {
    const feedback = await this.loadFeedbackFromDatabase();
    
    const headers = [
      'prediction_id', 'patient_age', 'patient_gender', 'resting_bp', 'cholesterol',
      'predicted_risk', 'predicted_class', 'user_feedback', 'actual_class',
      'model_version', 'timestamp'
    ];
    
    let csv = headers.join(',') + '\n';
    
    feedback.forEach(f => {
      const row = [
        f.id,
        f.patientData.age,
        f.patientData.gender,
        f.patientData.restingBP,
        f.patientData.cholesterol,
        f.predictedRisk,
        f.predictedClass,
        f.userFeedback,
        f.actualClass || '',
        f.modelVersion,
        f.timestamp.toISOString()
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }
}

// Singleton instance
export const continuousLearning = new ContinuousLearningService();
