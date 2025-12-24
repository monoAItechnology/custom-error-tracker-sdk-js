/**
 * Node.js SDK - Global Client Reference
 *
 * This module holds the singleton client instance to avoid circular dependencies.
 */

import type { NodeClient } from './client';

// Global client instance
let _client: NodeClient | null = null;

export function setGlobalClient(client: NodeClient | null): void {
  _client = client;
}

export function getGlobalClient(): NodeClient | null {
  return _client;
}
