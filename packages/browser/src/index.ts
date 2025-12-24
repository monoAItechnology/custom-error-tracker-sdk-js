/**
 * @monoai/error-tracker-browser
 *
 * Browser SDK for Error Tracker - automatic error capturing for web applications.
 *
 * Usage:
 * ```javascript
 * import { init, captureMessage } from '@monoai/error-tracker-browser';
 *
 * init({
 *   dsn: 'https://your-functions-url.azurewebsites.net',
 *   appId: 'my-app',
 *   commitHash: 'abc123',
 *   environment: 'Production'
 * });
 *
 * // Errors are now captured automatically
 * // You can also capture manually:
 * captureMessage('Something happened', 'Warning');
 * ```
 */

import type { ErrorTrackerOptions, ErrorLevel, UserInfo } from '@monoai/error-tracker-core';
import { BrowserClient } from './client';

// Global client instance (singleton pattern)
let client: BrowserClient | null = null;

/**
 * Initialize the Error Tracker SDK
 * Call this as early as possible in your application
 */
export function init(options: ErrorTrackerOptions): void {
  if (client) {
    console.warn('ErrorTracker: Already initialized');
    return;
  }
  client = new BrowserClient(options);
}

/**
 * Capture an exception
 * @param error - The error to capture
 * @param level - Error level (default: 'Error')
 * @returns Event ID or null if not sent
 */
export function captureException(
  error: Error | unknown,
  level?: ErrorLevel
): Promise<string | null> {
  if (!client) {
    console.warn('ErrorTracker: Not initialized. Call init() first.');
    return Promise.resolve(null);
  }
  return client.captureException(error, level);
}

/**
 * Capture a message
 * @param message - The message to capture
 * @param level - Error level (default: 'Warning')
 * @returns Event ID or null if not sent
 */
export function captureMessage(
  message: string,
  level?: ErrorLevel
): Promise<string | null> {
  if (!client) {
    console.warn('ErrorTracker: Not initialized. Call init() first.');
    return Promise.resolve(null);
  }
  return client.captureMessage(message, level);
}

/**
 * Set user information for all future events
 * @param user - User info or null to clear
 */
export function setUser(user: UserInfo | null): void {
  client?.setUser(user);
}

/**
 * Set a single tag
 */
export function setTag(key: string, value: string): void {
  client?.setTag(key, value);
}

/**
 * Set multiple tags
 */
export function setTags(tags: Record<string, string>): void {
  client?.setTags(tags);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  client?.setExtra(key, value);
}

/**
 * Set multiple extra context values
 */
export function setExtras(extras: Record<string, unknown>): void {
  client?.setExtras(extras);
}

/**
 * Get the current client instance (for advanced usage)
 */
export function getClient(): BrowserClient | null {
  return client;
}

/**
 * Close the SDK and clean up resources
 */
export function close(): void {
  client?.destroy();
  client = null;
}

// Re-export types from core
export type {
  ErrorTrackerOptions,
  ErrorLevel,
  ErrorEvent,
  UserInfo,
  Environment,
} from '@monoai/error-tracker-core';

// Export client class for advanced usage
export { BrowserClient } from './client';
