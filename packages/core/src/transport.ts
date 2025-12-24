/**
 * Error Tracker SDK - Base Transport
 */

import type { ErrorEvent, Transport, TransportResponse, IngestErrorResponse } from './types';
import type { Config } from './config';

export abstract class BaseTransport implements Transport {
  protected config: Config;
  protected endpoint: string;

  constructor(config: Config) {
    this.config = config;
    const dsn = config.get('dsn')!;
    this.endpoint = `${dsn.replace(/\/$/, '')}/api/ingest-error`;
  }

  abstract send(event: ErrorEvent): Promise<TransportResponse>;

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const apiKey = this.config.get('apiKey');
    if (apiKey) {
      headers['x-functions-key'] = apiKey;
    }

    return headers;
  }

  protected buildPayload(event: ErrorEvent): string {
    // Build API request payload matching IngestErrorRequest format
    const payload: Record<string, unknown> = {
      appId: event.appId,
      commitHash: event.commitHash,
      environment: event.environment,
      level: event.level,
      message: event.message,
    };

    if (event.stackTrace) {
      payload.stackTrace = event.stackTrace;
    }

    // Merge tags and extras into metadata
    const metadata: Record<string, unknown> = {
      ...event.metadata,
    };
    if (event.tags && Object.keys(event.tags).length > 0) {
      metadata.tags = event.tags;
    }
    if (event.user) {
      metadata.user = event.user;
    }
    if (Object.keys(metadata).length > 0) {
      payload.metadata = metadata;
    }

    if (event.sourceContext) {
      payload.sourceContext = event.sourceContext;
    }

    if (event.userAgent) {
      payload.userAgent = event.userAgent;
    }

    return JSON.stringify(payload);
  }

  protected parseResponse(
    response: IngestErrorResponse | { error: string }
  ): TransportResponse {
    if ('success' in response && response.success) {
      return { success: true, id: (response as IngestErrorResponse).id };
    }
    return { success: false, error: (response as { error: string }).error };
  }
}
