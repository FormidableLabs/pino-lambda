import { Writable } from 'stream';
import { GlobalContextStorageProvider } from './context';
import { CloudwatchLogFormatter } from './formatters';
import { PinoLambdaOptions } from './types';

/**
 * Custom destination stream for pino
 * @param options Options
 */
export const pinoLambdaDestination = (options: PinoLambdaOptions = {}): Writable => {
  const writeable = new Writable({
    defaultEncoding: 'utf8',
    write(chunk, encoding, callback) {
      const storageProvider = options.storageProvider || GlobalContextStorageProvider;
      const formatter = options?.formatter || new CloudwatchLogFormatter();

      const data = JSON.parse(chunk);
      const lambdaContext = storageProvider.getContext() || {};

      // format the combined request context and log data
      let output = formatter.format({ ...lambdaContext, ...data });

      // replace characters for proper formatting
      output = output.replace(/\n/, '\r');

      // final entry must end with carriage return
      output += '\n';

      if (options.streamWriter) {
        options.streamWriter(output);
      } else {
        process.stdout.write(output);
      }

      callback();
    },
  });

  return writeable;
};
