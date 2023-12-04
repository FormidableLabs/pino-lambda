import { ILogFormatter, LogData } from '../types';
import { formatLevel } from './format';

/**
 * Formats the log in structured JSON format while
 * including the Lambda context data automatically
 * @see https://aws.amazon.com/blogs/compute/introducing-advanced-logging-controls-for-aws-lambda-functions
 */
export class StructuredLogFormatter implements ILogFormatter {
  format({ awsRequestId, level, ...data }: LogData): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: formatLevel(level),
      requestId: awsRequestId,
      message: data,
    });
  }
}
