import { useState, useEffect, useCallback } from 'react';
import { PredictionResult, mockPredictions } from '@/lib/mockData';
import { useAuth } from './useAuth';
import { supabase, loadPredictionsFromDatabase, isSupabaseConfigured } from '@/lib/supabase';

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
function transformDatabasePrediction(dbPred: any): PredictionWithFeedback {
  return {
    id: dbPred.id,
    timestamp: new Date(dbPred.created_at),
    riskLevel: (dbPred.risk_level || 'low').toLowerCase() as 'low' | 'medium' | 'high',
    riskScore: dbPred.risk_score || 0,
    confidence: dbPred.confidence || 0,
    prediction: dbPred.prediction || 'No Risk',
    explanation: dbPred.explanation || '',
    recommendations: dbPred.recommendations || [],
    patientData: {
      age: dbPred.patient_age,
      gender: (dbPred.patient_gender as 'male' | 'female') || 'male',
      chestPainType: 'typical',
      restingBP: dbPred.resting_bp || 120,
      cholesterol: dbPred.cholesterol || 200,
      fastingBS: dbPred.blood_sugar_fasting || false,
      restingECG: 'normal',
      maxHR: dbPred.max_heart_rate || 150,
      exerciseAngina: dbPred.exercise_induced_angina || false,
      oldpeak: dbPred.oldpeak || 0,
      stSlope: (dbPred.st_slope as 'up' | 'flat' | 'down') || 'flat',
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
      console.log('🔄 Refreshing predictions from database...');
      const dbPredictions = await loadPredictionsFromDatabase(currentUserId);
      
      if (dbPredictions && dbPredictions.length > 0) {
        const transformed = dbPredictions.map(transformDatabasePrediction);
        console.log(`✅ Refreshed ${transformed.length} predictions from database`);
        setPredictions(transformed);
      }
    } catch (error) {
      console.warn('⚠️ Error refreshing from database:', error);
    }
  }, []);

  // Initialize user ID and load predictions from database
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        
        // Use authenticated user ID from Supabase
        if (user?.id) {
          setUserId(user.id);
          
          // 🔥 Try to load from Supabase database first
          if (isSupabaseConfigured) {
            try {
              console.log('📥 Loading predictions from Supabase database...');
              const dbPredictions = await loadPredictionsFromDatabase(user.id);
              
              if (dbPredictions && dbPredictions.length > 0) {
                // Transform database records to our format
                const transformed = dbPredictions.map(transformDatabasePrediction);
                console.log(`✅ Loaded ${transformed.length} predictions from database`);
                setPredictions(transformed);
                return; // Exit - we have data from database
              }
            } catch (error) {
              console.warn('⚠️ Error loading from database, falling back to localStorage:', error);
            }
          }
          
          // Fallback: Load from localStorage if database is unavailable
          console.log('📦 Loading predictions from localStorage...');
          const storageKey = STORAGE_KEY_PREFIX + user.id;
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            const parsed = JSON.parse(stored);
            // Convert timestamp strings back to Date objects
            const converted = parsed.map((p: any) => ({
              ...p,
              timestamp: new Date(p.timestamp)
            }));
            console.log(`✅ Loaded ${converted.length} predictions from localStorage`);
            setPredictions(converted);
          } else {
            // No history for this user yet
            console.log('ℹ️ No prediction history found');
            setPredictions([]);
          }
        } else {
          // Not authenticated yet
          setUserId('');
          setPredictions([]);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      initializeUser();
    }
  }, [user, authLoading, reloadPredictionsFromDatabase]);

  // Save predictions to localStorage for this user
  const savePredictionsToStorage = useCallback((preds: PredictionWithFeedback[]) => {
    if (!userId) return;
    
    try {
      const storageKey = STORAGE_KEY_PREFIX + userId;
      localStorage.setItem(storageKey, JSON.stringify(preds));
    } catch (error) {
      console.error('Error saving predictions to storage:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        console.warn('LocalStorage quota exceeded. Keeping only last 50 predictions.');
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
      console.error('Error clearing history:', error);
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
      console.error('Error exporting history:', error);
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
      const converted = parsed.map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp)
      }));
      
      // Keep only the last MAX_HISTORY_ITEMS predictions
      const limited = converted.slice(0, MAX_HISTORY_ITEMS);
      
      setPredictions(limited);
      savePredictionsToStorage(limited);
      
      return true;
    } catch (error) {
      console.error('Error importing history:', error);
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
