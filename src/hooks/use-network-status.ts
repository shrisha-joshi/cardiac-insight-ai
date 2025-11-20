/**
 * Network Status Monitoring Hook (Phase 7)
 * Monitors online/offline status and provides network state
 */

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface NetworkInformation extends EventTarget {
  readonly effectiveType: string;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
}

/**
 * Hook to monitor network connectivity status
 */
export const useNetworkStatus = () => {
  const { toast } = useToast();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    effectiveType: null,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      
      // Get connection info if available
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      const effectiveType = connection?.effectiveType || null;
      const isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g';

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        effectiveType,
      });

      // Show toast notifications for status changes
      if (!isOnline) {
        toast({
          title: "⚠️ No Internet Connection",
          description: "You're currently offline. Some features may be unavailable.",
          variant: "destructive",
        });
      } else if (isSlowConnection) {
        toast({
          title: "⚠️ Slow Connection Detected",
          description: "You may experience slower performance.",
          variant: "default",
        });
      }
    };

    // Initial status check
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for connection changes (if supported)
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateOnlineStatus);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateOnlineStatus);
      }
    };
  }, [toast]);

  return networkStatus;
};

/**
 * Hook variant that only tracks online status (lighter)
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
