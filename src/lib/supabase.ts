import { createClient } from '@supabase/supabase-js'
import { PatientData, PredictionResult } from './mockData'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client with fallback for development and proper session configuration
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          date_of_birth: string | null
          phone: string | null
          emergency_contact: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          date_of_birth?: string | null
          phone?: string | null
          emergency_contact?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          date_of_birth?: string | null
          phone?: string | null
          emergency_contact?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medical_history: {
        Row: {
          id: string
          user_id: string
          assessment_date: string
          patient_data: PatientData
          prediction_result: PredictionResult
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assessment_date: string
          patient_data: PatientData
          prediction_result: PredictionResult
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assessment_date?: string
          patient_data?: PatientData
          prediction_result?: PredictionResult
          created_at?: string
        }
      }
      ml_datasets: {
        Row: {
          id: string
          user_id: string
          dataset_name: string
          file_path: string
          file_type: string
          upload_date: string
          processing_status: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          user_id: string
          dataset_name: string
          file_path: string
          file_type: string
          upload_date?: string
          processing_status?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          dataset_name?: string
          file_path?: string
          file_type?: string
          upload_date?: string
          processing_status?: string
          metadata?: Record<string, unknown>
        }
      }
    }
  }
}

/**
 * Save prediction to database (permanent storage)
 */
export async function savePredictionToDatabase(
  userId: string,
  patientData: any,
  predictionResult: any
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    const { data, error } = await supabase
      .from('ml_predictions')
      .insert({
        user_id: userId,
        created_at: new Date().toISOString(),
        patient_age: patientData.age || 0,
        patient_gender: patientData.gender || '',
        resting_bp: patientData.restingBP || 0,
        cholesterol: patientData.cholesterol || 0,
        blood_sugar_fasting: patientData.fastingBS || false,
        max_heart_rate: patientData.maxHR || 0,
        exercise_induced_angina: patientData.exerciseAngina || false,
        oldpeak: patientData.oldpeak || 0,
        st_slope: patientData.stSlope || '',
        num_major_vessels: patientData.num_major_vessels || 0,
        thalassemia: patientData.thalassemia || '',
        risk_level: predictionResult.riskLevel,
        risk_score: Math.round(predictionResult.riskScore),
        confidence: Math.round(predictionResult.confidence),
        prediction: predictionResult.prediction,
        model_name: 'Logistic Regression',
        model_version: '1.0.0',
        algorithm_used: 'Logistic Regression',
        model_accuracy_at_time: 85.7,
        explanation: predictionResult.explanation || '',
        recommendations: predictionResult.recommendations || []
      })
      .select()
      .single();

    if (error) {
      console.error('Database save error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Prediction saved to database:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Save prediction error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Load predictions from database
 */
export async function loadPredictionsFromDatabase(userId: string): Promise<any[]> {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load predictions error:', error);
      return [];
    }

    console.log('✅ Loaded predictions from database:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Load predictions error:', error);
    return [];
  }
}

export const supabaseAuth = supabase.auth;
export default supabase;