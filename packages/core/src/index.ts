/**
 * @monoai/error-tracker-core
 *
 * Core types and utilities for Error Tracker SDK
 */

// Types
export type {
  Environment,
  ErrorLevel,
  ErrorTrackerOptions,
  ErrorEvent,
  SourceContext,
  UserInfo,
  Transport,
  TransportResponse,
  IngestErrorResponse,
  ApiErrorResponse,
  Scope,
} from './types';

// Configuration
export { Config } from './config';

// Transport
export { BaseTransport } from './transport';

// Hub
export { BaseHub } from './hub';

// Utilities
export {
  safeExecute,
  safeExecuteAsync,
  wrapWithSafeHandler,
  withTimeout,
} from './utils/safe';

export {
  normalizeError,
  extractMessage,
  isErrorLike,
} from './utils/normalize';

export {
  parseStackTrace,
} from './utils/stacktrace';
