import { LoggerOptions } from 'pino';
import pino from '.';

const pinoOptions: LoggerOptions = {
  prettyPrint: true,
  base: null,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  level: process.env.LOG_LEVEL || 'info',
  mixin: () => {
    return { service: 'users-service' };
  }
};

const loggerA = pino(pinoOptions);
const loggerB = pino(pinoOptions);

export const handler = async (event: any, context: any) => {
  loggerA.withRequest(event, context);

  const obj = {
    some: 'complex',
    nested: {
      yes: 'object',
    },
  };

  loggerA.debug('Wont show normally');
  loggerA.info('an info message');
  loggerB.info('Logger B message');
  loggerA.warn(obj, 'a warning');
  loggerA.error(new Error('Error'), 'an error');

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};

handler(
  {
    headers: {
      'x-correlation-debug': 'true',
    },
  },
  { awsRequestId: 'D37D98-N327HD3-2341234' },
);

handler(
  {
    headers: {
      'x-correlation-magic': '12344',
    },
  },
  { awsRequestId: '324234-N327HD3-2341234' },
);
