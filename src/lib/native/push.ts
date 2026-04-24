import { isNative } from '../capacitor';

export interface PushRegistration {
  token: string;
  platform: 'apns' | 'fcm' | 'web';
}

/**
 * Register for push notifications.
 * - iOS native: uses APNs via @capacitor/push-notifications → sends device token to server
 * - Web: uses VAPID web push (existing implementation)
 */
export async function registerPushNotifications(
  onToken: (reg: PushRegistration) => void,
  onError: (error: unknown) => void,
): Promise<() => void> {
  if (isNative()) {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      onError(new Error('Push notification permission denied'));
      return () => {};
    }

    await PushNotifications.register();

    const regHandle = await PushNotifications.addListener('registration', (token) => {
      onToken({ token: token.value, platform: 'apns' });
    });

    const errHandle = await PushNotifications.addListener('registrationError', (err) => {
      onError(err.error);
    });

    return () => {
      void regHandle.remove();
      void errHandle.remove();
    };
  }

  // Web: VAPID — handled by existing usePushNotifications hook
  // This function is a no-op on web; the hook handles the full VAPID flow
  return () => {};
}

/**
 * Request push notification permission and get APNs device token.
 * Returns the device token string on success, null on denial/error.
 */
export async function requestPushPermissionAndToken(): Promise<string | null> {
  if (!isNative()) return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') return null;

  return new Promise((resolve) => {
    void (async () => {
      await PushNotifications.register();

      let resolved = false;
      const regHandle = await PushNotifications.addListener('registration', (token) => {
        if (!resolved) {
          resolved = true;
          void regHandle.remove();
          void errHandle.remove();  // ADD THIS
          resolve(token.value);
        }
      });

      const errHandle = await PushNotifications.addListener('registrationError', () => {
        if (!resolved) {
          resolved = true;
          void regHandle.remove();  // ADD THIS
          void errHandle.remove();
          resolve(null);
        }
      });
    })();
  });
}
