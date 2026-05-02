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

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4MrV-oXhK_johreyzIucti5RFrKcvyG8",
  authDomain: "imaan-app-1d2da.firebaseapp.com",
  projectId: "imaan-app-1d2da",
  storageBucket: "imaan-app-1d2da.firebasestorage.app",
  messagingSenderId: "373650938167",
  appId: "1:373650938167:web:e9da1317c118bc720d22b2"
}

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
