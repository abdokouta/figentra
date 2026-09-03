import type { Config } from "jest";
import base from "@nesvel/jest-config/nest-lib";

/**
 * Jest configuration object
 *
 * Extends base configuration with:
 * - Custom coverage collection rules
 * - Path aliases matching tsconfig.json
 */
const config: Config = {
  // Inherit base configuration from shared Jest config
  ...base,

  /**
   * Coverage collection patterns
   * Collects coverage from all TypeScript files except:
   * - Interface files (type-only, no runtime code)
   * - Type files (type aliases only)
   * - Index files (re-exports only)
   * - Constant files (static values)
   * - Config files (configuration only)
   */
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.interface.ts",
    "!src/**/*.type.ts",
    "!src/**/index.ts",
    "!src/**/*.constant.ts",
    "!src/**/*.config.ts",
  ],

  /**
   * Module name mapper for path aliases
   * Maps TypeScript path aliases to actual file locations for Jest
   */
  moduleNameMapper: {
    // Root alias for any src file
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
