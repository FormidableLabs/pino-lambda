import { ILogFormatter } from '../types';

/**
 * Formats the log in native pino format
 */
export class PinoLogFormatter implements ILogFormatter {
  format(buffer: string): string {
    return buffer;
  }
}
