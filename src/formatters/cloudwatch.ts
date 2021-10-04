import pino from 'pino';
import { GlobalContextStorageProvider } from '../context';
import { ILogFormatter, ExtendedPinoOptions } from '../types';

const formatLevel = (level: string | number): string => {
  if (typeof level === 'string') {
    return level.toLocaleUpperCase();
  } else if (typeof level === 'number') {
    return pino.levels.labels[level]?.toLocaleUpperCase();
  }
  return level;
};

/**
 * Formats the log in native cloudwatch format.
 * Default format for pino-lambda
 */
export class CloudwatchLogFormatter implements ILogFormatter {
  format(buffer: string, options: ExtendedPinoOptions): string {
    /**
       * Writes to stdout using the same method that AWS lambda uses
       * under the hood for console.log
       * This preserves the default log format of cloudwatch
       */
      let output = buffer;
      const { level, msg } = JSON.parse(buffer);
      const storageProvider = options.storageProvider || GlobalContextStorageProvider;
      const { awsRequestId } = storageProvider.getContext() || {};
      const time = new Date().toISOString();
      const levelTag = formatLevel(level);

      output = `${time}${awsRequestId ? `\t${awsRequestId}` : ''}\t${levelTag}\t${msg}\t${buffer}`;
      return output;
  }
}
