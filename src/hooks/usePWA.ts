import { useEffect, useState } from 'react';

interface PWAState {
  isOnline: boolean;
  showBanner: boolean;
  pendingCount: number;
  setShowBanner: (show: boolean) => void;
}

export function usePWA(): PWAState {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to check pending requests - declared before use
  async function checkPendingRequests() {
    if ('indexedDB' in window) {
      const DB_NAME = 'cortexbuild-offline';
      const STORE_NAME = 'pending-requests';
      
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const countRequest = store.count();
          countRequest.onsuccess = () => {
            setPendingCount(countRequest.result);
          };
        };
        request.onerror = () => {
          console.error('Error opening IndexedDB');
        };
      } catch (error) {
        console.error('Error checking pending requests:', error);
      }
    }
  }

  // Check for pending requests on mount and periodically
  useEffect(() => {
    checkPendingRequests();
    const interval = setInterval(checkPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isOnline, showBanner, pendingCount, setShowBanner };
}
