import tap from 'tap';
import sinon from 'sinon';
import pino, { PinoLambdaLogger, ExtendedPinoOptions } from '../index';

process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs14';
sinon.useFakeTimers(Date.UTC(2016, 11, 1, 6, 0, 0, 0));

tap.test('should log a simple info message', (t) => {
  const [log, output] = createLogger();

  log.info('Simple message');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log an info message with data', (t) => {
  const [log, output] = createLogger();

  log.info({ data: { stuff: 'unicorns' } }, 'Message with data');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log an info message with requestId', (t) => {
  const [log, output] = createLogger();

  log.withRequest({}, { awsRequestId: '12345' });
  log.info('Message with request ID');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log an error message with requestId', (t) => {
  const [log, output] = createLogger();

  log.withRequest({}, { awsRequestId: '12345' });
  log.error('Message with request ID');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log correlation headers', (t) => {
  const [log, output] = createLogger();

  log.withRequest(
    { headers: { 'x-correlation-data': 'abbb', 'x-correlation-service': 'tyue' } },
    { awsRequestId: '98875' },
  );
  log.error('Message with correlation ids');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should log an error message with apiRequestId', (t) => {
  const [log, output] = createLogger();

  log.withRequest({ requestContext: { requestId: '59996' } }, { awsRequestId: '12345' });
  log.error('Message with apiRequestId');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should add tags with a child logger', (t) => {
  const [log, output] = createLogger();
  const childLogger = log.child({ userId: 12 });

  log.withRequest({}, { awsRequestId: '9048989' });
  childLogger.info('Message with userId');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should preserve mixins', (t) => {
  let n = 0;
  const [log, output] = createLogger({
    mixin () {
      return { line: ++n }
    }
  });

  log.withRequest({}, { awsRequestId: '431234' });
  log.info('Message with mixin line 1');
  log.info('Message with mixin line 2');
  t.matchSnapshot(output.buffer);
  t.end();
});

tap.test('should capture xray trace IDs', (t) => {
  process.env._X_AMZN_TRACE_ID = 'x-1-2e2323r1234r4';
  
  const [log, output] = createLogger();

  log.withRequest({}, { awsRequestId: '431234' });
  log.info('Message with trace ID');
  t.matchSnapshot(output.buffer);

  process.env._X_AMZN_TRACE_ID = undefined;
  t.end();
});


/**
 * Creates a test logger and output buffer for assertions
 * Returns the logger and the buffer
 */
function createLogger(options?: ExtendedPinoOptions): [PinoLambdaLogger, { buffer: string }] {
  const output = {
    buffer: 'undefined',
  };

  const logger = pino({
    ...options,
    streamWriter: (str: string | Uint8Array): boolean => {
      output.buffer = (str as string).trim();
      return true;
    },
    base: null,
  });

  return [logger, output];
}
