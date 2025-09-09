import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client with fallback for development
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

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
          patient_data: any
          prediction_result: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assessment_date: string
          patient_data: any
          prediction_result: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assessment_date?: string
          patient_data?: any
          prediction_result?: any
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
          metadata: any
        }
        Insert: {
          id?: string
          user_id: string
          dataset_name: string
          file_path: string
          file_type: string
          upload_date?: string
          processing_status?: string
          metadata?: any
        }
        Update: {
          id?: string
          user_id?: string
          dataset_name?: string
          file_path?: string
          file_type?: string
          upload_date?: string
          processing_status?: string
          metadata?: any
        }
      }
    }
  }
}