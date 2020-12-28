import { Context } from 'aws-lambda';
import pino, { BaseLogger, DestinationStream, LoggerOptions } from 'pino';
import { GlobalContextStorageProvider, ContextStorageProvider, ContextMap } from './context';

export interface ExtendedPinoOptions extends LoggerOptions {
  storageProvider?: ContextStorageProvider;
}

export interface LamdbaEvent {
  headers?: {
    [key: string]: string
  }
}

export type PinoLambdaLogger = BaseLogger & {
  withRequest: (event: LamdbaEvent, context: Context) => void;
};

const AMAZON_TRACE_ID = '_X_AMZN_TRACE_ID';
const CORRELATION_HEADER = 'x-correlation-';
const CORRELATION_ID = `${CORRELATION_HEADER}id`;
const CORRELATION_TRACE_ID = `${CORRELATION_HEADER}trace-id`;
const CORRELATION_DEBUG = `${CORRELATION_HEADER}debug`;

/**
 * Custom destination stream for Pino
 * @param options Pino options
 * @param storageProvider Global storage provider for request values
 */
const pinolambda = (
  options: ExtendedPinoOptions,
  storageProvider: ContextStorageProvider,
): DestinationStream => ({
  write(buffer: string) {
    if (options.prettyPrint) {
      // prettyPrint buffer is not ndjson formatted
      process.stdout.write(buffer);
    } else {
      /**
       * Writes to stdout using the same method that AWS lambda uses
       * under the hood for console.log
       * This preserves the default log format of cloudwatch
       */
      const { level, msg } = JSON.parse(buffer);
      const { awsRequestId } = storageProvider.getContext();
      const time = new Date().toISOString();
      let line = `${time}\t${awsRequestId}\t${level.toUpperCase()}\t${msg}\t${buffer}`;
      line = line.replace(/\n/, '\r');
      process.stdout.write(line + '\n');
    }

    return true;
  },
});

/**
 * Exports a default constructor with an extended instance of Pino
 * that provides convinience methods for use with AWS Lambda
 */
export default (extendedPinoOptions?: ExtendedPinoOptions): PinoLambdaLogger => {
  const storageProvider: ContextStorageProvider =
    extendedPinoOptions?.storageProvider || GlobalContextStorageProvider;

  // attach request values to logs
  const options = extendedPinoOptions ?? {};
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
  const logger = (pino(
    pinoOptions,
    pinolambda(pinoOptions, storageProvider),
  ) as unknown) as PinoLambdaLogger;

  // keep a reference to the original logger level
  const configuredLevel = logger.level;

  // extend the base logger
  logger.withRequest = (event: LamdbaEvent, context: Context): void => {
    const ctx: ContextMap = {
      awsRequestId: context.awsRequestId,
    };

    // capture any correlation headers sent from upstream callers
    if (event.headers) {
      Object.keys(event.headers).forEach((header) => {
        if (header.toLowerCase().startsWith(CORRELATION_HEADER)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ctx[header] = event.headers![header];
        }
      });
    }

    // capture the xray trace id if its enabled
    if (process.env[AMAZON_TRACE_ID]) {
      ctx[CORRELATION_TRACE_ID] = process.env[AMAZON_TRACE_ID] as string;
    }

    // set the correlation id if not already set by upstream callers
    if (!ctx[CORRELATION_ID]) {
      ctx[CORRELATION_ID] = context.awsRequestId;
    }

    // if an upstream service requests DEBUG mode,
    // dynamically modify the logging level
    if (ctx[CORRELATION_DEBUG] === 'true') {
      logger.level = 'debug';
    } else {
      logger.level = configuredLevel;
    }

    storageProvider.setContext(ctx);
  };
  return logger;
};
