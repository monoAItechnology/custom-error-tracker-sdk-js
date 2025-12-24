/**
 * @monoai/error-tracker-node
 *
 * Node.js SDK for Error Tracker - automatic error capturing for server applications.
 *
 * Usage:
 * ```javascript
 * import { init, captureMessage } from '@monoai/error-tracker-node';
 *
 * init({
 *   dsn: 'https://your-functions-url.azurewebsites.net',
 *   appId: 'my-api',
 *   commitHash: 'abc123',
 *   environment: 'Production'
 * });
 *
 * // Errors are now captured automatically
 * // You can also capture manually:
 * captureMessage('Something happened', 'Warning');
 * ```
 *
 * For Express:
 * ```javascript
 * import { init } from '@monoai/error-tracker-node';
 * import { errorHandler } from '@monoai/error-tracker-node/express';
 *
 * init({ ... });
 *
 * const app = express();
 * // ... your routes ...
 * app.use(errorHandler()); // Add at the end
 * ```
 */

import type { ErrorTrackerOptions, ErrorLevel, UserInfo } from '@monoai/error-tracker-core';
import { NodeClient } from './client';
import { setGlobalClient, getGlobalClient } from './globals';

/**
 * Initialize the Error Tracker SDK
 * Call this as early as possible in your application
 */
export function init(options: ErrorTrackerOptions): void {
  if (getGlobalClient()) {
    console.warn('ErrorTracker: Already initialized');
    return;
  }
  setGlobalClient(new NodeClient(options));
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
  const client = getGlobalClient();
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
  const client = getGlobalClient();
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
  getGlobalClient()?.setUser(user);
}

/**
 * Set a single tag
 */
export function setTag(key: string, value: string): void {
  getGlobalClient()?.setTag(key, value);
}

/**
 * Set multiple tags
 */
export function setTags(tags: Record<string, string>): void {
  getGlobalClient()?.setTags(tags);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  getGlobalClient()?.setExtra(key, value);
}

/**
 * Set multiple extra context values
 */
export function setExtras(extras: Record<string, unknown>): void {
  getGlobalClient()?.setExtras(extras);
}

/**
 * Get the current client instance (for advanced usage)
 */
export function getClient(): NodeClient | null {
  return getGlobalClient();
}

/**
 * Flush pending events and wait for completion
 */
export async function flush(timeout?: number): Promise<void> {
  await getGlobalClient()?.flush(timeout);
}

/**
 * Close the SDK and clean up resources
 */
export function close(): void {
  const client = getGlobalClient();
  client?.destroy();
  setGlobalClient(null);
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
export { NodeClient } from './client';
