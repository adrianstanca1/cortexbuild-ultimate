import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

export function initServiceWorker(): void {
  if (import.meta.env.DEV) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      toast('Update available', {
        duration: Infinity,
        action: { label: 'Reload', onClick: () => updateSW(true) },
      });
    },
    onOfflineReady() {
      toast.success('App ready for offline use');
    },
  });
}
