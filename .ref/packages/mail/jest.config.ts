import type { Config } from 'jest';
import base from '@nesvel/jest-config/nest-lib';

/**
 * Jest configuration object
 *
 * Extends base configuration with:
 * - Custom coverage collection rules
 * - Path aliases for search-specific modules
 * - Transform patterns for ESM dependencies
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
   * - Example files (documentation)
   */
  collectCoverageFrom: [
    'src/**/*.ts', // Include all TypeScript files
    '!src/**/*.interface.ts', // Exclude interfaces
    '!src/**/*.enum.ts', // Exclude enums
    '!src/**/index.ts', // Exclude index files
    '!src/**/*.constant.ts', // Exclude constants
    '!src/**/examples.ts', // Exclude examples
  ],

  /**
   * Module name mapper for path aliases
   * Maps TypeScript path aliases to actual file locations for Jest
   * Supports both file-level (@path) and folder-level (@providers) aliases
   */
  moduleNameMapper: {
    // Root alias: Direct access to src folder
    '^@(.*)$': '<rootDir>/src/$1',
  },

  /**
   * Setup files to run after test environment is set up
   * Initializes search engine mocks, test fixtures, and utilities
   */
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  /**
   * Transform ignore patterns
   * Transforms ESM dependencies from node_modules
   */
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
};

export default config;
