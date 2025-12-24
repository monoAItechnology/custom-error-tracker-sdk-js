/**
 * Error Tracker SDK - Core Types
 */

// === Configuration Types ===

export type Environment = 'Production' | 'Staging' | 'Development';
export type ErrorLevel = 'Error' | 'Warning' | 'Critical';

export interface ErrorTrackerOptions {
  /** API endpoint URL (e.g., https://your-functions-url.azurewebsites.net) */
  dsn: string;

  /** Application identifier */
  appId: string;

  /** Git commit hash for source linking */
  commitHash: string;

  /** Environment identifier */
  environment: Environment;

  /** Optional API key for authenticated endpoints */
  apiKey?: string;

  /** Enable/disable automatic error capture (default: true) */
  autoCapture?: boolean;

  /** Debug mode - logs SDK activity to console (default: false) */
  debug?: boolean;

  /** Before send hook - return null to drop the event */
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null | Promise<ErrorEvent | null>;

  /** Tags to add to all events */
  tags?: Record<string, string>;

  /** User information */
  user?: UserInfo;
}

// === Event Types ===

export interface ErrorEvent {
  appId: string;
  commitHash: string;
  environment: Environment;
  level: ErrorLevel;
  message: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
  sourceContext?: SourceContext;
  userAgent?: string;
  timestamp?: string;
  tags?: Record<string, string>;
  user?: UserInfo;
}

export interface SourceContext {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  functionName?: string;
}

export interface UserInfo {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

// === Transport Types ===

export interface Transport {
  send(event: ErrorEvent): Promise<TransportResponse>;
  flush?(timeout: number): Promise<void>;
}

export interface TransportResponse {
  success: boolean;
  id?: string;
  statusCode?: number;
  error?: string;
}

// === API Response Types ===

export interface IngestErrorResponse {
  success: boolean;
  id: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: string[];
}

// === Scope Types ===

export interface Scope {
  tags: Record<string, string>;
  user?: UserInfo;
  extras: Record<string, unknown>;
}
