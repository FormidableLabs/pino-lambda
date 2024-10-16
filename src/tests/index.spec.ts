import pino, { Logger, LoggerOptions } from 'pino';
import tap from 'tap';
import sinon from 'sinon';

import {
  pinoLambdaDestination,
  PinoLambdaOptions,
  lambdaRequestTracker,
  LambdaRequestTrackerOptions,
  LambdaContext,
  LambdaEvent,
  PinoLogFormatter,
  LogData,
  StructuredLogFormatter,
} from '../';

import { GlobalContextStorageProvider } from '../context';

sinon.useFakeTimers(Date.UTC(2016, 11, 1, 6, 0, 0, 0));

tap.test('should log a simple info message', (t) => {
  const { log, output } = createLogger();

  log.info('Simple message');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log an info message with data', (t) => {
  const { log, output } = createLogger();

  log.info({ data: { stuff: 'unicorns' } }, 'Message with data');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log an info message with requestId', (t) => {
  const { log, output, withRequest } = createLogger();

  withRequest({}, { awsRequestId: '12345' });
  log.info('Message with request ID');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log an error message with requestId', (t) => {
  const { log, output, withRequest } = createLogger();

  withRequest({}, { awsRequestId: '12345' });
  log.error('Message with request ID');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log capitalize string levels', (t) => {
  const { log, output } = createLogger();

  log.info({ level: 'debug' }, 'Simple message');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should not fail if level is an object', (t) => {
  const { log, output } = createLogger();

  log.info({ level: {} }, 'Simple message');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should not fail if level number is invalid', (t) => {
  const { log, output } = createLogger();

  log.info({ level: 98 }, 'Simple message');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log correlation headers', (t) => {
  const { log, output, withRequest } = createLogger();

  withRequest(
    { headers: { 'x-correlation-data': 'abbb', 'x-correlation-service': 'tyue' } },
    { awsRequestId: '98875' },
  );
  log.error('Message with correlation ids');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should allow modifying the global context', (t) => {
  const { log, output, withRequest } = createLogger();

  withRequest(
    { headers: { 'x-correlation-data': 'abbb' } },
    { awsRequestId: '98875' },
  );

  GlobalContextStorageProvider.updateContext({ userId: '12' });

  log.error('Context updates');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should set correlation if to trace id if present', (t) => {
  const { log, output, withRequest } = createLogger();

  process.env['_X_AMZN_TRACE_ID'] = '168181818';
  
  withRequest(
    {},
    { awsRequestId: '98875' },
  );
  log.error('Message with trace id');
  t.matchSnapshot(output.buffer);

  delete process.env['_X_AMZN_TRACE_ID'];
  t.end();
});

tap.test('should log an error message with apiRequestId', (t) => {
  const { log, output, withRequest } = createLogger();

  withRequest({ requestContext: { requestId: '59996' } }, { awsRequestId: '12345' });
  log.error('Message with apiRequestId');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should add tags with a child logger', (t) => {
  const { log, output, withRequest } = createLogger();
  const childLogger = log.child({ userId: 12 });

  withRequest({}, { awsRequestId: '9048989' });
  childLogger.info('Message with userId');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should preserve mixins', (t) => {
  let n = 0;
  const { log, output, withRequest } = createLogger({
    mixin() {
      return { line: ++n };
    },
  });

  withRequest({}, { awsRequestId: '431234' });
  log.info('Message with mixin line 1');
  log.info('Message with mixin line 2');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should capture custom request data', (t) => {
  const { log, output, withRequest } = createLogger(undefined, {
    requestMixin: (event, context) => ({
      host: event.headers?.host,
      functionName: context.functionName,
    }),
  });

  withRequest({ headers: { host: 'www.host.com' } }, { awsRequestId: '431234' });
  log.info('Message with trace ID');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should allow removing default request data', (t) => {
  const { log, output, withRequest } = createLogger(undefined, {
    requestMixin: () => ({
      'x-correlation-id': undefined,
    }),
  });

  withRequest({}, { awsRequestId: '431234' });
  log.info('Message with trace ID');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should allow different types of context values', (t) => {
  const { log, output, withRequest } = createLogger(undefined, {
    requestMixin: () => ({
      'number': 12,
      'boolean': true,
      'object': {
        foo: "bar"
      }
    }),
  });

  withRequest({}, { awsRequestId: '431234' });
  log.info('Message with trace ID');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should allow default pino formatter', (t) => {
  const { log, output, withRequest } = createLogger(undefined, {
    formatter: new PinoLogFormatter(),
  });

  withRequest({}, { awsRequestId: '431234' });
  log.info('Message with pino formatter');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should allow structured logging format for cloudwatch', (t) => {
  const { log, output, withRequest } = createLogger(undefined, {
    formatter: new StructuredLogFormatter(),
  });

  withRequest({}, { awsRequestId: '431234' });
  log.info('Message with pino formatter');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should allow custom formatter', (t) => {
  const bananaFormatter = {
    format(data: LogData) {
      return `[BANANA] ${JSON.stringify(data)}`;
    },
  };

  const { log, output, withRequest } = createLogger(undefined, {
    formatter: bananaFormatter,
  });

  withRequest({}, { awsRequestId: '431234' });
  log.info('Message with custom formatter');
  t.matchSnapshot(output.buffer);
  t.end();
});

/**
 * Creates a test logger and output buffer for assertions
 * Returns the logger and the buffer
 * 
 * CAUTION:
 * Usage defined below is for the purposes of the Test Harness
 * and is not reflective of the actual usage of pino-lambda
 */
function createLogger(
  options?: LoggerOptions,
  mixedOptions?: LambdaRequestTrackerOptions & PinoLambdaOptions,
): {
  log: Logger;
  output: { buffer: string };
  withRequest: (event: LambdaEvent, context: LambdaContext) => void;
} {
  const output = {
    buffer: 'undefined',
  };

  const destination = pinoLambdaDestination({
    ...mixedOptions,
    streamWriter: (str: string | Uint8Array): boolean => {
      output.buffer = (str as string).trim();
      return true;
    },
  });

  const log = pino(
    {
      base: null,
      ...options,
    },
    destination,
  );

  const withRequest = lambdaRequestTracker({
    ...mixedOptions,
  });

  return { log, output, withRequest };
}
