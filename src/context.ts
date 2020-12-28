/* eslint-disable @typescript-eslint/no-explicit-any */
const CONTEXT_SYMBOL = Symbol.for('aws.lambda.runtime.context');

export interface ContextMap {
  awsRequestId: string,
  [key: string]: string
 };

export interface ContextStorageProvider {
  getContext: () => ContextMap;
  setContext: (map: ContextMap) => void;
}

export const GlobalContextStorageProvider: ContextStorageProvider = {
  getContext: () => (global as any)[CONTEXT_SYMBOL] as ContextMap,
  setContext: (map: ContextMap) => ((global as any)[CONTEXT_SYMBOL] = map),
};
