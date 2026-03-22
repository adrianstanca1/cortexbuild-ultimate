import { useEffect, useState } from 'react';

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  serviceWorker: ServiceWorkerRegistration | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    updateAvailable: false,
    serviceWorker: null,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleOnline = () => setState(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    navigator.serviceWorker.ready.then((registration) => {
      setState(s => ({ ...s, serviceWorker: registration }));

      if (registration.active) {
        setState(s => ({ ...s, isInstalled: true }));
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(s => ({ ...s, updateAvailable: true }));
            }
          });
        }
      });
    });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setState(s => ({ ...s, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const install = async () => {
    if (!state.serviceWorker) return false;

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      (e as any).prompt();
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.dispatchEvent(new Event('beforeinstallprompt'));

    return true;
  };

  const update = () => {
    if (state.serviceWorker?.waiting) {
      state.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const clearCache = () => {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
  };

  return {
    ...state,
    install,
    update,
    clearCache,
  };
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return;
  }

  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('SW registered:', registration.scope);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available, refresh to update');
            }
          });
        }
      });
    })
    .catch((error) => {
      console.error('SW registration failed:', error);
    });

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.addEventListener('statechange', (e) => {
      if ((e.target as ServiceWorker).state === 'redundant') {
        console.log('SW was superseded');
      }
    });
  }
}

export async function queueOfflineRequest(
  url: string,
  method: string,
  body?: BodyInit,
  headers?: Record<string, string>
) {
  const DB_NAME = 'cortexbuild-offline';
  const STORE_NAME = 'pending-requests';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add({ url, method, body, headers, timestamp: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
  });
}

export function useOfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

  useEffect(() => {
    checkPendingRequests();
    const interval = setInterval(checkPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkPendingRequests() {
    if ('indexedDB' in window) {
      const DB_NAME = 'cortexbuild-offline';
      const STORE_NAME = 'pending-requests';
      
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains(STORE_NAME)) {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const countRequest = store.count();
            countRequest.onsuccess = () => setPendingCount(countRequest.result);
          }
        };
      } catch (e) {
        console.log('IndexedDB not available');
      }
    }
  }

  return { isOnline, showBanner, pendingCount, setShowBanner };
}
