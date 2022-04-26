import { ContextStorageProvider } from './context';

export interface LambdaContext {
  awsRequestId: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface LambdaEvent {
  headers?: {
    [key: string]: string | undefined;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface LogData {
  awsRequestId: string;
  level: string;
  msg?: string;
}

/**
 * Interface for implementing log formatters
 */
export interface ILogFormatter {
  /**
   * Formats the log message using the incoming buffer
   *
   * @param {object} data
   * @returns {string} The formatted output which must end with a newline
   * @memberof ILogFormatter
   */
  format(data: LogData): string;
}

/**
 * Extended options for pino logging
 */
export interface PinoLambdaOptions {
  /**
   * Custom log formatter.
   * If not supplied, defaults to `LambdaLogFormatter`.
   */
  formatter?: ILogFormatter;
  /**
   * Custom storage provider.
   * If not supplied, defaults to global context storage.
   * If used outside of the Lambda environment, you may want to provide
   * your own implementation here.
   */
  storageProvider?: ContextStorageProvider;
  /**
   * Custom streamwriter.
   * This option is currently only used for testing and development
   */
  streamWriter?: (str: string | Uint8Array) => boolean;
}

/**
 * Options for extending the request context
 */
export interface LambdaRequestTrackerOptions {
  /**
   * Per request level mixin with access to the Lambda
   * event and context information for each request
   */
  requestMixin?: (
    event: LambdaEvent,
    context: LambdaContext,
  ) => { [key: string]: string | undefined };
  /**
   * Custom storage provider.
   * If not supplied, defaults to global context storage.
   * If used outside of the Lambda environment, you may want to provide
   * your own implementation here.
   */
  storageProvider?: ContextStorageProvider;
}
