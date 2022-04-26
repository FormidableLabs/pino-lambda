import { ContextMap, GlobalContextStorageProvider } from './context';
import { LambdaEvent, LambdaContext, LambdaRequestTrackerOptions } from './types';

const AMAZON_TRACE_ID = '_X_AMZN_TRACE_ID';
const CORRELATION_HEADER = 'x-correlation-';
const CORRELATION_ID = `${CORRELATION_HEADER}id`;
const CORRELATION_TRACE_ID = `${CORRELATION_HEADER}trace-id`;

/**
 * Creates a function for tracing Lambda request context across logging calls
 * @param options The request options
 */
export const lambdaRequestTracker = (options: LambdaRequestTrackerOptions = {}) => (
  event: LambdaEvent,
  context: LambdaContext,
): void => {
  const ctx: ContextMap = {
    awsRequestId: context.awsRequestId,
  };

  // capture api gateway request ID
  const apiRequestId = event.requestContext?.requestId;
  if (apiRequestId) {
    ctx.apiRequestId = apiRequestId;
  }

  // capture any correlation headers sent from upstream callers
  if (event.headers) {
    Object.keys(event.headers).forEach((header) => {
      if (header.toLowerCase().startsWith(CORRELATION_HEADER)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ctx[header] = event.headers![header] as string;
      }
    });
  }

  // capture the xray trace id if its enabled
  if (process.env[AMAZON_TRACE_ID]) {
    ctx[CORRELATION_TRACE_ID] = process.env[AMAZON_TRACE_ID] as string;
  }

  // set the correlation id if not already set by upstream callers
  if (!ctx[CORRELATION_ID]) {
    ctx[CORRELATION_ID] = context.awsRequestId;
  }

  // handle custom request level mixins
  if (options.requestMixin) {
    const result = options.requestMixin(event, context);
    for (const key in result) {
      // Cast this to string for typescript
      // when the JSON serializer runs, by default it omits undefined properties
      ctx[key] = result[key] as string;
    }
  }

  const storageProvider = options.storageProvider || GlobalContextStorageProvider;
  if (storageProvider) {
    storageProvider.setContext(ctx);
  }
};
