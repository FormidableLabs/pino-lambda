import { LoggerOptions, Logger } from "pino";
import { ContextStorageProvider } from "./context";

export type PinoLambdaLogger = Logger & {
  withRequest: (event: LambdaEvent, context: LambdaContext) => void;
};

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

/**
 * Interface for implementing log formatters
 * @interface ILogFormatter
 */
export interface ILogFormatter {
  /**
   * Formats the log message using the incoming buffer
   *
   * @param {string} buffer
   * @returns {string} The formatted output which must end with a newline
   * @memberof ILogFormatter
   */
  format(buffer: string, options?: ExtendedPinoOptions): string;
}

/**
 * Extended options for pino logging
 *
 * @export
 * @interface ExtendedPinoOptions
 * @extends {LoggerOptions}
 */
export interface ExtendedPinoOptions extends LoggerOptions {
  formatter?: ILogFormatter;
  requestMixin?: (
    event: LambdaEvent,
    context: LambdaContext,
  ) => { [key: string]: string | undefined };
  storageProvider?: ContextStorageProvider;
  streamWriter?: (str: string | Uint8Array) => boolean;
}
