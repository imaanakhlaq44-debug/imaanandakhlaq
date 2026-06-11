/**
 * Shared Firebase configuration for inline <script type="module"> blocks.
 * 
 * Since dashboard components use CDN imports inside <script> tags (not bundled),
 * this module provides:
 * 1. A single source of truth for the Firebase config object
 * 2. A helper to generate the inline JS config block
 * 
 * Usage in components:
 *   import { firebaseConfigBlock } from '../lib/firebaseConfig'
 *   // Inside your <script type="module">:
 *   ${firebaseConfigBlock}
 *   // Then use: window.__FIREBASE_CONFIG__
 */

// Load from environment variables
const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
});

export const FIREBASE_CONFIG = getFirebaseConfig();

/**
 * Generates the Firebase config as a JS object literal string
 * for embedding inside inline <script> blocks.
 */
export const firebaseConfigJS = `{
    apiKey: "${FIREBASE_CONFIG.apiKey}",
    authDomain: "${FIREBASE_CONFIG.authDomain}",
    projectId: "${FIREBASE_CONFIG.projectId}",
    storageBucket: "${FIREBASE_CONFIG.storageBucket}",
    messagingSenderId: "${FIREBASE_CONFIG.messagingSenderId}",
    appId: "${FIREBASE_CONFIG.appId}"
  }`
