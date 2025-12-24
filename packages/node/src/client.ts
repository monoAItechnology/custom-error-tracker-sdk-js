/**
 * Node.js SDK - Node Client
 */

import {
  BaseHub,
  Config,
  type ErrorTrackerOptions,
  type ErrorEvent,
  type ErrorLevel,
  safeExecuteAsync,
  normalizeError,
  parseStackTrace,
} from '@monoai/error-tracker-core';
import { NodeTransport } from './transports/http';
import { setupGlobalHandlers } from './integrations/global-handlers';

/**
 * Node.js-specific Error Tracker client
 */
export class NodeClient extends BaseHub {
  private transport: NodeTransport;
  private cleanupHandlers: (() => void)[] = [];

  constructor(options: ErrorTrackerOptions) {
    super(options);

    this.transport = new NodeTransport(this.config);

    // Setup automatic capture if enabled
    if (this.config.get('autoCapture')) {
      const cleanup = setupGlobalHandlers(this);
      this.cleanupHandlers.push(cleanup);
      this.config.debug('Global handlers installed');
    }
  }

  /**
   * Capture an exception
   */
  async captureException(
    error: Error | unknown,
    level: ErrorLevel = 'Error'
  ): Promise<string | null> {
    return safeExecuteAsync(async () => {
      const normalizedError = normalizeError(error);
      const event = this.buildEvent(normalizedError.message, level, normalizedError);

      // Add source context from stack trace
      event.sourceContext = parseStackTrace(normalizedError.stack);

      this.config.debug('Capturing exception', event.message);

      return this.sendEvent(event);
    }, null);
  }

  /**
   * Capture a message
   */
  async captureMessage(
    message: string,
    level: ErrorLevel = 'Warning'
  ): Promise<string | null> {
    return safeExecuteAsync(async () => {
      const event = this.buildEvent(message, level);

      this.config.debug('Capturing message', message);

      return this.sendEvent(event);
    }, null);
  }

  /**
   * Send an event to the server
   */
  private async sendEvent(event: ErrorEvent): Promise<string | null> {
    // Apply beforeSend hook
    const processedEvent = await this.applyBeforeSend(event);
    if (!processedEvent) {
      this.config.debug('Event dropped by beforeSend');
      return null;
    }

    const result = await this.transport.send(processedEvent);

    if (!result.success) {
      this.config.debug('Send failed', result.error);
      return null;
    }

    this.config.debug('Event sent successfully', result.id);
    return result.id || null;
  }

  /**
   * Flush pending events and wait for completion
   */
  async flush(timeout: number = 5000): Promise<void> {
    await this.transport.flush?.(timeout);
  }

  /**
   * Get configuration (for internal use)
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Clean up event listeners and handlers
   */
  destroy(): void {
    this.cleanupHandlers.forEach((cleanup) => cleanup());
    this.cleanupHandlers = [];
    this.config.debug('Client destroyed');
  }
}
