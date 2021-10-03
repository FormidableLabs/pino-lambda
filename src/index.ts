import pino from 'pino';
import { GlobalContextStorageProvider } from './context';
import { ExtendedPinoOptions, PinoLambdaLogger } from './types';
import { withRequest } from './request';
import { createStream } from './stream';

/**
 * Exports a default constructor with an extended instance of Pino
 * that provides convinience methods for use with AWS Lambda
 */
export default (extendedPinoOptions?: ExtendedPinoOptions): PinoLambdaLogger => {
  const options = extendedPinoOptions ?? {};
  const storageProvider = (options.storageProvider =
    extendedPinoOptions?.storageProvider || GlobalContextStorageProvider);

  // attach request values to logs
  const pinoOptions = {
    ...options,
    mixin: () => {
      // preserves original mixin set in options
      if (typeof options.mixin === 'function') {
        const originalMixinResult = options.mixin();
        return { ...originalMixinResult, ...storageProvider.getContext() };
      }
      return { ...storageProvider.getContext() };
    },
  };

  // construct a pino logger and set its destination
  const logger = (pino(pinoOptions, createStream(pinoOptions)) as unknown) as PinoLambdaLogger;

  // extend the base logger
  logger.withRequest = withRequest(logger, pinoOptions);

  return logger;
};

// reexport all public types
export * from './formatters';
export * from './types';
