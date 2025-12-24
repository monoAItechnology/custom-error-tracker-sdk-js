/**
 * Browser SDK - Beacon Transport
 *
 * Uses the Beacon API to send events when the page is unloading.
 * This ensures events are sent even when the user closes the tab.
 */

import {
  BaseTransport,
  type TransportResponse,
  type ErrorEvent,
} from '@monoai/error-tracker-core';

/**
 * Transport using the Beacon API for page unload scenarios
 */
export class BeaconTransport extends BaseTransport {
  async send(event: ErrorEvent): Promise<TransportResponse> {
    try {
      // Beacon API doesn't support custom headers, so we can't send API key
      // For authenticated endpoints, use FetchTransport instead
      const payload = this.buildPayload(event);
      const blob = new Blob([payload], { type: 'application/json' });

      const success = navigator.sendBeacon(this.endpoint, blob);

      return { success };
    } catch {
      return { success: false, error: 'Beacon API failed' };
    }
  }
}
