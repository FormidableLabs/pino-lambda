import pino from 'pino';
import { ILogFormatter, LogData } from '../types';

const formatLevel = (level: string | number): string => {
  if (typeof level === 'string') {
    return level.toLocaleUpperCase();
  } else if (typeof level === 'number') {
    return pino.levels.labels[level]?.toLocaleUpperCase();
  }
  return level;
};

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
