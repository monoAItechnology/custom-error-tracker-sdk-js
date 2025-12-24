/**
 * Error Tracker SDK - Safe Execution Utilities
 *
 * These utilities ensure the SDK never crashes the host application.
 */

/**
 * Execute a function safely, returning a fallback value on error
 */
export function safeExecute<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/**
 * Execute an async function safely, returning a fallback value on error
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * Wrap a function to catch and handle errors silently
 */
export function wrapWithSafeHandler<T extends (...args: unknown[]) => unknown>(
  fn: T,
  onError?: (error: Error) => void
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((err) => {
          onError?.(err as Error);
          return undefined;
        }) as ReturnType<T>;
      }
      return result as ReturnType<T>;
    } catch (err) {
      onError?.(err as Error);
      return undefined as ReturnType<T>;
    }
  }) as T;
}

/**
 * Execute a function with a timeout
 */
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}
