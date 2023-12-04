import { ILogFormatter, LogData } from '../types';
import { formatLevel } from './format';

/**
 * Formats the log in native cloudwatch format and
 * mixes in the Lambda request context data
 * Default format for pino-lambda
 */
export class CloudwatchLogFormatter implements ILogFormatter {
  format(data: LogData): string {
    const { awsRequestId, level, msg } = data;

    // extract parts for message format
    const time = new Date().toISOString();
    const levelTag = formatLevel(level);

    return `${time}${
      awsRequestId ? `\t${awsRequestId}` : ''
    }\t${levelTag}\t${msg}\t${JSON.stringify(data)}`;
  }
}
