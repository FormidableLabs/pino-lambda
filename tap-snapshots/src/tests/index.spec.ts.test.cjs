/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`src/tests/index.spec.ts TAP should add tags with a child logger > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	9048989	INFO	Message with userId	{"awsRequestId":"9048989","x-correlation-id":"9048989","level":30,"time":1480572000000,"userId":12,"msg":"Message with userId"}
`

exports[`src/tests/index.spec.ts TAP should allow custom formatter > must match snapshot 1`] = `
[BANANA] {"awsRequestId":"431234","x-correlation-id":"431234","level":30,"time":1480572000000,"msg":"Message with custom formatter"}
`

exports[`src/tests/index.spec.ts TAP should allow default pino formatter > must match snapshot 1`] = `
{"awsRequestId":"431234","x-correlation-id":"431234","level":30,"time":1480572000000,"msg":"Message with pino formatter"}
`

exports[`src/tests/index.spec.ts TAP should allow removing default request data > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	431234	INFO	Message with trace ID	{"awsRequestId":"431234","level":30,"time":1480572000000,"msg":"Message with trace ID"}
`

exports[`src/tests/index.spec.ts TAP should capture custom request data > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	431234	INFO	Message with trace ID	{"awsRequestId":"431234","x-correlation-id":"431234","host":"www.host.com","level":30,"time":1480572000000,"msg":"Message with trace ID"}
`

exports[`src/tests/index.spec.ts TAP should log a simple info message > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	INFO	Simple message	{"level":30,"time":1480572000000,"msg":"Simple message"}
`

exports[`src/tests/index.spec.ts TAP should log an error message with apiRequestId > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	12345	ERROR	Message with apiRequestId	{"awsRequestId":"12345","apiRequestId":"59996","x-correlation-id":"12345","level":50,"time":1480572000000,"msg":"Message with apiRequestId"}
`

exports[`src/tests/index.spec.ts TAP should log an error message with requestId > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	12345	ERROR	Message with request ID	{"awsRequestId":"12345","x-correlation-id":"12345","level":50,"time":1480572000000,"msg":"Message with request ID"}
`

exports[`src/tests/index.spec.ts TAP should log an info message with data > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	INFO	Message with data	{"level":30,"time":1480572000000,"data":{"stuff":"unicorns"},"msg":"Message with data"}
`

exports[`src/tests/index.spec.ts TAP should log an info message with requestId > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	12345	INFO	Message with request ID	{"awsRequestId":"12345","x-correlation-id":"12345","level":30,"time":1480572000000,"msg":"Message with request ID"}
`

exports[`src/tests/index.spec.ts TAP should log capitalize string levels > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	12345	DEBUG	Simple message	{"awsRequestId":"12345","x-correlation-id":"12345","level":"debug","time":1480572000000,"msg":"Simple message"}
`

exports[`src/tests/index.spec.ts TAP should log correlation headers > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	98875	ERROR	Message with correlation ids	{"awsRequestId":"98875","x-correlation-data":"abbb","x-correlation-service":"tyue","x-correlation-id":"98875","level":50,"time":1480572000000,"msg":"Message with correlation ids"}
`

exports[`src/tests/index.spec.ts TAP should not fail if level is an object > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	12345	[object Object]	Simple message	{"awsRequestId":"12345","x-correlation-id":"12345","level":{},"time":1480572000000,"msg":"Simple message"}
`

exports[`src/tests/index.spec.ts TAP should not fail if level number is invalid > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	12345	undefined	Simple message	{"awsRequestId":"12345","x-correlation-id":"12345","level":98,"time":1480572000000,"msg":"Simple message"}
`

exports[`src/tests/index.spec.ts TAP should preserve mixins > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	431234	INFO	Message with mixin line 2	{"awsRequestId":"431234","x-correlation-id":"431234","level":30,"time":1480572000000,"line":2,"msg":"Message with mixin line 2"}
`

exports[`src/tests/index.spec.ts TAP should set correlation if to trace id if present > must match snapshot 1`] = `
2016-12-01T06:00:00.000Z	98875	ERROR	Message with trace id	{"awsRequestId":"98875","x-correlation-trace-id":"168181818","x-correlation-id":"98875","level":50,"time":1480572000000,"msg":"Message with trace id"}
`
