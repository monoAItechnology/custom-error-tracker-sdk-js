/**
 * Node.js SDK - Express Middleware
 */

import type { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';
import type { ErrorLevel } from '@monoai/error-tracker-core';
import { getGlobalClient } from '../globals';
import type { NodeClient } from '../client';

// Helper functions to avoid circular dependency
function getClient(): NodeClient | null {
  return getGlobalClient();
}

function captureException(error: Error | unknown, level?: ErrorLevel): Promise<string | null> {
  const client = getGlobalClient();
  if (!client) {
    console.warn('ErrorTracker: Not initialized. Call init() first.');
    return Promise.resolve(null);
  }
  return client.captureException(error, level);
}

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    email?: string;
    [key: string]: unknown;
  };
}

interface ErrorHandlerOptions {
  /** Re-throw error after capturing (default: false) */
  rethrow?: boolean;
  /** Custom response to send (default: { error: 'Internal server error' }) */
  response?: unknown;
  /** Status code to send (default: 500) */
  statusCode?: number;
}

/**
 * Express error-handling middleware
 * Should be added after all routes
 *
 * Usage:
 * ```typescript
 * import { errorHandler } from '@monoai/error-tracker-node/express';
 *
 * app.use(errorHandler());
 * ```
 */
export function errorHandler(options: ErrorHandlerOptions = {}): ErrorRequestHandler {
  const {
    rethrow = false,
    response = { error: 'Internal server error' },
    statusCode = 500,
  } = options;

  return (
    err: Error,
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): void => {
    // Collect metadata
    const metadata: Record<string, unknown> = {
      path: req.path,
      method: req.method,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Add user info if available
    if (req.user?.id) {
      metadata.userId = req.user.id;
    }

    // Add request ID if present
    const requestId = req.get('x-request-id');
    if (requestId) {
      metadata.requestId = requestId;
    }

    // Capture error (fire and forget)
    const client = getClient();
    if (client) {
      client.setExtra('request', metadata);
      captureException(err, 'Error').finally(() => {
        // Clear extras after capture
        client.setExtra('request', undefined);
      });
    } else {
      // Fallback if not initialized
      console.error('ErrorTracker: Not initialized, error not captured:', err);
    }

    if (rethrow) {
      next(err);
      return;
    }

    // Send response
    res.status(statusCode).json(response);
  };
}

/**
 * Request handler middleware for additional context
 * Should be added before routes
 *
 * Usage:
 * ```typescript
 * import { requestHandler } from '@monoai/error-tracker-node/express';
 *
 * app.use(requestHandler());
 * ```
 */
export function requestHandler(): RequestHandler {
  return (req: RequestWithUser, _res: Response, next: NextFunction): void => {
    const client = getClient();

    if (client) {
      // Set request context
      if (req.user?.id) {
        client.setUser({
          id: req.user.id,
          email: req.user.email,
        });
      }

      // Add request ID as tag
      const requestId = req.get('x-request-id');
      if (requestId) {
        client.setTag('requestId', requestId);
      }
    }

    next();
  };
}

/**
 * Utility to wrap async route handlers
 *
 * Usage:
 * ```typescript
 * import { asyncHandler } from '@monoai/error-tracker-node/express';
 *
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
