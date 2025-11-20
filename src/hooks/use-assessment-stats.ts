import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AssessmentStats {
  totalAssessments: number;
  documentsUploaded: number;
  averageRiskScore: number;
  lastAssessmentDate: string | null;
  riskTrend: 'up' | 'down' | 'neutral';
}

export function useAssessmentStats(userId: string | undefined) {
  const [stats, setStats] = useState<AssessmentStats>({
    totalAssessments: 0,
    documentsUploaded: 0,
    averageRiskScore: 0,
    lastAssessmentDate: null,
    riskTrend: 'neutral',
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch prediction history from Supabase
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (predictions && predictions.length > 0) {
        const totalAssessments = predictions.length;
        
        // Calculate average risk score
        const avgRisk = Math.round(
          predictions.reduce((sum, p) => sum + (p.risk_score || 0), 0) / totalAssessments
        );

        // Determine risk trend (compare last 2 assessments)
        let trend: 'up' | 'down' | 'neutral' = 'neutral';
        if (predictions.length >= 2) {
          const latest = predictions[0].risk_score || 0;
          const previous = predictions[1].risk_score || 0;
          if (latest > previous + 5) trend = 'up';
          else if (latest < previous - 5) trend = 'down';
        }

        // Count documents (assuming stored in metadata)
        const totalDocs = predictions.reduce((sum, p) => {
          const metadata = p.metadata as { document_count?: number } | null;
          return sum + (metadata?.document_count || 0);
        }, 0);

        setStats({
          totalAssessments,
          documentsUploaded: totalDocs,
          averageRiskScore: avgRisk,
          lastAssessmentDate: predictions[0].created_at,
          riskTrend: trend,
        });
      }
    } catch (error) {
      console.error('Error fetching assessment stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshStats = () => {
    fetchStats();
  };

  return { stats, isLoading, refreshStats };
}
