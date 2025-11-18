import { useState, useEffect, useCallback } from 'react';
import { PredictionResult, mockPredictions } from '@/lib/mockData';
import { useAuth } from './useAuth';
import { supabase, loadPredictionsFromDatabase, isSupabaseConfigured } from '@/lib/supabase';
import config from '@/lib/config';

const STORAGE_KEY_PREFIX = 'cardiac_insight_user_';
const MAX_HISTORY_ITEMS = 100; // Maximum predictions to store

// Extended prediction with feedback
export interface PredictionWithFeedback extends PredictionResult {
  feedback?: 'correct' | 'incorrect' | null;
  feedbackDate?: string;
}

interface UsePredictionHistoryReturn {
  userId: string;
  predictions: PredictionWithFeedback[];
  addPrediction: (prediction: PredictionResult) => void;
  removePrediction: (id: string) => void;
  clearHistory: () => void;
  exportHistory: () => string;
  importHistory: (data: string) => boolean;
  addFeedback: (predictionId: string, feedback: 'correct' | 'incorrect') => void;
  getFeedbackStats: () => { correct: number; incorrect: number; total: number };
  isLoading: boolean;
}

/**
 * Transform database prediction record to PredictionWithFeedback format
 */
function transformDatabasePrediction(dbPred: unknown): PredictionWithFeedback {
  const pred = dbPred as Record<string, unknown>;
  return {
    id: pred.id as string,
    timestamp: new Date(pred.created_at as string),
    riskLevel: ((pred.risk_level as string) || 'low').toLowerCase() as 'low' | 'medium' | 'high',
    riskScore: (pred.risk_score as number) || 0,
    confidence: (pred.confidence as number) || 0,
    prediction: ((pred.prediction as string) || 'No Risk') as 'No Risk' | 'Risk',
    explanation: (pred.explanation as string) || '',
    recommendations: (pred.recommendations as string[]) || [],
    patientData: {
      age: pred.patient_age as number,
      gender: ((pred.patient_gender as 'male' | 'female') || 'male'),
      chestPainType: 'typical',
      restingBP: (pred.resting_bp as number) || 120,
      cholesterol: (pred.cholesterol as number) || 200,
      fastingBS: (pred.blood_sugar_fasting as boolean) || false,
      restingECG: 'normal',
      maxHR: (pred.max_heart_rate as number) || 150,
      exerciseAngina: (pred.exercise_induced_angina as boolean) || false,
      oldpeak: (pred.oldpeak as number) || 0,
      stSlope: ((pred.st_slope as 'up' | 'flat' | 'down') || 'flat'),
      smoking: false,
      diabetes: false,
      previousHeartAttack: false,
      cholesterolMedication: false,
      diabetesMedication: 'none',
      bpMedication: false,
      lifestyleChanges: false,
      dietType: 'non-vegetarian',
      stressLevel: 5,
      sleepHours: 7,
      physicalActivity: 'moderate'
    },
    feedback: null,
    feedbackDate: undefined
  };
}

export function usePredictionHistory(): UsePredictionHistoryReturn {
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [predictions, setPredictions] = useState<PredictionWithFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 FIXED: Real-time database refresh on new predictions
  const reloadPredictionsFromDatabase = useCallback(async (currentUserId: string) => {
    if (!currentUserId || !isSupabaseConfigured) return;
    
    try {
      if (import.meta.env.DEV) console.log('🔄 Refreshing predictions from database...');
      const dbPredictions = await loadPredictionsFromDatabase(currentUserId);
      
      if (dbPredictions && dbPredictions.length > 0) {
        const transformed = dbPredictions.map(transformDatabasePrediction);
        if (import.meta.env.DEV) console.log(`✅ Refreshed ${transformed.length} predictions from database`);
        setPredictions(transformed);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('⚠️ Error refreshing from database:', error);
    }
  }, []);

  // Fetch from ML backend history if configured
  const loadHistoryFromBackend = useCallback(async (currentUserId: string) => {
    if (!config.mlApi.enabled || !config.mlApi.baseUrl) return [] as PredictionWithFeedback[];
    try {
      const res = await fetch(`${config.mlApi.baseUrl.replace(/\/$/, '')}/history/${currentUserId}?limit=${MAX_HISTORY_ITEMS}`);
      if (!res.ok) return [] as PredictionWithFeedback[];
      const data = await res.json() as { predictions?: Array<Record<string, unknown>> };
      const records = Array.isArray(data?.predictions) ? data.predictions : [];
      const mapped: PredictionWithFeedback[] = records.map((r) => {
        const rec = r as Record<string, unknown>;
        return {
          id: String(rec.id ?? crypto.randomUUID()),
          timestamp: new Date(String(rec.created_at ?? new Date().toISOString())),
          riskLevel: String(rec.risk_level ?? 'low') as 'low' | 'medium' | 'high',
          riskScore: Number(rec.risk_score ?? 0),
          confidence: Number(rec.confidence ?? 0),
          prediction: (String(rec.prediction ?? 'No Risk') as 'No Risk' | 'Risk'),
          explanation: String(rec.explanation ?? ''),
          recommendations: (rec.recommendations as string[]) ?? [],
          patientData: {
            age: Number(rec.patient_age ?? 0),
            gender: (String(rec.patient_gender ?? 'male') as 'male' | 'female'),
            chestPainType: 'typical',
            restingBP: Number(rec.resting_bp ?? 120),
            cholesterol: Number(rec.cholesterol ?? 200),
            fastingBS: Boolean(rec.blood_sugar_fasting ?? false),
            restingECG: 'normal',
            maxHR: Number(rec.max_heart_rate ?? 150),
            exerciseAngina: Boolean(rec.exercise_induced_angina ?? false),
            oldpeak: Number(rec.oldpeak ?? 0),
            stSlope: 'flat',
            smoking: false,
            diabetes: false,
            previousHeartAttack: false,
            cholesterolMedication: false,
            diabetesMedication: 'none',
            bpMedication: false,
            lifestyleChanges: false,
            dietType: 'non-vegetarian',
            stressLevel: 5,
            sleepHours: 7,
            physicalActivity: 'moderate'
          },
          feedback: null,
          feedbackDate: undefined
        };
      });
      return mapped;
    } catch {
      return [] as PredictionWithFeedback[];
    }
  }, []);

  // Initialize user ID and load predictions from database/backend
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        
        if (import.meta.env.DEV) {
          console.log('🔄 usePredictionHistory: Initializing...', {
            hasUser: !!user,
            userId: user?.id?.substring(0, 20),
            isSupabaseConfigured,
            authLoading
          });
        }
        
        // Use authenticated user ID from Supabase
        if (user?.id) {
          setUserId(user.id);
          
          // 🔥 Try ML backend history first if available
          if (config.mlApi.enabled) {
            try {
              if (import.meta.env.DEV) console.log('📥 Loading predictions from ML API history...');
              const backendPreds = await loadHistoryFromBackend(user.id);
              if (backendPreds.length > 0) {
                setPredictions(backendPreds);
                return;
              }
            } catch (error) {
              if (import.meta.env.DEV) console.warn('⚠️ Error loading from ML API history:', error);
            }
          }

          // Then try to load from Supabase database
          if (isSupabaseConfigured) {
            try {
              if (import.meta.env.DEV) console.log('📥 Loading predictions from Supabase database...');
              const startTime = performance.now();
              const dbPredictions = await loadPredictionsFromDatabase(user.id);
              const loadTime = performance.now() - startTime;
              
              if (import.meta.env.DEV) {
                console.log(`⏱️ Database load time: ${loadTime.toFixed(0)}ms`);
              }
              
              if (dbPredictions && dbPredictions.length > 0) {
                // Transform database records to our format
                const transformed = dbPredictions.map(transformDatabasePrediction);
                if (import.meta.env.DEV) {
                  console.log(`✅ Loaded ${transformed.length} predictions from database`, {
                    firstPrediction: transformed[0] ? {
                      id: transformed[0].id,
                      riskLevel: transformed[0].riskLevel,
                      timestamp: transformed[0].timestamp
                    } : null
                  });
                }
                setPredictions(transformed);
                return; // Exit - we have data from database
              } else {
                if (import.meta.env.DEV) console.log('ℹ️ No predictions found in database');
              }
            } catch (error) {
              if (import.meta.env.DEV) console.warn('⚠️ Error loading from database, falling back to localStorage:', error);
            }
          } else {
            if (import.meta.env.DEV) console.warn('⚠️ Supabase not configured - using localStorage only');
          }
          
          // Fallback: Load from localStorage if database is unavailable
          if (import.meta.env.DEV) console.log('📦 Loading predictions from localStorage...');
          const storageKey = STORAGE_KEY_PREFIX + user.id;
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            const parsed = JSON.parse(stored);
            // Convert timestamp strings back to Date objects
            const converted = parsed.map((p: unknown) => {
              const pred = p as Record<string, unknown>;
              return {
                ...pred,
                timestamp: new Date(pred.timestamp as string)
              };
            });
            if (import.meta.env.DEV) console.log(`✅ Loaded ${converted.length} predictions from localStorage`);
            setPredictions(converted);
          } else {
            // No history for this user yet
            if (import.meta.env.DEV) console.log('ℹ️ No prediction history found');
            setPredictions([]);
          }
        } else {
          // Not authenticated yet
          setUserId('');
          setPredictions([]);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error initializing user:', error);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      initializeUser();
    }
  }, [user, authLoading, reloadPredictionsFromDatabase, loadHistoryFromBackend]);

  // Save predictions to localStorage for this user
  const savePredictionsToStorage = useCallback((preds: PredictionWithFeedback[]) => {
    if (!userId) return;
    
    try {
      const storageKey = STORAGE_KEY_PREFIX + userId;
      localStorage.setItem(storageKey, JSON.stringify(preds));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving predictions to storage:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        if (import.meta.env.DEV) console.warn('LocalStorage quota exceeded. Keeping only last 50 predictions.');
        const limited = preds.slice(0, 50);
        const storageKey = STORAGE_KEY_PREFIX + userId;
        localStorage.setItem(storageKey, JSON.stringify(limited));
      }
    }
  }, [userId]);

  // Add new prediction
  const addPrediction = useCallback((prediction: PredictionResult) => {
    setPredictions(prev => {
      // Convert to prediction with feedback
      const predictionWithFeedback: PredictionWithFeedback = {
        ...prediction,
        feedback: null
      };
      
      // Add new prediction to the beginning
      const updated = [predictionWithFeedback, ...prev];
      
      // Keep only the last MAX_HISTORY_ITEMS predictions
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      savePredictionsToStorage(limited);
      
      return limited;
    });
    
    // 🔥 FIXED: Refresh from database after prediction added
    // This ensures the UI shows the newly saved prediction from database
    if (userId && isSupabaseConfigured) {
      // Use setTimeout to allow database to process the insert
      setTimeout(() => {
        reloadPredictionsFromDatabase(userId);
      }, 500);
    }
  }, [savePredictionsToStorage, userId, reloadPredictionsFromDatabase]);

  // Remove prediction by id
  const removePrediction = useCallback((id: string) => {
    setPredictions(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePredictionsToStorage(updated);
      return updated;
    });
  }, [savePredictionsToStorage]);

  // Clear all history for this user
  const clearHistory = useCallback(() => {
    setPredictions([]);
    try {
      if (userId) {
        const storageKey = STORAGE_KEY_PREFIX + userId;
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error clearing history:', error);
    }
  }, [userId]);

  // Add feedback to a prediction
  const addFeedback = useCallback((predictionId: string, feedback: 'correct' | 'incorrect') => {
    setPredictions(prev => {
      const updated = prev.map(p => 
        p.id === predictionId 
          ? { 
              ...p, 
              feedback, 
              feedbackDate: new Date().toISOString() 
            }
          : p
      );
      savePredictionsToStorage(updated);
      return updated;
    });
  }, [savePredictionsToStorage]);

  // Get feedback statistics
  const getFeedbackStats = useCallback(() => {
    const correct = predictions.filter(p => p.feedback === 'correct').length;
    const incorrect = predictions.filter(p => p.feedback === 'incorrect').length;
    const total = predictions.length;
    
    return { correct, incorrect, total };
  }, [predictions]);

  // Export history as JSON string
  const exportHistory = useCallback(() => {
    try {
      return JSON.stringify(predictions, null, 2);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error exporting history:', error);
      return '';
    }
  }, [predictions]);

  // Import history from JSON string
  const importHistory = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      // Validate that it's an array of predictions
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid format: expected an array');
      }
      
      // Convert timestamps back to Date objects
      const converted = parsed.map((p: unknown) => {
        const pred = p as Record<string, unknown>;
        return {
          ...pred,
          timestamp: new Date(pred.timestamp as string)
        } as PredictionWithFeedback;
      });
      
      // Keep only the last MAX_HISTORY_ITEMS predictions
      const limited = converted.slice(0, MAX_HISTORY_ITEMS);
      
      setPredictions(limited);
      savePredictionsToStorage(limited);
      
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error importing history:', error);
      return false;
    }
  }, [savePredictionsToStorage]);

  return {
    userId,
    predictions,
    addPrediction,
    removePrediction,
    clearHistory,
    exportHistory,
    importHistory,
    addFeedback,
    getFeedbackStats,
    isLoading
  };
}
