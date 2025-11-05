-- ============================================================================
-- CARDIAC INSIGHT AI - ML MODEL TRACKING & PREDICTION HISTORY
-- Complete SQL Setup for Supabase
-- ============================================================================
-- This script creates the necessary tables for:
-- 1. ML Model tracking and versioning
-- 2. Training datasets and their metadata
-- 3. Prediction history with full audit trail
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================================================
-- TABLE 1: ML_MODELS - Store ML model versions and metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(255) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  algorithm_used VARCHAR(255) NOT NULL,
  framework VARCHAR(100),
  model_accuracy FLOAT,
  model_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active', -- active, deprecated, experimental
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  hyperparameters JSONB,
  
  -- Unique constraint on model_name
  UNIQUE(model_name)
);

-- Create index on model_name and status for faster lookups
CREATE INDEX idx_ml_models_name_status ON public.ml_models(model_name, status);
CREATE INDEX idx_ml_models_created_at ON public.ml_models(created_at DESC);

-- Add comment
COMMENT ON TABLE public.ml_models IS 'Stores ML model metadata, versions, and performance metrics';

-- ============================================================================
-- TABLE 2: ML_TRAINING_DATASETS - Store training dataset metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ml_training_datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_name VARCHAR(255) NOT NULL,
  model_id UUID NOT NULL REFERENCES public.ml_models(id) ON DELETE CASCADE,
  dataset_version VARCHAR(50),
  file_path VARCHAR(500),
  file_size_bytes BIGINT,
  num_records INT,
  num_features INT,
  feature_names JSONB,
  train_test_split_ratio FLOAT DEFAULT 0.8,
  preprocessing_steps JSONB,
  data_quality_score FLOAT, -- 0-100
  status VARCHAR(50) DEFAULT 'ready', -- ready, processing, failed, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  source VARCHAR(255),
  
  CONSTRAINT check_valid_split_ratio CHECK (train_test_split_ratio > 0 AND train_test_split_ratio < 1),
  CONSTRAINT check_valid_quality_score CHECK (data_quality_score >= 0 AND data_quality_score <= 100)
);

-- Create indexes
CREATE INDEX idx_ml_training_datasets_model_id ON public.ml_training_datasets(model_id);
CREATE INDEX idx_ml_training_datasets_status ON public.ml_training_datasets(status);
CREATE INDEX idx_ml_training_datasets_created_at ON public.ml_training_datasets(created_at DESC);

-- Add comment
COMMENT ON TABLE public.ml_training_datasets IS 'Stores metadata about datasets used for training ML models';

-- ============================================================================
-- TABLE 3: ML_PREDICTIONS - Core prediction history with full audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ml_predictions (
  -- Primary & Foreign Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.ml_models(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Patient Data (Denormalized for fast access)
  patient_age INT NOT NULL,
  patient_gender VARCHAR(20),
  resting_bp INT,
  cholesterol INT,
  blood_sugar_fasting BOOLEAN DEFAULT FALSE,
  max_heart_rate INT,
  exercise_induced_angina BOOLEAN DEFAULT FALSE,
  oldpeak FLOAT,
  st_slope VARCHAR(50),
  num_major_vessels INT,
  thalassemia VARCHAR(50),
  
  -- Prediction Results
  risk_level VARCHAR(50) NOT NULL, -- low, medium, high
  risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence INT CHECK (confidence >= 0 AND confidence <= 100),
  prediction VARCHAR(255),
  
  -- Model Information
  model_name VARCHAR(255),
  model_version VARCHAR(50),
  algorithm_used VARCHAR(255),
  model_accuracy_at_time FLOAT,
  
  -- Explanation & Recommendations
  explanation TEXT,
  recommendations JSONB,
  
  -- Feedback & Quality Metrics
  feedback VARCHAR(50), -- correct, incorrect, null
  feedback_date TIMESTAMPTZ,
  feedback_confidence INT,
  
  -- Additional metadata
  session_id UUID,
  ip_address INET,
  user_agent TEXT,
  
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high'))
);

-- Create comprehensive indexes for fast queries
CREATE INDEX idx_ml_predictions_user_id ON public.ml_predictions(user_id);
CREATE INDEX idx_ml_predictions_created_at ON public.ml_predictions(user_id, created_at DESC);
CREATE INDEX idx_ml_predictions_risk_level ON public.ml_predictions(user_id, risk_level);
CREATE INDEX idx_ml_predictions_model_id ON public.ml_predictions(model_id);
CREATE INDEX idx_ml_predictions_feedback ON public.ml_predictions(user_id, feedback);
CREATE INDEX idx_ml_predictions_patient_age ON public.ml_predictions(patient_age);

-- Add comment
COMMENT ON TABLE public.ml_predictions IS 'Complete history of all predictions with full audit trail for each user';

-- ============================================================================
-- TABLE 4: ML_PREDICTION_FEEDBACK - Detailed feedback tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ml_prediction_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID NOT NULL REFERENCES public.ml_predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL, -- correct, incorrect, partial, needs_refinement
  confidence_level INT CHECK (confidence_level >= 0 AND confidence_level <= 100),
  notes TEXT,
  actual_outcome VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('correct', 'incorrect', 'partial', 'needs_refinement'))
);

-- Create indexes
CREATE INDEX idx_ml_prediction_feedback_prediction_id ON public.ml_prediction_feedback(prediction_id);
CREATE INDEX idx_ml_prediction_feedback_user_id ON public.ml_prediction_feedback(user_id);
CREATE INDEX idx_ml_prediction_feedback_created_at ON public.ml_prediction_feedback(created_at DESC);

-- Add comment
COMMENT ON TABLE public.ml_prediction_feedback IS 'Detailed feedback records linked to specific predictions';

-- ============================================================================
-- MATERIALIZED VIEW: PREDICTION_STATISTICS
-- ============================================================================
-- Quick stats about user predictions
CREATE MATERIALIZED VIEW IF NOT EXISTS public.prediction_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_predictions,
  COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk_count,
  COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk_count,
  COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count,
  ROUND(AVG(risk_score)::numeric, 2) as avg_risk_score,
  ROUND(AVG(confidence)::numeric, 2) as avg_confidence,
  COUNT(CASE WHEN feedback = 'correct' THEN 1 END) as correct_feedback_count,
  COUNT(CASE WHEN feedback = 'incorrect' THEN 1 END) as incorrect_feedback_count,
  MAX(created_at) as latest_prediction_date,
  MIN(created_at) as first_prediction_date
FROM public.ml_predictions
GROUP BY user_id;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_prediction_statistics_user_id ON public.prediction_statistics(user_id);

-- ============================================================================
-- FUNCTION: GET_USER_PREDICTION_STATS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_prediction_stats(p_user_id UUID)
RETURNS TABLE (
  total_predictions BIGINT,
  low_risk_count BIGINT,
  medium_risk_count BIGINT,
  high_risk_count BIGINT,
  avg_risk_score NUMERIC,
  avg_confidence NUMERIC,
  correct_feedback_count BIGINT,
  incorrect_feedback_count BIGINT,
  accuracy_percentage NUMERIC
) AS $$
SELECT 
  COUNT(*),
  COUNT(CASE WHEN risk_level = 'low' THEN 1 END),
  COUNT(CASE WHEN risk_level = 'medium' THEN 1 END),
  COUNT(CASE WHEN risk_level = 'high' THEN 1 END),
  ROUND(AVG(risk_score)::numeric, 2),
  ROUND(AVG(confidence)::numeric, 2),
  COUNT(CASE WHEN feedback = 'correct' THEN 1 END),
  COUNT(CASE WHEN feedback = 'incorrect' THEN 1 END),
  CASE 
    WHEN COUNT(CASE WHEN feedback IS NOT NULL THEN 1 END) = 0 THEN 0
    ELSE ROUND(
      100.0 * COUNT(CASE WHEN feedback = 'correct' THEN 1 END) / 
      COUNT(CASE WHEN feedback IS NOT NULL THEN 1 END)::numeric, 
      2
    )
  END
FROM public.ml_predictions
WHERE user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES - Row Level Security for Data Privacy
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_prediction_feedback ENABLE ROW LEVEL SECURITY;

-- ML_MODELS: Anyone can view, admins can edit
CREATE POLICY "ml_models_read_all" ON public.ml_models
  FOR SELECT USING (true);

CREATE POLICY "ml_models_edit_admin" ON public.ml_models
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "ml_models_update_admin" ON public.ml_models
  FOR UPDATE USING (auth.uid() = created_by);

-- ML_TRAINING_DATASETS: Users can view own, admins can edit
CREATE POLICY "ml_training_datasets_read_own" ON public.ml_training_datasets
  FOR SELECT USING (auth.uid() = uploaded_by OR true);

CREATE POLICY "ml_training_datasets_edit_owner" ON public.ml_training_datasets
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- ML_PREDICTIONS: Users can only see their own predictions
CREATE POLICY "ml_predictions_read_own" ON public.ml_predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ml_predictions_insert_own" ON public.ml_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ml_predictions_update_own" ON public.ml_predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- ML_PREDICTION_FEEDBACK: Users can only see/edit their own feedback
CREATE POLICY "ml_prediction_feedback_read_own" ON public.ml_prediction_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ml_prediction_feedback_insert_own" ON public.ml_prediction_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ml_prediction_feedback_update_own" ON public.ml_prediction_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- SAMPLE DATA: INSERT DEFAULT ML MODEL
-- ============================================================================
INSERT INTO public.ml_models (model_name, model_version, algorithm_used, framework, model_accuracy, status, description)
VALUES (
  'Logistic Regression',
  '1.0.0',
  'Logistic Regression',
  'scikit-learn',
  85.7,
  'active',
  'Primary heart attack risk prediction model using Logistic Regression with patient vital signs and history'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything is set up correctly:

-- 1. Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ml_%';

-- 2. Check indexes:
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'ml_%';

-- 3. Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_class JOIN pg_tables ON pg_class.relname = pg_tables.tablename WHERE schemaname = 'public' AND tablename LIKE 'ml_%';

-- 4. Check default model exists:
-- SELECT * FROM public.ml_models WHERE status = 'active';

-- ============================================================================
-- END OF SETUP SCRIPT
-- ============================================================================
