pino-lambda
-----------------------

[![npm version](https://badge.fury.io/js/pino-lambda.svg)](https://badge.fury.io/js/pino-lambda)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Maintenance Status][maintenance-image]](#maintenance-status)

A lightweight drop-in decorator for [pino](https://github.com/pinojs/pino) that takes advantage of the unique environment in AWS Lambda functions.

By default, this wrapper reformats the log output so it matches the existing Cloudwatch format. The default pino configuration [loses some of the built in support for request ID tracing](https://github.com/pinojs/pino/issues/648) that lambda has built into Cloudwatch insights. This can be disabled or customized as needed.

It also tracks the request id, correlation ids, and xray tracing from upstream services, and can be set to debug mode by upstream services on a per-request basis.

### Conceptually based on the following

- [Capture and forward correlation IDs through different Lambda event sources](https://theburningmonk.com/2017/09/capture-and-forward-correlation-ids-through-different-lambda-event-sources/)
- [Decorated Lambda Handlers](https://tlvince.com/decorated-lambda-handlers)


## Usage

`pino-lambda` is a drop-in replacement for pino. The same configuration and setup can be used without changes.

```ts
import pino from 'pino-lambda';
const logger = pino();

async function handler(event, context) {
  // new extension added to pino to automatically track requests across all instances of pino
  logger.withRequest(event, context);

  // typical logging methods passthrough to pino
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

## Automatic Request ID Tracking

All instances of `pino-lambda` will be automatically log the request id so you don't need to pass an instance of a logger to all of your functions.

```ts
// handler.js
import pino from 'pino-lambda';
const logger = pino();

import { doSomething } from './service';

async function handler(event, context) {
  logger.withRequest(event, context);

  doSomething();
}
```

A second instance of the pino logger in another file automatically logs the request ID captured by the logger in the above handler.
This alleviates the need to pass an instance of a logger around, or pass the context.

```ts
// service.js
import pino from 'pino-lambda';
const logger = pino();

export function doSomething() {
  logger.info({ data: 'Welp' }, 'Another log message');
}
```

Cloudwatch Output

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

By default, the following event data is tracked for each log statement.

| Property                  | Value                                      | Info                                                                     |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| awsRequestId              | context.awsRequestId                       | The unique request id for this request                                   |
| apiRequestId              | context.requestContext.requestId           | The API Gateway RequestId                                                |
| x-correlation-id          | event.headers['x-correlation-id']          | The upstream request id for tracing                                      |
| x-correlation-trace-debug | event.headers['x-correlation-debug']       | The upstream service wants debug logs enabled for this request           |
| x-correlation-trace-id    | process.env._X_AMZN_TRACE_ID_              | The AWS Xray tracking id                                                 |
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
import pino from 'pino-lambda';
const logger = pino({
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

If you want the request tracing features, but don't need the Cloudwatch format, you can use the default pino formatter, or supply your own formatter.

```ts
// default Pino formatter for logs
import pino, { PinoLogFormatter } from 'pino-lambda';
const logger = pino({
  formatter: new PinoLogFormatter(),
});
```

Output

```
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

The formatter function can be replaced with any custom implementation you require by using the supplied interface.

```ts
import pino, { ExtendedPinoLambdaOptions, ILogFormatter } from 'pino-lambda';

class BananaLogFormatter implements ILogFormatter {
  format(buffer: string, options: ExtendedPinoLambdaOptions) {
    return `[BANANA] ${buffer}`;
  }
}

const logger = pino({
  formatter: new BananaLogFormatter(),
});
```

Output

```
[BANANA]
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

## Downstream Request Debugging

When upstream services invoke a Lambda using `pino-lambda` they can send the `x-correlation-debug` header with a value of `true`. This will enable `debug` logging for that specific request. This is useful for tracing issues across the platform.

## Usage outside of Lambda handlers

You can use the this wrapper outside of the AWS lambda function in any place you want. This is especially useful in private npm modules that will be used by your AWS Lambda function. The default logger context is a shared instance, so it inherits all properties the default is configured for, and will emit request information for all logs. This effectively allows you to track a request across its entire set of log entries.


## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

[maintenance-image]: https://img.shields.io/badge/maintenance-active-green.svg?color=brightgreen&style=flat
