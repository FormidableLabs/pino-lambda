pino-lambda
-----------------------

[![npm version](https://badge.fury.io/js/pino-lambda.svg)](https://badge.fury.io/js/pino-lambda)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Maintenance Status][maintenance-image]](#maintenance-status)

A custom destination for [pino](https://github.com/pinojs/pino) that takes advantage of the unique environment in AWS Lambda functions. [ref](https://github.com/pinojs/pino/blob/master/docs/api.md#destination)

By default, this destination reformats the log output so it matches the existing Cloudwatch format. The default pino log format [loses some of the built in support for request ID tracing](https://github.com/pinojs/pino/issues/648) that lambda has built into to support Cloudwatch insights and Xray tracing.

It also automatically tracks the request id, correlation ids, and xray tracing from upstream services, and can be set to debug mode by upstream services on a per-request basis.

### Conceptually based on the following

- [Capture and forward correlation IDs through different Lambda event sources](https://theburningmonk.com/2017/09/capture-and-forward-correlation-ids-through-different-lambda-event-sources/)
- [Decorated Lambda Handlers](https://tlvince.com/decorated-lambda-handlers)

## Usage

Basic usage for most applications

```ts
import pino from 'pino';
import { lambdaRequestTracker, pinoLambdaDestination } from 'pino-lambda';

// custom destination formatter
const destination = pinoLambdaDestination();
const logger = pino({
  // typical pino options
}, destination);
const withRequest = lambdaRequestTracker();

async function handler(event, context) {
  // automatic request tracing across all instances of pino
  // called once at the beginning of your Lambda handler
  withRequest(event, context);

  // typical logging methods
  logger.info({ data: 'Some data' }, 'A log message');
}
```

Cloudwatch output will now match the native `console.log` output, correctly preserving
`@requestid`, `@timestamp`, and `@message` properties for use in Cloudwatch Insights and
other Cloudwatch aware tools such as Datadog and Splunk.

```
2018-12-20T17:05:25.330Z    6fccb00e-0479-11e9-af91-d7ab5c8fe19e    INFO  A log message
{
   "awsRequestId": "6fccb00e-0479-11e9-af91-d7ab5c8fe19e",
   "x-correlation-id": "238da608-0542-11e9-8eb2-f2801f1b9fd1",
   "x-correlation-trace-id": "Root=1-5c1bcbd2-9cce3b07143efd5bea1224f2;Parent=07adc05e4e92bf13;Sampled=1",
   "level": 30,
   "message": "A log message",
   "data": "Some data"
}
```

## Lambda request tracing

With context tracing enabled, all instances of `pino` that use one of the built in formatters will automatically log the request id and other details so you don't need to pass an instance of a logger to all of your functions.

| Property                  | Value                                      | Info                                                                     |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| awsRequestId              | context.awsRequestId                       | The unique request id for this request                                   |
| apiRequestId              | context.requestContext.requestId           | The API Gateway RequestId                                                |
| x-correlation-id          | event.headers['x-correlation-id']          | The upstream request id for tracing                                      |
| x-correlation-trace-id    | process.env._X_AMZN_TRACE_ID               | The AWS Xray tracking id                                                 |
| x-correlation-\*          | event.headers.startsWith('x-correlation-') | Any header that starts with `x-correlation-` will be automatically added |

Every AWS Lambda request contains a unique request ID, `context.awsRequestId`. If the request originated outside of the AWS platform,
the request ID will match the `event.header.x-correlation-id` value. However, if the request originated from within the AWS platform,
the `event.header.x-correlation-id` will be set to the request ID of the calling service. This allows you to trace a request
across the entire platform.

Amazon XRAY also has a unique tracing ID that is propagated across the requests and can be tracked as well.

## Customize request tracing

You can customize the data that is tracked for each request by adding a per-request mixin. 
The request mixin takes the Lambda `event` and `context` and returns an object.

This differs from the built in [pino mixin](https://github.com/pinojs/pino/blob/master/docs/api.md#mixin-function) as it only executes
once per request where the built in pino mixin runs once per log entry.

```ts
import pino from 'pino';
import { lambdaRequestTracker, pinoLambdaDestination } from 'pino-lambda';

const destination = pinoLambdaDestination();
const logger = pino(destination);
const withRequest = lambdaRequestTracker({
  requestMixin: (event, context) => {
    return {
      // add request header host name
      host: event.headers?.host,

      // you can also set any request property to undefined
      // which will remove it from the output
      'x-correlation-id': undefined,

      // add any type of static data
      brand: 'famicom'
    };
  }
});

async function handler(event, context) {
  withRequest(event, context);
  logger.info({ data: 'Some data' }, 'A log message');
}
```

Output

```
2018-12-20T17:05:25.330Z    6fccb00e-0479-11e9-af91-d7ab5c8fe19e    INFO  A log message
{
   "awsRequestId": "6fccb00e-0479-11e9-af91-d7ab5c8fe19e",
   "x-correlation-trace-id": "Root=1-5c1bcbd2-9cce3b07143efd5bea1224f2;Parent=07adc05e4e92bf13;Sampled=1",
   "level": 30,
   "host": "www.host.com",
   "brand": "famicom",
   "message": "A log message",
   "data": "Some data"
}
```

## Customize output format

By default, the `pinoLambdaDestination` uses the `CloudwatchLogFormatter`. If you want the request tracing features of `pino-lambda`, but don't need the Cloudwatch format, you can use the `PinoLogFormatter` which matches the default object output format of `pino`.

```ts
import pino from 'pino';
import { 
  lambdaRequestTracker, 
  pinoLambdaDestination,
  PinoLogFormatter
} from 'pino-lambda';

const destination = pinoLambdaDestination({
  formatter: new PinoLogFormatter(),
});
const logger = pino(destination);
const withRequest = lambdaRequestTracker();

async function handler(event, context) {
  withRequest(event, context);
  logger.info({ data: 'Some data' }, 'A log message');
}
```

Output

```
{
   "awsRequestId": "6fccb00e-0479-11e9-af91-d7ab5c8fe19e",
   "x-correlation-trace-id": "Root=1-5c1bcbd2-9cce3b07143efd5bea1224f2;Parent=07adc05e4e92bf13;Sampled=1",
   "level": 30,
   "message": "A log message",
   "data": "Some data"
}
```

The formatter function can also be replaced with any custom implementation you need by using the supplied interface.

```ts
import { LogData, ILogFormatter } from 'pino-lambda';

class BananaLogFormatter implements ILogFormatter {
  format(data: LogData) {
    return `[BANANA] ${JSON.stringify(data)}`;
  }
}

const destination = pinoLambdaDestination({
  formatter: new BananaLogFormatter(),
});
const logger = pino(destination);
```

Output

```
[BANANA]
{
   "awsRequestId": "6fccb00e-0479-11e9-af91-d7ab5c8fe19e",
   "x-correlation-trace-id": "Root=1-5c1bcbd2-9cce3b07143efd5bea1224f2;Parent=07adc05e4e92bf13;Sampled=1",
   "level": 30,
   "message": "A log message",
   "data": "Some data"
}
```

## Best Practices

Unless your application is small, it can be useful to split the logger into its own module for easier reuse across your application code. This ensures that all your logging calls receive the correct formatting and context across the request.

```ts
// logger.ts
import pino from 'pino';
import { pinoLambdaDestination } from 'pino-lambda';

const destination = pinoLambdaDestination();
export const logger = pino(destination);
```

```ts
// handler.ts
import { lambdaRequestTracker } from 'pino-lambda';
import { logger } from './logger';

const withRequest = lambdaRequestTracker();

async function handler(event, context) {
  // automatic request tracing across all instances of pino
  // called once at the beginning of your Lambda handler
  withRequest(event, context);

  // typical logging methods
  logger.info({ data: 'Some data' }, 'A log message');
}
```

## Usage outside of Lambda handlers

You can use the this wrapper outside of the AWS lambda function in any place you want. This is especially useful in private npm modules that will be used by your AWS Lambda function. The default logger context is a shared instance, so it inherits all properties the default is configured for, and will emit request information for all logs. This effectively allows you to track a request across its entire set of log entries.


## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

[maintenance-image]: https://img.shields.io/badge/maintenance-active-green.svg?color=brightgreen&style=flat
