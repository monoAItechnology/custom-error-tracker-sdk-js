/**
 * Browser SDK - Fetch Transport
 */

import {
  BaseTransport,
  type TransportResponse,
  type ErrorEvent,
} from '@monoai/error-tracker-core';

/**
 * Transport using the Fetch API for browsers
 */
export class FetchTransport extends BaseTransport {
  async send(event: ErrorEvent): Promise<TransportResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: this.buildPayload(event),
        keepalive: true, // Allows request to outlive page
      });

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
