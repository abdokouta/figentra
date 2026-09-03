import { BaseException } from '@nesvel/exceptions';

/**
 * Transport Not Found Exception
 *
 * Thrown when a requested mail transport provider is not available
 *
 * @class TransportNotFoundException
 * @extends {BaseException}
 */
export class TransportNotFoundException extends BaseException {
  /**
   * Creates an instance of TransportNotFoundException
   *
   * @param transporter - The requested transport type
   * @param availableTransports - List of available transport types
   */
  constructor(transporter: string, availableTransports: string[]) {
    super(
      `Transport "${transporter}" not found. Available transports: ${availableTransports.join(', ')}`,
    );
  }
}
