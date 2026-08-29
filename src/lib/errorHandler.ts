/**
 * Error handling and logging utilities
 */

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  context?: any;
  stack?: string;
}

// In-memory error log (consider persisting to localStorage or server)
const errorLogs: ErrorLog[] = [];

/**
 * Centralized error logger
 */
export const logError = (
  message: string,
  error?: Error | any,
  context?: any
): void => {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    context,
    stack: error?.stack
  };

  errorLogs.push(errorLog);

  // Keep only last 100 errors
  if (errorLogs.length > 100) {
    errorLogs.shift();
  }

  // Log to console in development
  if (import.meta.env.VITE_ENV === 'development') {
    console.error(`[${errorLog.timestamp}] ${message}`, {
      error,
      context
    });
  }

  // Consider sending to error tracking service (Sentry, etc.)
  // await sendToErrorTracking(errorLog);
};

/**
 * Centralized warning logger
 */
export const logWarn = (message: string, context?: any): void => {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    context
  };

  errorLogs.push(errorLog);

  if (import.meta.env.VITE_ENV === 'development') {
    console.warn(`[${errorLog.timestamp}] ${message}`, context);
  }
};

/**
 * Centralized info logger
 */
export const logInfo = (message: string, context?: any): void => {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    context
  };

  if (import.meta.env.VITE_ENV === 'development') {
    console.log(`[${errorLog.timestamp}] ${message}`, context);
  }
};

/**
 * Get all error logs
 */
export const getErrorLogs = (): ErrorLog[] => {
  return [...errorLogs];
};

/**
 * Clear error logs
 */
export const clearErrorLogs = (): void => {
  errorLogs.length = 0;
};

/**
 * Async operation wrapper with error handling
 */
export const asyncHandler = async <T>(
  asyncFn: () => Promise<T>,
  errorMessage: string = 'An error occurred',
  context?: any
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    logError(errorMessage, error, context);
    return null;
  }
};

/**
 * Sync operation wrapper with error handling
 */
export const syncHandler = <T>(
  syncFn: () => T,
  errorMessage: string = 'An error occurred',
  context?: any
): T | null => {
  try {
    return syncFn();
  } catch (error) {
    logError(errorMessage, error, context);
    return null;
  }
};

/**
 * What a person is told when Firebase refuses something.
 *
 * Firebase's own message reads "Firebase: Error (auth/wrong-password)." — a
 * string written for whoever wrote the code, not for the parent holding the
 * phone. On the login screen it also reads as an unfinished app, which is the
 * same impression the debug banners gave a Play reviewer.
 *
 * One map, used from two places: handleFirebaseError() for anything bundled,
 * and authErrorHelpersJS below for the inline <script> blocks, which cannot
 * import from here. Add a code once and both get it.
 */
const FIREBASE_ERRORS: { [key: string]: string } = {
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Wrong password. Please try again.',
  'auth/invalid-credential': 'Wrong email or password. Please try again.',
  'auth/invalid-login-credentials': 'Wrong email or password. Please try again.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/missing-password': 'Please enter your password.',
  'auth/user-disabled': 'This account has been turned off. Please contact your school.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection. Please check and try again.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
  'auth/operation-not-allowed': 'This sign-in method is not available right now.',
  'auth/internal-error': 'Something went wrong. Please try again.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'This app build is not set up correctly. Please reinstall the latest version.',
  'permission-denied': 'You do not have permission to do that.',
  'not-found': 'That could not be found.',
  'unavailable': 'The service is busy right now. Please try again in a moment.'
};

const FALLBACK_ERROR = 'Something went wrong. Please try again.';

/**
 * Never returns Firebase's own wording: an unmapped code falls through to a
 * plain sentence rather than leaking "Firebase: Error (...)" onto the screen.
 */
export const handleFirebaseError = (error: any): string => {
  const code = error?.code || '';
  return FIREBASE_ERRORS[code] || FALLBACK_ERROR;
};

/**
 * The same thing as source, for embedding in an inline <script type="module">
 * the way firebaseConfigJS and familyLoginHelpersJS are.
 */
export const authErrorHelpersJS = `
  var FIREBASE_ERRORS = ${JSON.stringify(FIREBASE_ERRORS, null, 2)};
  var FALLBACK_ERROR = ${JSON.stringify(FALLBACK_ERROR)};

  // Takes the Firebase error and gives back something a parent can act on.
  // Anything unrecognised becomes the fallback, so Firebase's own wording
  // never reaches the screen.
  function friendlyAuthError(err, fallback) {
    var code = (err && err.code) || '';
    if (FIREBASE_ERRORS[code]) return FIREBASE_ERRORS[code];
    // Some paths hand us a message like "Firebase: Error (auth/wrong-password)."
    // instead of an object carrying .code, so read the code back out of it.
    var msg = (err && err.message) || (typeof err === 'string' ? err : '');
    var m = msg.match(/\\(([a-z-]+\\/[a-z0-9-.]+)\\)/i);
    if (m && FIREBASE_ERRORS[m[1]]) return FIREBASE_ERRORS[m[1]];
    if (/^Firebase:/i.test(msg)) return fallback || FALLBACK_ERROR;
    return msg || fallback || FALLBACK_ERROR;
  }
`;
