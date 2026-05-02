// Platform helpers — use these to guard app-only or web-only behavior.
// Rule: when working on the Android app, NEVER change web behavior.
// Always wrap app-specific code in `if (isApp())` so the web path stays untouched.

import { Capacitor } from '@capacitor/core';

/** True when running inside the Capacitor Android/iOS WebView. */
export function isApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** True when running in a regular browser (Hostinger / desktop / mobile web). */
export function isWeb(): boolean {
  return !isApp();
}

/** Run `fn` only inside the native app. Returns its result, or `undefined` on web. */
export function appOnly<T>(fn: () => T): T | undefined {
  return isApp() ? fn() : undefined;
}

/** Run `fn` only on the web. Returns its result, or `undefined` in the app. */
export function webOnly<T>(fn: () => T): T | undefined {
  return isWeb() ? fn() : undefined;
}

/** Pick a value based on platform without running both branches. */
export function pickPlatform<T>(opts: { app: () => T; web: () => T }): T {
  return isApp() ? opts.app() : opts.web();
}
