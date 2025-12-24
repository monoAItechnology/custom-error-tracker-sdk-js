/**
 * Node.js SDK - Global Error Handlers
 *
 * Hooks into process.on('uncaughtException') and process.on('unhandledRejection')
 * to capture errors automatically.
 */

import type { NodeClient } from '../client';

/**
 * Set up global error handlers for Node.js
 * @returns Cleanup function to remove handlers
 */
export function setupGlobalHandlers(client: NodeClient): () => void {
  const cleanupFns: (() => void)[] = [];

  // uncaughtException - handles synchronous errors that bubble up
  const onUncaughtException = (error: Error): void => {
    client.getConfig().debug('Caught uncaughtException', error.message);

    client
      .captureException(error, 'Critical')
      .finally(() => {
        // Give some time for the request to complete, then exit
        setTimeout(() => {
          process.exit(1);
        }, 2000);
      });
  };

  process.on('uncaughtException', onUncaughtException);
  cleanupFns.push(() => {
    process.removeListener('uncaughtException', onUncaughtException);
  });

  // unhandledRejection - handles unhandled Promise rejections
  const onUnhandledRejection = (reason: unknown): void => {
    client.getConfig().debug('Caught unhandledRejection', String(reason));
    client.captureException(reason, 'Error');
  };

  process.on('unhandledRejection', onUnhandledRejection);
  cleanupFns.push(() => {
    process.removeListener('unhandledRejection', onUnhandledRejection);
  });

  // SIGTERM/SIGINT - flush before exit
  const onSignal = async (): Promise<void> => {
    client.getConfig().debug('Received termination signal, flushing...');
    await client.flush();
    process.exit(0);
  };

  process.on('SIGTERM', onSignal);
  process.on('SIGINT', onSignal);
  cleanupFns.push(() => {
    process.removeListener('SIGTERM', onSignal);
    process.removeListener('SIGINT', onSignal);
  });

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
