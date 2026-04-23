import { dequeueAll, markSynced, markFailed, incrementRetries } from './offlineQueue';
import { toast } from 'sonner';

let running = false;

export async function runSync(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const entries = await dequeueAll();
    for (const entry of entries) {
      try {
        const res = await fetch(entry.url, {
          method: entry.method,
          headers: { 'Content-Type': 'application/json', ...entry.headers },
          body: entry.body,
        });
        if (res.ok) {
          await markSynced(entry.id!);
        } else if (res.status === 409) {
          await markFailed(entry.id!);
          toast.error('Sync conflict — tap to resolve', { duration: 0 });
        } else {
          const retries = await incrementRetries(entry.id!);
          if (retries >= 5) {
            toast.error('Report failed to sync after 5 attempts — tap to retry', { duration: 0 });
          }
        }
      } catch {
        await incrementRetries(entry.id!);
      }
    }
  } finally {
    running = false;
    window.dispatchEvent(new CustomEvent('sync-complete'));
  }
}

export function initSync(): () => void {
  const onOnline = () => runSync();
  window.addEventListener('online', onOnline);
  runSync(); // also run on mount to catch queue built while offline
  return () => window.removeEventListener('online', onOnline);
}
