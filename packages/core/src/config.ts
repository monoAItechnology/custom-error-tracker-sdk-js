/**
 * Error Tracker SDK - Configuration Management
 */

import type { ErrorTrackerOptions, Environment } from './types';

const DEFAULT_OPTIONS: Partial<ErrorTrackerOptions> = {
  autoCapture: true,
  debug: false,
  environment: 'Development',
};

const VALID_ENVIRONMENTS: Environment[] = ['Production', 'Staging', 'Development'];

export class Config {
  private options: ErrorTrackerOptions;

  constructor(options: ErrorTrackerOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as ErrorTrackerOptions;
    this.validate();
  }

  private validate(): void {
    if (!this.options.dsn) {
      throw new Error('ErrorTracker: dsn is required');
    }
    if (!this.options.appId) {
      throw new Error('ErrorTracker: appId is required');
    }
    if (!this.options.commitHash) {
      throw new Error('ErrorTracker: commitHash is required');
    }
    if (!VALID_ENVIRONMENTS.includes(this.options.environment)) {
      throw new Error(
        `ErrorTracker: environment must be one of: ${VALID_ENVIRONMENTS.join(', ')}`
      );
    }
  }

  get<K extends keyof ErrorTrackerOptions>(key: K): ErrorTrackerOptions[K] {
    return this.options[key];
  }

  getAll(): ErrorTrackerOptions {
    return { ...this.options };
  }

  update(updates: Partial<ErrorTrackerOptions>): void {
    this.options = { ...this.options, ...updates };
  }

  /** Log debug messages if debug mode is enabled */
  debug(message: string, ...args: unknown[]): void {
    if (this.options.debug) {
      console.debug(`[ErrorTracker] ${message}`, ...args);
    }
  }
}
