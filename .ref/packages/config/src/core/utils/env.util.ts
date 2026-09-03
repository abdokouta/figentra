/**
 * @file env.util.ts
 * @module @stackra/config/core/utils
 * @description Helper function for reading environment variables in config files.
 *   Used inside defineConfig / registerAs factories for environment-sensitive values.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Read an environment variable with a default fallback.
 *
 * Provides a clean API for referencing env vars inside config files,
 * similar to Laravel's `env('DB_HOST', 'localhost')` helper.
 *
 * Resolution order:
 * 1. `process.env[key]` (Node.js)
 * 2. `import.meta.env[key]` (Vite — only when defined)
 * 3. `defaultValue` (fallback)
 *
 * @param key - Environment variable name
 * @param defaultValue - Fallback value when the variable is not set
 * @returns The environment variable value or default
 *
 * @example
 * ```typescript
 * import { env, registerAs } from '@stackra/config';
 *
 * export const databaseConfig = registerAs('database', () => ({
 *   host: env('DB_HOST', 'localhost'),
 *   port: Number(env('DB_PORT', '5432')),
 *   name: env('DB_NAME', 'app'),
 *   ssl: env('DB_SSL', 'false') === 'true',
 * }));
 * ```
 */
export function env(key: string, defaultValue: string = ''): string {
  // Node.js environment
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key] ?? defaultValue;
  }

  // Vite environment (compile-time inlined)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const value = (import.meta as any).env[key];
    if (value !== undefined) {
      return String(value);
    }
  }

  return defaultValue;
}

/**
 * Read an environment variable and throw if not set.
 *
 * Use for required env vars that must be present for the app to function.
 *
 * @param key - Environment variable name
 * @returns The environment variable value
 * @throws Error if the variable is not set
 *
 * @example
 * ```typescript
 * const secret = envOrFail('JWT_SECRET');
 * ```
 */
export function envOrFail(key: string): string {
  const value = env(key);
  if (value === '') {
    throw new Error(
      `Required environment variable "${key}" is not set. ` +
        `Please set it in your .env file or environment.`
    );
  }
  return value;
}
