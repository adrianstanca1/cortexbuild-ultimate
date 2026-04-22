/**
 * CortexBuild Ultimate — Push Notifications Hook
 * Request permission, subscribe to Web Push, store subscription in backend
 */
import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

interface PushSubscriptionResult {
  success: boolean;
  error?: string;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<PushSubscriptionResult> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, error: 'Push notifications not supported' };
    }

    const permissionResult = await Notification.requestPermission();
    if (permissionResult !== 'granted') {
      return { success: false, error: 'Permission denied' };
    }

    setPermission(permissionResult);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : null,
      });

      setSubscription(sub);

      const token = getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/notifications/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.toJSON().keys?.p256dh || '',
            auth: sub.toJSON().keys?.auth || '',
          },
        }),
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to store subscription' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, []);

  const unsubscribeFromPush = useCallback(async (): Promise<PushSubscriptionResult> => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);

        const token = getToken();
        if (token) {
          await fetch('/api/notifications/push-unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [subscription]);

  return {
    permission,
    subscription,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
  };
}