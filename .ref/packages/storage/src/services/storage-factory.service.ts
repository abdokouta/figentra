import { Injectable } from '@nestjs/common';
import { BaseFactory } from '@nesvel/shared';

import { S3StorageDriver } from '@drivers/s3/s3-storage.driver';
import { MinIOStorageDriver } from '@drivers/minio/minio-storage.driver';
import { LocalStorageDriver } from '@drivers/local/local-storage.driver';
import { StorageDriverType } from '@enums/storage-driver-type.enum';
import type { IStorageDriver } from '@interfaces/storage-driver.interface';
import type { IStorageOptions } from '@interfaces/storage-options.interface';
import { DriverNotFoundException } from '@exceptions/driver-not-found.exception';

/**
 * Factory service for creating and configuring Storage driver instances.
 *
 * This service extends BaseFactory to provide a standardized factory pattern for
 * creating storage driver instances. It manages the lifecycle and configuration
 * of various storage backends including S3 and MinIO.
 *
 * Architecture:
 * - Extends BaseFactory with storage-specific configuration handling
 * - Maintains a registry of available storage drivers
 * - Provides driver-specific validation and instantiation
 * - Supports automatic connection management
 * - Enables custom driver registration at runtime
 *
 * Supported Drivers:
 * - S3: Amazon S3 and S3-compatible storage services
 * - MinIO: Self-hosted S3-compatible object storage
 *
 * Key Features:
 * - Automatic driver instantiation with connection management
 * - Driver-specific option validation (bucket, region, credentials, etc.)
 * - Runtime driver registration for custom implementations
 * - Type-safe operations with full TypeScript support
 * - Comprehensive error handling with available drivers information
 *
 * @extends BaseFactory<IStorageOptions, IStorageDriver, Record<string, any>>
 *
 * @example
 * Basic usage with S3:
 * ```typescript
 * const driver = await storageFactory.createDriver({
 *   driver: StorageDriverType.S3,
 *   driverOptions: {
 *     region: 'us-east-1',
 *     bucket: 'my-bucket',
 *     credentials: {
 *       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
 *     }
 *   },
 *   autoConnect: true
 * });
 *
 * await driver.upload('file.pdf', buffer);
 * ```
 *
 * @example
 * Using MinIO for self-hosted storage:
 * ```typescript
 * const driver = await storageFactory.createDriver({
 *   driver: StorageDriverType.MINIO,
 *   driverOptions: {
 *     endPoint: 'localhost',
 *     port: 9000,
 *     accessKey: 'minioadmin',
 *     secretKey: 'minioadmin',
 *     bucket: 'my-bucket'
 *   }
 * });
 * ```
 *
 * @example
 * Registering a custom Storage driver:
 * ```typescript
 * class CustomStorageDriver implements IStorageDriver {
 *   constructor(options: any) { ... }
 *   async connect(): Promise<void> { ... }
 *   async upload(path: string, content: Buffer): Promise<IStorageFile> { ... }
 * }
 *
 * storageFactory.registerDriver('custom', CustomStorageDriver);
 * ```
 *
 * @see {@link BaseFactory} For base factory implementation
 * @see {@link IStorageDriver} For driver interface specification
 * @see {@link IStorageOptions} For configuration options
 *
 * @author Nesvel
 * @since 1.0.0
 */
@Injectable()
export class StorageFactoryService extends BaseFactory<
  IStorageOptions,
  IStorageDriver,
  Record<string, any>
> {
  /**
   * Registry of available storage drivers.
   *
   * Maps driver type identifiers to their corresponding driver classes.
   * This registry is used by BaseFactory to instantiate the appropriate
   * storage driver based on configuration.
   *
   * Available drivers:
   * - S3: Amazon S3 and S3-compatible storage (AWS SDK v3)
   * - MINIO: MinIO object storage for self-hosted deployments
   * - LOCAL: Local filesystem storage for development and testing
   *
   * @protected
   * @readonly
   */
  protected readonly driverRegistry = new Map<string, any>([
    [StorageDriverType.S3, S3StorageDriver],
    [StorageDriverType.MINIO, MinIOStorageDriver],
    [StorageDriverType.LOCAL, LocalStorageDriver],
  ]);

  /**
   * Extracts the storage driver type from configuration.
   *
   * Determines which storage driver should be used based on the provided
   * configuration. The driver type determines the storage backend (S3 or MinIO).
   *
   * @param options - The storage configuration object containing driver selection
   * @returns The driver type identifier (e.g., 's3', 'minio')
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const driver = this.getDriverType({ driver: StorageDriverType.S3 });
   * // Returns: 's3'
   *
   * const minioDriver = this.getDriverType({ driver: StorageDriverType.MINIO });
   * // Returns: 'minio'
   * ```
   */
  protected getDriverType(options: IStorageOptions): string {
    return options.driver;
  }

  /**
   * Gets driver-specific configuration options.
   *
   * Extracts and returns the configuration options specific to the selected
   * storage driver using typed driver-specific options (s3, minio, local).
   *
   * Each driver has its own set of configurable parameters:
   * - S3: region, bucket, credentials, endpoint, forcePathStyle, etc.
   * - MinIO: endPoint, port, accessKey, secretKey, bucket, region, etc.
   * - Local: root, baseUrl, ensureDirectoryExists, etc.
   *
   * @param options - The storage configuration containing driver-specific options
   * @returns Driver-specific configuration options
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const s3Opts = this.getDriverOptions({
   *   driver: StorageDriverType.S3,
   *   s3: { region: 'us-east-1', bucket: 'my-bucket' }
   * });
   * // Returns: { region: 'us-east-1', bucket: 'my-bucket' }
   *
   * const minioOpts = this.getDriverOptions({
   *   driver: StorageDriverType.MINIO,
   *   minio: { endPoint: 'localhost', port: 9000 }
   * });
   * // Returns: { endPoint: 'localhost', port: 9000 }
   *
   * const localOpts = this.getDriverOptions({
   *   driver: StorageDriverType.LOCAL,
   *   local: { root: './storage' }
   * });
   * // Returns: { root: './storage' }
   * ```
   */
  protected getDriverOptions(options: IStorageOptions): Record<string, any> {
    const driverType = this.getDriverType(options);

    // Return typed driver options based on driver type
    switch (driverType) {
      case StorageDriverType.S3:
        return options.s3 || {};
      case StorageDriverType.MINIO:
        return options.minio || {};
      case StorageDriverType.LOCAL:
        return options.local || {};
      default:
        return {};
    }
  }

  /**
   * Instantiates a storage driver with driver-specific options.
   *
   * Creates a new instance of the specified storage driver class, passing
   * the driver-specific configuration. After instantiation, automatically
   * connects the driver if autoConnect is enabled in the configuration.
   *
   * Storage drivers use a simple constructor pattern rather than static
   * factory methods, so instantiation is straightforward: `DriverClass.make(options)`.
   *
   * @param DriverClass - The driver class constructor (S3StorageDriver, MinIOStorageDriver)
   * @param driverOptions - Driver-specific configuration (connection details, bucket, etc.)
   * @param config - Full storage configuration containing autoConnect flag
   * @returns A configured storage driver instance, connected if autoConnect is true
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const driver = this.instantiateDriver(
   *   S3StorageDriver,
   *   { region: 'us-east-1', bucket: 'my-bucket' },
   *   {
   *     driver: StorageDriverType.S3,
   *     s3: { region: 'us-east-1', bucket: 'my-bucket' },
   *     autoConnect: true
   *   }
   * );
   * // Returns: S3StorageDriver instance, already connected
   * ```
   */
  protected instantiateDriver(
    DriverClass: any,
    driverOptions: Record<string, any> | undefined,
    config: IStorageOptions
  ): IStorageDriver {
    // Instantiate driver with driver-specific options
    const driver = DriverClass.make(driverOptions);

    // Auto-connect if requested (fire and forget for compatibility)
    // Note: This maintains async behavior without blocking factory creation
    if (config.autoConnect !== false) {
      driver.connect().catch((error: Error) => {
        this.logger.error(
          `Failed to auto-connect storage driver ${this.getDriverType(config)}:`,
          error
        );
      });
    }

    return driver;
  }

  /**
   * Creates the appropriate error for unsupported driver.
   *
   * Generates a custom DriverNotFoundException when a requested storage driver
   * is not found in the driver registry. This error provides helpful information
   * about the invalid driver and lists all available drivers.
   *
   * @param driverType - The requested driver identifier that wasn't found in the registry
   * @param availableDrivers - List of all available driver types for helpful error message
   * @returns A DriverNotFoundException instance with descriptive error message
   *
   * @protected
   * @override Implementation of BaseFactory abstract method
   *
   * @example
   * ```typescript
   * const error = this.getNotFoundError('unknown-driver', ['s3', 'minio']);
   * // Returns: DriverNotFoundException with message:
   * // "Driver 'unknown-driver' not found. Available drivers: s3, minio"
   * ```
   */
  protected getNotFoundError(driverType: string, availableDrivers: string[]): Error {
    return DriverNotFoundException.make(driverType, availableDrivers);
  }

  /**
   * Creates a storage driver instance with automatic connection.
   *
   * This is a convenience wrapper around the base createDriver method that
   * explicitly handles the async connection process. Unlike the base method,
   * this ensures the driver is fully connected before returning.
   *
   * @param options - Storage configuration options
   * @param autoConnect - Whether to automatically connect the driver (default: true)
   * @returns Promise resolving to the initialized and connected driver instance
   *
   * @throws {DriverNotFoundException} If the specified driver type is not supported
   * @throws {Error} If driver initialization or connection fails
   *
   * @example
   * ```typescript
   * const driver = await factory.createDriverAsync({
   *   driver: StorageDriverType.S3,
   *   driverOptions: {
   *     region: 'us-east-1',
   *     bucket: 'my-bucket',
   *     credentials: { ... }
   *   }
   * });
   *
   * // Driver is guaranteed to be connected
   * await driver.upload('file.pdf', buffer);
   * ```
   */
  async createDriverAsync(
    options: IStorageOptions,
    autoConnect: boolean = true
  ): Promise<IStorageDriver> {
    // Create driver using base factory method
    const driver = this.createDriver(options);

    // Explicitly connect if requested and not already connected
    if (autoConnect && !driver.isConnected()) {
      await driver.connect();
    }

    return driver;
  }
}
