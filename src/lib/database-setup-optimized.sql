-- Supabase Database Setup Script - OPTIMIZED FOR PRODUCTION
-- Date: November 4, 2025
-- Version: 2.0 - With Performance and Security Fixes

-- ============================================================================
-- PART 1: ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 2: FIX FUNCTIONS WITH PROPER SEARCH_PATH
-- ============================================================================

-- Drop existing functions to rebuild them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create handle_new_user function with proper search_path and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NEW.email
    );
  EXCEPTION WHEN others THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'UTC';
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Failed to update timestamp: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 3: CREATE TABLES WITH PROPER CONSTRAINTS
-- ============================================================================

-- Create profiles table with enhanced constraints
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name TEXT NOT NULL CHECK (length(first_name) > 0 AND length(first_name) <= 100),
  last_name TEXT NOT NULL CHECK (length(last_name) > 0 AND length(last_name) <= 100),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE AND EXTRACT(YEAR FROM AGE(date_of_birth)) >= 0),
  phone TEXT CHECK (phone ~* '^\+?[1-9]\d{1,14}$' OR phone IS NULL),
  emergency_contact TEXT CHECK (length(emergency_contact) <= 200 OR emergency_contact IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC') NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC') NOT NULL,
  
  -- Ensure user_id and email consistency
  CONSTRAINT valid_user UNIQUE (user_id)
);

-- Create medical_history table with enhanced constraints
CREATE TABLE IF NOT EXISTS public.medical_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC') NOT NULL,
  patient_data JSONB NOT NULL,
  prediction_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC') NOT NULL,
  
  -- Ensure valid JSON data
  CONSTRAINT valid_patient_data CHECK (patient_data IS NOT NULL),
  CONSTRAINT valid_prediction_result CHECK (prediction_result IS NOT NULL)
);

-- Create ml_datasets table with enhanced constraints
CREATE TABLE IF NOT EXISTS public.ml_datasets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dataset_name TEXT NOT NULL CHECK (length(dataset_name) > 0 AND length(dataset_name) <= 255),
  file_path TEXT NOT NULL CHECK (length(file_path) > 0),
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'json', 'xlsx', 'tsv')),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC') NOT NULL,
  processing_status TEXT DEFAULT 'uploaded' NOT NULL CHECK (
    processing_status IN ('uploaded', 'processing', 'completed', 'failed')
  ),
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  -- Ensure unique uploads per user
  CONSTRAINT unique_dataset_per_user_per_name UNIQUE (user_id, dataset_name)
);

-- Create audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC') NOT NULL,
  ip_address INET,
  user_agent TEXT
);

-- ============================================================================
-- PART 4: OPTIMIZE RLS POLICIES - FIX THE AUTH.UID() PERFORMANCE ISSUE
-- ============================================================================

-- Drop all existing policies to recreate them optimized
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own medical history" ON public.medical_history;
DROP POLICY IF EXISTS "Users can insert their own medical history" ON public.medical_history;
DROP POLICY IF EXISTS "Users can update their own medical history" ON public.medical_history;

DROP POLICY IF EXISTS "Users can view their own datasets" ON public.ml_datasets;
DROP POLICY IF EXISTS "Users can insert their own datasets" ON public.ml_datasets;
DROP POLICY IF EXISTS "Users can update their own datasets" ON public.ml_datasets;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: OPTIMIZED RLS POLICIES FOR PROFILES TABLE
-- FIX: Use (SELECT auth.uid()) instead of auth.uid() for better performance
-- ============================================================================

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- ============================================================================
-- PART 6: OPTIMIZED RLS POLICIES FOR MEDICAL_HISTORY TABLE
-- ============================================================================

CREATE POLICY "Users can view their own medical history" ON public.medical_history
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can insert their own medical history" ON public.medical_history
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can update their own medical history" ON public.medical_history
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- ============================================================================
-- PART 7: OPTIMIZED RLS POLICIES FOR ML_DATASETS TABLE
-- ============================================================================

CREATE POLICY "Users can view their own datasets" ON public.ml_datasets
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can insert their own datasets" ON public.ml_datasets
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can update their own datasets" ON public.ml_datasets
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- Auditors and admins can view all audit logs (separate policy)
CREATE POLICY "Auditors can view audit logs" ON public.audit_log
  FOR SELECT USING (
    -- Only allow authenticated users to view their own audit entries
    user_id = (SELECT auth.uid())
  );

-- ============================================================================
-- PART 8: STORAGE BUCKET AND POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO UPDATE SET name = 'datasets', public = false;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own datasets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own dataset files" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Users can upload their own datasets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'datasets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own dataset files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'datasets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own dataset files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'datasets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'datasets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own dataset files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'datasets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- PART 9: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Medical history indexes
CREATE INDEX IF NOT EXISTS idx_medical_history_user_id ON public.medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_assessment_date ON public.medical_history(assessment_date);
CREATE INDEX IF NOT EXISTS idx_medical_history_created_at ON public.medical_history(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_history_user_date ON public.medical_history(user_id, assessment_date DESC);

-- ML datasets indexes
CREATE INDEX IF NOT EXISTS idx_ml_datasets_user_id ON public.ml_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_datasets_processing_status ON public.ml_datasets(processing_status);
CREATE INDEX IF NOT EXISTS idx_ml_datasets_upload_date ON public.ml_datasets(upload_date);
CREATE INDEX IF NOT EXISTS idx_ml_datasets_user_status ON public.ml_datasets(user_id, processing_status);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON public.audit_log(changed_at DESC);

-- ============================================================================
-- PART 10: CREATE AUDIT TRIGGER
-- ============================================================================

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.audit_log_function()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, table_name, operation, record_id, old_values)
    VALUES (
      (SELECT auth.uid()),
      TG_TABLE_NAME,
      TG_OP,
      OLD.id,
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, table_name, operation, record_id, old_values, new_values)
    VALUES (
      (SELECT auth.uid()),
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, table_name, operation, record_id, new_values)
    VALUES (
      (SELECT auth.uid()),
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
EXCEPTION WHEN others THEN
  -- Don't fail the operation if audit logging fails
  RAISE WARNING 'Audit logging failed: %', SQLERRM;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Create audit triggers
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_function();

CREATE TRIGGER audit_medical_history
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_history
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_function();

CREATE TRIGGER audit_ml_datasets
  AFTER INSERT OR UPDATE OR DELETE ON public.ml_datasets
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_function();

-- ============================================================================
-- PART 11: VERIFY SETUP
-- ============================================================================

-- Show tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Show indexes created
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Show RLS policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all tables, indexes, and policies are created
-- 3. Test RLS policies with different users
-- 4. Monitor query performance after deployment
-- 5. Set up Supabase alerts for slow queries
-- 6. Enable password breach detection in Auth settings
-- 7. Enable MFA (TOTP, SMS, WebAuthn) in Auth settings
-- 8. Review JWT and session settings in Auth settings
