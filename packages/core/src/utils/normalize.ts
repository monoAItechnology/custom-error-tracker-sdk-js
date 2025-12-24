/**
 * Error Tracker SDK - Error Normalization Utilities
 */

/**
 * Normalize any value into an Error object
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    const message =
      (errorObj.message as string) ||
      (errorObj.reason as string) ||
      String(error);
    const err = new Error(message);
    if (errorObj.stack) {
      err.stack = errorObj.stack as string;
    }
    if (errorObj.name) {
      err.name = errorObj.name as string;
    }
    return err;
  }

  return new Error(String(error));
}

/**
 * Extract a message string from any error value
 */
export function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    return (
      (errorObj.message as string) ||
      (errorObj.reason as string) ||
      String(error)
    );
  }
  return String(error);
}

/**
 * Check if a value is an Error-like object
 */
export function isErrorLike(value: unknown): value is Error {
  return (
    value instanceof Error ||
    (typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof (value as Record<string, unknown>).message === 'string')
  );
}
