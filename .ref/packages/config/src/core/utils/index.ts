/**
 * @file index.ts
 * @module @stackra/config/core/utils
 * @description Barrel export for config utility functions.
 */

export { defineConfig, getPendingConfigs, clearPendingConfigs } from './define-config.util';
export { getNestedValue } from './get-nested-value.util';
export { hasNestedValue } from './has-nested-value.util';
export { registerAs } from './register-as.util';
export { env, envOrFail } from './env.util';
export { flatten, unflatten } from './flatten.util';
