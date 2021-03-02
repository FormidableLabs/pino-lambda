import pino, { DestinationStream, LevelMapping, LoggerOptions, Logger } from 'pino';
import { GlobalContextStorageProvider, ContextStorageProvider, ContextMap } from './context';

export interface ExtendedPinoOptions extends LoggerOptions {
  storageProvider?: ContextStorageProvider;
  streamWriter?: (str: string | Uint8Array) => boolean;
}

interface LambdaContext {
  awsRequestId: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface LamdbaEvent {
  headers?: {
    [key: string]: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface PinoLambdaExtensionOptions {
  levels: LevelMapping;
  options: ExtendedPinoOptions;
}

const AMAZON_TRACE_ID = '_X_AMZN_TRACE_ID';
const CORRELATION_HEADER = 'x-correlation-';
const CORRELATION_ID = `${CORRELATION_HEADER}id`;
const CORRELATION_TRACE_ID = `${CORRELATION_HEADER}trace-id`;
const CORRELATION_DEBUG = `${CORRELATION_HEADER}debug`;

const isLamdbaExecution = (): boolean => !!process.env.AWS_EXECUTION_ENV;
const formatLevel = (level: string | number, levels: LevelMapping): string => {
  if (typeof level === 'string') {
    return level.toLocaleUpperCase();
  } else if (typeof level === 'number') {
    return levels.labels[level]?.toLocaleUpperCase();
  }
  return level;
};

/**
 * Custom destination stream for Pino
 * @param options Pino options
 * @param storageProvider Global storage provider for request values
 */
const pinolambda = ({ levels, options }: PinoLambdaExtensionOptions): DestinationStream => ({
  write(buffer: string) {
    let output = buffer;
    if (!options.prettyPrint) {
      /**
       * Writes to stdout using the same method that AWS lambda uses
       * under the hood for console.log
       * This preserves the default log format of cloudwatch
       */
      const { level, msg } = JSON.parse(buffer);
      const storageProvider = options.storageProvider || GlobalContextStorageProvider;
      const { awsRequestId } = storageProvider.getContext() || {};
      const time = new Date().toISOString();
      const levelTag = formatLevel(level, levels);

      output = `${time}${awsRequestId ? `\t${awsRequestId}` : ''}\t${levelTag}\t${msg}\t${buffer}`;
      output = output.replace(/\n/, '\r');
      output += '\n';
    }

    if (options.streamWriter) {
      return options.streamWriter(output);
    }
    return process.stdout.write(output);
  },
});

export type PinoLambdaLogger = Logger & {
  withRequest: (event: LamdbaEvent, context: LambdaContext) => void;
};

/**
 * Exports a default constructor with an extended instance of Pino
 * that provides convinience methods for use with AWS Lambda
 */
export default (extendedPinoOptions?: ExtendedPinoOptions): PinoLambdaLogger => {
  if (!isLamdbaExecution) {
    return (pino(extendedPinoOptions) as unknown) as PinoLambdaLogger;
  }

  const options = extendedPinoOptions ?? {};
  const storageProvider = extendedPinoOptions?.storageProvider || GlobalContextStorageProvider;

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
  const logger = (pino(
    pinoOptions,
    pinolambda({ options: pinoOptions, levels: pino.levels }),
  ) as unknown) as PinoLambdaLogger;

  // keep a reference to the original logger level
  const configuredLevel = logger.level;

  // extend the base logger
  logger.withRequest = (event: LamdbaEvent, context: LambdaContext): void => {
    const ctx: ContextMap = {
      awsRequestId: context.awsRequestId,
    };

    // capture api gateway request ID
    const apiRequestId = event.requestContext?.requestId;
    if (apiRequestId) {
      ctx.apiRequestId = apiRequestId;
    }

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
