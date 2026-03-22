import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('usePWA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerServiceWorker', () => {
    it('registers service worker when available', async () => {
      const registerMock = vi.fn().mockResolvedValue({});
      Object.defineProperty(window, 'navigator', {
        value: { 
          serviceWorker: { register: registerMock },
        },
        configurable: true,
      });

      const { registerServiceWorker } = await import('../hooks/usePWA');
      registerServiceWorker();

      expect(registerMock).toHaveBeenCalledWith('/sw.js');
    });
  });

  describe('queueOfflineRequest', () => {
    it('queues request to IndexedDB', async () => {
      const openRequest = {
        onupgradeneeded: null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        result: {
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              add: vi.fn((_data: unknown) => {
                setTimeout(() => {
                  const tx = openRequest.result.transaction({}) as { objectStore: () => { add: () => void } };
                  tx.objectStore().add.mockImplementation(() => {
                    setTimeout(() => {
                      const tx2 = openRequest.result.transaction({}) as { objectStore: () => { add: () => void } };
                      tx2.objectStore().add();
                    }, 0);
                    return openRequest;
                  });
                }, 0);
                return openRequest;
              }),
            })),
            oncomplete: null,
            onerror: null,
          })),
          objectStoreNames: { contains: () => true },
        },
      };

      const indexedDBMock = {
        open: vi.fn(() => {
          setTimeout(() => openRequest.onsuccess?.(), 0);
          return openRequest;
        }),
      };

      Object.defineProperty(globalThis, 'indexedDB', {
        value: indexedDBMock,
        configurable: true,
      });

      const { queueOfflineRequest } = await import('../hooks/usePWA');
      const result = await queueOfflineRequest('/api/test', 'POST', '{}');

      expect(result).toBe(true);
    });
  });
});
