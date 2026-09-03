import type { Config } from 'jest';
import base from '@nesvel/jest-config/nest-lib';

/**
 * Jest configuration object
 *
 * Extends base configuration with:
 * - Custom coverage collection rules
 * - Path aliases for pub/sub modules
 * - Setup files for message broker testing
 */
const config: Config = {
  // Inherit base configuration from shared Jest config
  ...base,

  /**
   * Coverage collection patterns
   * Collects coverage from all TypeScript files except:
   * - Interface files (type-only, no runtime code)
   * - Enum files (simple enumerations)
   * - Index files (re-exports only)
   * - Constant files (static values)
   */
  collectCoverageFrom: [
    'src/**/*.ts', // Include all TypeScript files
    '!src/**/*.interface.ts', // Exclude interfaces
    '!src/**/*.enum.ts', // Exclude enums
    '!src/**/index.ts', // Exclude index files
    '!src/**/*.constant.ts', // Exclude constants
  ],

  /**
   * Module name mapper for path aliases
   * Maps TypeScript path aliases to actual file locations for Jest
   * Supports both file-level and folder-level imports
   */
  moduleNameMapper: {
    // Config: PubSub configuration and connection options
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@config$': '<rootDir>/src/config',

    // Constants: Channel names, topic patterns, defaults
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@constants$': '<rootDir>/src/constants',

    // Decorators: Subscribe and Publish decorators
    '^@decorators/(.*)$': '<rootDir>/src/decorators/$1',
    '^@decorators$': '<rootDir>/src/decorators',

    // Drivers: Message broker implementations (Redis, RabbitMQ, etc.)
    '^@drivers/(.*)$': '<rootDir>/src/drivers/$1',
    '^@drivers$': '<rootDir>/src/drivers',

    // Enums: Message types and broker types
    '^@enums/(.*)$': '<rootDir>/src/enums/$1',
    '^@enums$': '<rootDir>/src/enums',

    // Exceptions: PubSub error classes
    '^@exceptions/(.*)$': '<rootDir>/src/exceptions/$1',
    '^@exceptions$': '<rootDir>/src/exceptions',

    // Interfaces: Message and subscription interfaces
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@interfaces$': '<rootDir>/src/interfaces',

    // Services: PubSub service implementations
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@services$': '<rootDir>/src/services',

    // Types: Message payload types
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@types$': '<rootDir>/src/types',

    // Utils: Message serialization and helpers
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@utils$': '<rootDir>/src/utils',
  },

  /**
   * Setup files to run after test environment is set up
   * Initializes message broker mocks and test utilities
   */
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};

export default config;
