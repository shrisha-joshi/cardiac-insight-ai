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