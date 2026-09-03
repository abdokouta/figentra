import { StorageException } from './storage.exception';

/**
 * Exception thrown when a requested storage driver is not found or supported.
 *
 * This exception is thrown by the StorageFactoryService when attempting to
 * create a driver instance for an unsupported or unrecognized driver type.
 * It includes information about available drivers to help with troubleshooting.
 *
 * @class DriverNotFoundException
 * @extends StorageException
 *
 * @example
 * ```typescript
 * throw DriverNotFoundException.make('rabbitmq', ['s3', 'minio']);
 * ```
 */
export class DriverNotFoundException extends StorageException {
  /**
   * Creates a new DriverNotFoundException instance.
   *
   * @param driverType - The driver type that was requested but not found
   * @param availableDrivers - Optional list of supported driver types
   *
   * @example
   * ```typescript
   * throw DriverNotFoundException.make('custom-driver', ['s3', 'minio']);
   * // Output: "Driver 'custom-driver' not found. Available drivers: s3, minio"
   * ```
   */
  constructor(driverType: string, availableDrivers?: string[]) {
    const message = availableDrivers
      ? `Driver '${driverType}' not found. Available drivers: ${availableDrivers.join(', ')}`
      : `Driver '${driverType}' not found`;

    super(message, 'DRIVER_NOT_FOUND', {
      driverType,
      availableDrivers,
    });

    this.name = 'DriverNotFoundException';
  }
}
