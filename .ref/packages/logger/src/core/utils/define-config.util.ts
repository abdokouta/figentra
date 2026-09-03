/**
 * @file define-config.util.ts
 * @module @stackra/logger/core/utils
 * @description Type-safe logger configuration builder.
 *   Merges user-provided partial config with sensible defaults.
 *   Supports environment-driven overrides via LOG_LEVEL, LOG_CHANNEL,
 *   and NODE_ENV-based conditional configuration.
 */

import { type ILoggerModuleConfig, type ILogChannelConfig, ILogLevel } from '@stackra/contracts';

/**
 * Default logger configuration — single 'app' channel with console reporter.
 */
export const DEFAULT_CONFIG: ILoggerModuleConfig = {
  default: 'app',
  channels: {
    app: {
      level: ILogLevel.DEBUG,
      reporters: ['console'],
      formatter: 'pretty',
    },
  },
};

/**
 * Create a type-safe logger module configuration with defaults.
 *
 * Merges the provided partial config with sensible defaults:
 * - Default channel: 'app'
 * - Default reporters: ['console']
 * - Default level: DEBUG
 *
 * Also applies environment-driven overrides:
 * - `LOG_LEVEL` env var overrides all channel levels
 * - `LOG_CHANNEL` env var overrides the default channel
 * - `NODE_ENV` selects from `config.environments` for conditional config
 *
 * Uses `globalThis.process?.env` for browser safety (no crash if process is undefined).
 *
 * @param config - Partial configuration to merge with defaults
 * @returns Complete logger module configuration
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@stackra/logger';
 * import { ILogLevel } from '@stackra/contracts';
 *
 * export default defineConfig({
 *   default: 'app',
 *   channels: {
 *     app: { level: ILogLevel.INFO, reporters: ['console', 'json'] },
 *     audit: { level: ILogLevel.INFO, reporters: ['json'] },
 *   },
 *   environments: {
 *     production: { channels: { app: { level: ILogLevel.WARN, reporters: ['json'] } } },
 *     test: { channels: { app: { level: ILogLevel.SILENT, reporters: ['silent'] } } },
 *   },
 *   globalContext: { service: 'api', env: 'production' },
 *   redact: { paths: ['password', 'token', '*.secret'] },
 * });
 * ```
 */
export function defineConfig(config: Partial<ILoggerModuleConfig> = {}): ILoggerModuleConfig {
  let merged: ILoggerModuleConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    channels: {
      ...DEFAULT_CONFIG.channels,
      ...config.channels,
    },
  };

  // Apply environment-specific overrides from config.environments
  merged = applyEnvironmentOverrides(merged);

  // Apply environment variable overrides (LOG_LEVEL, LOG_CHANNEL)
  merged = applyEnvVarOverrides(merged);

  return merged;
}

/**
 * Apply NODE_ENV-based conditional configuration.
 * Reads from `config.environments[NODE_ENV]` and deep-merges into the base config.
 *
 * @param config - Base configuration
 * @returns Configuration with environment overrides applied
 */
export function applyEnvironmentOverrides(config: ILoggerModuleConfig): ILoggerModuleConfig {
  if (!config.environments) return config;

  const env = getEnvVar('NODE_ENV');
  if (!env) return config;

  const envOverride = config.environments[env];
  if (!envOverride) return config;

  // Deep-merge the environment override into the base config
  const mergedChannels: Record<string, ILogChannelConfig> = { ...config.channels };
  if (envOverride.channels) {
    for (const [name, channelOverride] of Object.entries(envOverride.channels)) {
      mergedChannels[name] = {
        ...(mergedChannels[name] ?? { level: ILogLevel.DEBUG, reporters: ['console'] }),
        ...channelOverride,
      };
    }
  }

  return {
    ...config,
    ...envOverride,
    channels: mergedChannels,
    // Don't override environments recursively
    environments: config.environments,
  };
}

/**
 * Apply LOG_LEVEL and LOG_CHANNEL environment variable overrides.
 *
 * @param config - Configuration to override
 * @returns Configuration with env var overrides applied
 */
export function applyEnvVarOverrides(config: ILoggerModuleConfig): ILoggerModuleConfig {
  const logLevel = getEnvVar('LOG_LEVEL');
  const logChannel = getEnvVar('LOG_CHANNEL');

  let result = config;

  // Override all channel levels if LOG_LEVEL is set
  if (logLevel) {
    const level = resolveLogLevel(logLevel);
    if (level) {
      const channels: Record<string, ILogChannelConfig> = {};
      for (const [name, ch] of Object.entries(result.channels)) {
        channels[name] = { ...ch, level };
      }
      result = { ...result, channels };
    }
  }

  // Override default channel if LOG_CHANNEL is set
  if (logChannel) {
    result = { ...result, default: logChannel };
  }

  return result;
}

/**
 * Safely read an environment variable using globalThis.process?.env.
 * Returns undefined if process or env is not available (browser environments).
 *
 * @param name - Environment variable name
 * @returns Value or undefined
 */
export function getEnvVar(name: string): string | undefined {
  try {
    return (globalThis as any).process?.env?.[name] ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve a string to a ILogLevel enum value.
 *
 * @param value - Log level string (case-insensitive)
 * @returns Resolved ILogLevel or undefined if invalid
 */
export function resolveLogLevel(value: string): ILogLevel | undefined {
  const map: Record<string, ILogLevel> = {
    debug: ILogLevel.DEBUG,
    info: ILogLevel.INFO,
    warn: ILogLevel.WARN,
    warning: ILogLevel.WARN,
    error: ILogLevel.ERROR,
    fatal: ILogLevel.FATAL,
    silent: ILogLevel.SILENT,
  };
  return map[value.toLowerCase()];
}
