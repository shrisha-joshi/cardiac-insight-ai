import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DatabaseStatus {
  isConfigured: boolean;
  tablesExist: boolean;
  checking: boolean;
  error?: string;
}

export function useDatabaseStatus(): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>({
    isConfigured: false,
    tablesExist: false,
    checking: true,
  });

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      // Check if Supabase is configured
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key || url === 'https://placeholder.supabase.co') {
        setStatus({
          isConfigured: false,
          tablesExist: false,
          checking: false,
          error: 'Supabase not configured'
        });
        return;
      }

      // Quick check if main table exists
      const { error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      setStatus({
        isConfigured: true,
        tablesExist: !error,
        checking: false,
        error: error?.message
      });
    } catch (err) {
      setStatus({
        isConfigured: false,
        tablesExist: false,
        checking: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  return status;
}