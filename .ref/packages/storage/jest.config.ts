import type { Config } from 'jest';
import base from '@nesvel/jest-config/nest-lib';

/**
 * Jest configuration object
 *
 * Extends base configuration with:
 * - Custom test root directory
 * - Path aliases for storage modules
 * - Setup files for storage driver mocking
 */
const config: Config = {
  // Inherit base configuration from shared Jest config
  ...base,

  /**
   * Test root directories
   * Limits Jest to only search for tests in __tests__ directory
   */
  roots: ['<rootDir>/__tests__'],

  /**
   * Setup files to run after test environment is set up
   * Initializes storage driver mocks (S3, Local, etc.) and test utilities
   */
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  /**
   * Module name mapper for path aliases
   * Maps TypeScript path aliases to actual file locations for Jest
   * Ensures imports like '@drivers/s3' resolve correctly in tests
   */
  moduleNameMapper: {
    // Config: Storage configuration and connection options
    '^@config/(.*)$': '<rootDir>/src/config/$1',

    // Constants: Default paths, bucket names, MIME types
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',

    // Decorators: Storage decorators for file uploads
    '^@decorators/(.*)$': '<rootDir>/src/decorators/$1',

    // Drivers: Storage backend implementations (S3, Local, GCS, etc.)
    '^@drivers/(.*)$': '<rootDir>/src/drivers/$1',

    // Enums: Storage provider types and file visibility
    '^@enums/(.*)$': '<rootDir>/src/enums/$1',

    // Exceptions: Storage error classes
    '^@exceptions/(.*)$': '<rootDir>/src/exceptions/$1',

    // Interfaces: File and storage interfaces
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',

    // Services: Storage service implementations
    '^@services/(.*)$': '<rootDir>/src/services/$1',

    // Types: File metadata and upload types
    '^@types/(.*)$': '<rootDir>/src/types/$1',

    // Utils: File processing and validation helpers
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
};

export default config;
