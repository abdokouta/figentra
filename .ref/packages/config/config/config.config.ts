/**
 * @file config.config.ts
 * @module @stackra/config/config
 * @description Application-level configuration system settings.
 *   Consumed by `ConfigModule.forRoot()` at bootstrap.
 *
 *   This is the meta-config — it configures the config system itself:
 *   which sources to use, their drivers, sensitive keys to redact, etc.
 */

import { IdefineConfig } from '@stackra/config';

export default IdefineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Source
  |--------------------------------------------------------------------------
  |
  | This option defines which named source is used by default when calling
  | `config.get()` or `@InjectConfig()` without specifying a source name.
  | Must match a key in the "sources" object below.
  |
  */
  default: 'env',

  /*
  |--------------------------------------------------------------------------
  | Configuration Sources
  |--------------------------------------------------------------------------
  |
  | Here you may configure all of the config "sources" for your application.
  | Each source has a driver that determines where config values are loaded
  | from. You may define multiple sources for different concerns.
  |
  | Supported drivers:
  |   - "env"    — reads from process.env / import.meta.env / window.__APP_CONFIG__
  |   - "memory" — in-memory Map (mutable, for testing/runtime)
  |   - "static" — plain object, read-only after construction
  |   - "http"   — fetches JSON from a remote endpoint
  |   - "file"   — scans config/*.config.ts files (NestJS only)
  |
  */
  sources: {
    env: {
      driver: 'env',
      envPrefix: 'auto',
      expandVariables: true,
      ignoreEnvFile: false,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Sensitive Keys
  |--------------------------------------------------------------------------
  |
  | Keys matching these patterns are automatically redacted in `toSafeObject()`
  | output, preventing accidental exposure in logs, debug dumps, or API
  | responses. Supports exact matches and wildcard patterns (*).
  |
  */
  sensitiveKeys: [
    '*_SECRET',
    '*_KEY',
    '*_TOKEN',
    '*_PASSWORD',
    'APP_KEY',
    'DB_PASSWORD',
    'JWT_SECRET',
    'API_SECRET',
    'ENCRYPTION_KEY',
  ],

  /*
  |--------------------------------------------------------------------------
  | Debug Mode
  |--------------------------------------------------------------------------
  |
  | When true, the config system logs all resolution decisions at debug level.
  | Useful for diagnosing precedence issues (which source provided a value).
  | Disable in production.
  |
  */
  debug: false,
});
