import { ILogFormatter, LogData } from '../types';

/**
 * Formats the log in native pino format while
 * including the Lambda context data automatically
 */
export class PinoLogFormatter implements ILogFormatter {
  format(data: LogData): string {
    return JSON.stringify(data);
  }
}
