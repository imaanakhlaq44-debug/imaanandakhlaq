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
 * Firebase error handler
 */
export const handleFirebaseError = (error: any): string => {
  const firebaseErrors: { [key: string]: string } = {
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/user-not-found': 'User not found.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'User account has been disabled.',
    'permission-denied': 'You do not have permission to access this resource.',
    'not-found': 'Resource not found.',
    'unavailable': 'Service is temporarily unavailable. Please try again later.'
  };

  const errorCode = error?.code || 'unknown';
  return firebaseErrors[errorCode] || error?.message || 'An unknown error occurred';
};
