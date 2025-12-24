/**
 * Browser SDK - Global Error Handlers
 *
 * Hooks into window.onerror and unhandledrejection to capture errors automatically.
 */

import type { BrowserClient } from '../client';

/**
 * Set up global error handlers
 * @returns Cleanup function to remove handlers
 */
export function setupGlobalHandlers(client: BrowserClient): () => void {
  const cleanupFns: (() => void)[] = [];

  // window.onerror - handles synchronous errors
  const originalOnError = window.onerror;

  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): boolean | void => {
    // If we have an actual Error object, use it
    if (error) {
      client.captureException(error);
    } else {
      // Create a synthetic error from the message
      const syntheticError = new Error(String(message));
      if (source && lineno) {
        syntheticError.stack = `Error: ${message}\n    at ${source}:${lineno}:${colno || 0}`;
      }
      client.captureException(syntheticError);
    }

    // Call original handler if exists
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  cleanupFns.push(() => {
    window.onerror = originalOnError;
  });

  // unhandledrejection - handles unhandled Promise rejections
  const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error = event.reason;
    client.captureException(error);
  };

  window.addEventListener('unhandledrejection', onUnhandledRejection);
  cleanupFns.push(() => {
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  });

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
