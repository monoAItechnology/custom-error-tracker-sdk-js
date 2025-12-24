/**
 * Error Tracker SDK - Base Hub (Client)
 */

import type {
  ErrorTrackerOptions,
  ErrorEvent,
  ErrorLevel,
  UserInfo,
  Scope,
} from './types';
import { Config } from './config';

/**
 * BaseHub is the central coordination point for the SDK.
 * It manages configuration, scope (tags, user, extras), and event building.
 */
export abstract class BaseHub {
  protected config: Config;
  protected scope: Scope;
  protected initialized: boolean = false;

  constructor(options: ErrorTrackerOptions) {
    this.config = new Config(options);
    this.scope = {
      tags: options.tags || {},
      user: options.user,
      extras: {},
    };
    this.initialized = true;
    this.config.debug('SDK initialized');
  }

  /** Capture an exception and send to the server */
  abstract captureException(
    error: Error | unknown,
    level?: ErrorLevel
  ): Promise<string | null>;

  /** Capture a message and send to the server */
  abstract captureMessage(
    message: string,
    level?: ErrorLevel
  ): Promise<string | null>;

  /** Set user information for all future events */
  setUser(user: UserInfo | null): void {
    this.scope.user = user || undefined;
    this.config.debug('User set', user);
  }

  /** Set a single tag */
  setTag(key: string, value: string): void {
    this.scope.tags[key] = value;
  }

  /** Set multiple tags */
  setTags(tags: Record<string, string>): void {
    this.scope.tags = { ...this.scope.tags, ...tags };
  }

  /** Set a single extra value */
  setExtra(key: string, value: unknown): void {
    if (value === undefined) {
      delete this.scope.extras[key];
    } else {
      this.scope.extras[key] = value;
    }
  }

  /** Set multiple extra values */
  setExtras(extras: Record<string, unknown>): void {
    this.scope.extras = { ...this.scope.extras, ...extras };
  }

  /** Get current configuration */
  getConfig(): Config {
    return this.config;
  }

  /** Check if SDK is initialized */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Build an ErrorEvent from a message and optional error
   */
  protected buildEvent(
    message: string,
    level: ErrorLevel,
    error?: Error
  ): ErrorEvent {
    return {
      appId: this.config.get('appId')!,
      commitHash: this.config.get('commitHash')!,
      environment: this.config.get('environment')!,
      level,
      message,
      stackTrace: error?.stack,
      metadata:
        Object.keys(this.scope.extras).length > 0
          ? { ...this.scope.extras }
          : undefined,
      tags:
        Object.keys(this.scope.tags).length > 0
          ? { ...this.scope.tags }
          : undefined,
      user: this.scope.user,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Apply beforeSend hook to an event
   * Returns null if the event should be dropped
   */
  protected async applyBeforeSend(event: ErrorEvent): Promise<ErrorEvent | null> {
    const beforeSend = this.config.get('beforeSend');
    if (beforeSend) {
      try {
        return await beforeSend(event);
      } catch (err) {
        this.config.debug('beforeSend threw an error', err);
        return event; // Don't drop the event if beforeSend fails
      }
    }
    return event;
  }
}
