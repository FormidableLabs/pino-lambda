import { DestinationStream } from "pino";
import { CloudwatchLogFormatter } from "./formatters";
import { ExtendedPinoOptions } from "./types";

/**
 * Custom destination stream for Pino
 * @param options Pino options
 * @param storageProvider Global storage provider for request values
 */
export const createStream = (options: ExtendedPinoOptions): DestinationStream => ({
  write(buffer: string) {
    let output = buffer;
    if (!options.prettyPrint) {
      const formatter = options?.formatter || new CloudwatchLogFormatter();
      output = formatter.format(buffer, options);
      
      // replace characters for proper formatting
      output = output.replace(/\n/, '\r');

      // final entry must end with carriage return
      output += '\n';
    }

    if (options.streamWriter) {
      return options.streamWriter(output);
    }
    return process.stdout.write(output);
  },
});
