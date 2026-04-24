/**
 * CortexBuild Ultimate — Push Notifications Hook
 * iOS native: APNs device token via @capacitor/push-notifications
 * Web: VAPID push subscription
 */
import { useEffect } from 'react';
import { isNative } from '@/lib/capacitor';
import { requestPushPermissionAndToken } from '@/lib/native/push';
import { getToken } from '@/lib/supabase';

export function usePushNotifications(isClockIn: boolean) {
  useEffect(() => {
    if (!isClockIn) return;

    if (isNative()) {
      void subscribeNative();
    } else {
      void subscribeWeb();
    }
  }, [isClockIn]);
}

async function subscribeNative(): Promise<void> {
  try {
    const deviceToken = await requestPushPermissionAndToken();
    if (!deviceToken) return;

    const token = getToken() ?? '';
    await fetch('/api/push/subscribe-native', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ deviceToken, platform: 'apns' }),
    });
  } catch (err) {
    console.warn('[Push] Native subscription failed:', err);
  }
}

async function subscribeWeb(): Promise<void> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  if (Notification.permission === 'granted') {
    void subscribeVapid();
    return;
  }
  if (Notification.permission !== 'denied') {
    const p = await Notification.requestPermission();
    if (p === 'granted') void subscribeVapid();
  }
}

async function subscribeVapid(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const res = await fetch('/api/push/vapid-public-key', { credentials: 'include' });
    const { key } = (await res.json()) as { key: string };

    if (!key) {
      console.warn('[Push] VAPID public key not configured');
      return;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
    });

    const token = getToken() ?? '';
    await fetch('/api/push/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subscription: sub }),
    });
  } catch (err) {
    console.warn('[Push] VAPID subscription failed:', err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
