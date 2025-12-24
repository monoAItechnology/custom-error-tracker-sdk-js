/**
 * Browser SDK - Browser Client
 */

import {
  BaseHub,
  type ErrorTrackerOptions,
  type ErrorEvent,
  type ErrorLevel,
  safeExecuteAsync,
  normalizeError,
  parseStackTrace,
} from '@monoai/error-tracker-core';
import { FetchTransport } from './transports/fetch';
import { BeaconTransport } from './transports/beacon';
import { setupGlobalHandlers } from './integrations/global-handlers';

// Simple offline queue storage interface
interface QueueStorage {
  get(): ErrorEvent[];
  set(events: ErrorEvent[]): void;
  clear(): void;
}

const QUEUE_KEY = 'error-tracker-queue';
const MAX_QUEUE_SIZE = 100;

/**
 * Create localStorage-based queue storage
 */
function createLocalStorageQueue(): QueueStorage {
  return {
    get(): ErrorEvent[] {
      try {
        const data = localStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    },
    set(events: ErrorEvent[]): void {
      try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(events));
      } catch {
        // localStorage full or unavailable - ignore
      }
    },
    clear(): void {
      try {
        localStorage.removeItem(QUEUE_KEY);
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Browser-specific Error Tracker client
 */
export class BrowserClient extends BaseHub {
  private transport: FetchTransport;
  private beaconTransport: BeaconTransport;
  private queue: QueueStorage;
  private cleanupHandlers: (() => void)[] = [];
  private isProcessingQueue = false;

  constructor(options: ErrorTrackerOptions) {
    super(options);

    this.transport = new FetchTransport(this.config);
    this.beaconTransport = new BeaconTransport(this.config);
    this.queue = createLocalStorageQueue();

    // Setup automatic capture if enabled
    if (this.config.get('autoCapture')) {
      const cleanup = setupGlobalHandlers(this);
      this.cleanupHandlers.push(cleanup);
      this.config.debug('Global handlers installed');
    }

    // Setup browser event listeners
    this.setupBrowserListeners();

    // Initial queue flush
    this.flushQueue();
  }

  private setupBrowserListeners(): void {
    if (typeof window === 'undefined') return;

    // Flush queue when coming back online
    const onOnline = (): void => {
      this.config.debug('Online - flushing queue');
      this.flushQueue();
    };
    window.addEventListener('online', onOnline);
    this.cleanupHandlers.push(() => window.removeEventListener('online', onOnline));

    // Flush queue when page becomes visible
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        this.flushQueue();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.cleanupHandlers.push(() =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
    );

    // Send pending events via Beacon on unload
    const onBeforeUnload = (): void => {
      this.sendPendingViaBeacon();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    this.cleanupHandlers.push(() =>
      window.removeEventListener('beforeunload', onBeforeUnload)
    );
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

      // Add browser-specific data
      event.userAgent = navigator.userAgent;
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
      event.userAgent = navigator.userAgent;

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

    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.config.debug('Offline - queueing event');
      this.enqueue(processedEvent);
      return null;
    }

    const result = await this.transport.send(processedEvent);

    if (!result.success) {
      this.config.debug('Send failed, queueing event', result.error);
      this.enqueue(processedEvent);
      return null;
    }

    this.config.debug('Event sent successfully', result.id);
    return result.id || null;
  }

  /**
   * Add event to offline queue
   */
  private enqueue(event: ErrorEvent): void {
    const events = this.queue.get();
    if (events.length >= MAX_QUEUE_SIZE) {
      events.shift(); // Remove oldest
    }
    events.push(event);
    this.queue.set(events);
  }

  /**
   * Flush offline queue
   */
  private async flushQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      const events = this.queue.get();
      const remaining: ErrorEvent[] = [];

      for (const event of events) {
        const result = await this.transport.send(event);
        if (!result.success) {
          remaining.push(event);
          break; // Stop on first failure
        }
        this.config.debug('Queue event sent', result.id);
      }

      // Keep remaining events in queue
      if (remaining.length < events.length) {
        this.queue.set(remaining);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Send pending events via Beacon API (for page unload)
   */
  private sendPendingViaBeacon(): void {
    const events = this.queue.get();
    for (const event of events) {
      this.beaconTransport.send(event);
    }
    // Clear queue after attempting to send via beacon
    this.queue.clear();
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
