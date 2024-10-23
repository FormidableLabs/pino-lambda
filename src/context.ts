/* eslint-disable @typescript-eslint/no-explicit-any */
const CONTEXT_SYMBOL = Symbol.for('aws.lambda.runtime.context');

export interface ContextMap {
  awsRequestId: string;
  [key: string]: unknown;
}

export interface ContextStorageProvider {
  getContext: () => ContextMap;
  setContext: (map: ContextMap) => void;
  updateContext: (values: Record<string, unknown>) => void;
}

export const GlobalContextStorageProvider: ContextStorageProvider = {
  getContext: () => (global as any)[CONTEXT_SYMBOL] as ContextMap,
  setContext: (map: ContextMap) => ((global as any)[CONTEXT_SYMBOL] = map),
  updateContext: (values: Record<string, unknown>) => {
    const ctx = GlobalContextStorageProvider.getContext();
    (global as any)[CONTEXT_SYMBOL] = {
      ...ctx,
      ...values,
    };
  },
};
