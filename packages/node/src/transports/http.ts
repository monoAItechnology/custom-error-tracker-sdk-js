/**
 * Node.js SDK - HTTP Transport
 */

import https from 'https';
import http from 'http';
import {
  BaseTransport,
  type Config,
  type TransportResponse,
  type ErrorEvent,
} from '@monoai/error-tracker-core';

/**
 * Transport using Node.js http/https modules
 */
export class NodeTransport extends BaseTransport {
  private agent: https.Agent | http.Agent;
  private isHttps: boolean;

  constructor(config: Config) {
    super(config);

    const dsn = config.get('dsn')!;
    this.isHttps = dsn.startsWith('https://');

    this.agent = this.isHttps
      ? new https.Agent({ keepAlive: true })
      : new http.Agent({ keepAlive: true });
  }

  async send(event: ErrorEvent): Promise<TransportResponse> {
    return new Promise((resolve) => {
      try {
        const url = new URL(this.endpoint);
        const httpModule = this.isHttps ? https : http;

        const options: http.RequestOptions = {
          hostname: url.hostname,
          port: url.port || (this.isHttps ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: this.buildHeaders(),
          agent: this.agent,
          timeout: 10000,
        };

        const req = httpModule.request(options, (res) => {
          let data = '';

          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });

          res.on('end', () => {
            const statusCode = res.statusCode || 0;

            if (statusCode >= 200 && statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve(this.parseResponse(parsed));
              } catch {
                resolve({ success: true });
              }
            } else {
              resolve({
                success: false,
                statusCode,
                error: `HTTP ${statusCode}`,
              });
            }
          });
        });

        req.on('error', (error: Error) => {
          resolve({ success: false, error: error.message });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Request timeout' });
        });

        req.write(this.buildPayload(event));
        req.end();
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  async flush(timeout: number): Promise<void> {
    // Wait for any pending requests
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(timeout, 1000))
    );
  }
}
