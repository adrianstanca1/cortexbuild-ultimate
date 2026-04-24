/**
 * Capacitor platform utilities.
 * All imports from @capacitor/core are guarded so the web build never breaks
 * if @capacitor/core is tree-shaken or the platform bridge is unavailable.
 */

// Lazy-loaded to avoid importing in SSR/test environments
let _cap: typeof import('@capacitor/core').Capacitor | null = null;

function getCap() {
  if (_cap !== null) return _cap;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _cap = (require('@capacitor/core') as { Capacitor: typeof import('@capacitor/core').Capacitor }).Capacitor;
  } catch {
    _cap = null;
  }
  return _cap;
}

/** Returns true when running inside a Capacitor native shell (iOS or Android). */
export function isNative(): boolean {
  return getCap()?.isNativePlatform() ?? false;
}

/** Returns 'ios' | 'android' | 'web' */
export function getPlatform(): string {
  return getCap()?.getPlatform() ?? 'web';
}

/** Returns true when running in iOS Capacitor shell. */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/** Returns true when running in Android Capacitor shell. */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}
