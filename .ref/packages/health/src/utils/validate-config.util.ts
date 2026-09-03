/**
 * @file validate-config.util.ts
 * @module @stackra/nestjs-health/utils
 * @description Configuration validation for the health module.
 */

import {
  MIN_CONCURRENCY,
  MAX_CONCURRENCY,
  MIN_COOLDOWN_SECONDS,
  MAX_COOLDOWN_SECONDS,
  MIN_SCHEDULE_INTERVAL,
} from '../constants';
import type { IHealthModuleOptions } from '../interfaces';
import { InvalidConfigError } from '../errors';

/** Regex for valid basePath: lowercase alphanumeric, hyphens, forward slashes, no leading/trailing slashes. */
const BASE_PATH_PATTERN = /^[a-z0-9][a-z0-9\-/]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * Validate health module configuration.
 *
 * Throws InvalidConfigError for any invalid value.
 *
 * @param options - The configuration to validate
 * @throws {InvalidConfigError} When a configuration value is invalid
 */
export function validateConfig(options: IHealthModuleOptions): void {
  // Validate basePath
  if (options.basePath !== undefined) {
    if (!options.basePath || !BASE_PATH_PATTERN.test(options.basePath)) {
      throw new InvalidConfigError(
        `basePath must be a non-empty string containing only lowercase alphanumeric characters, hyphens, and forward slashes without leading or trailing slashes. Got: "${options.basePath}"`
      );
    }
  }

  // Validate concurrency
  if (options.execution?.concurrency !== undefined) {
    const c = options.execution.concurrency;
    if (!Number.isInteger(c) || c < MIN_CONCURRENCY || c > MAX_CONCURRENCY) {
      throw new InvalidConfigError(
        `execution.concurrency must be an integer between ${MIN_CONCURRENCY} and ${MAX_CONCURRENCY}. Got: ${c}`
      );
    }
  }

  // Validate cooldown
  if (options.notification?.cooldown !== undefined) {
    const cd = options.notification.cooldown;
    if (!Number.isInteger(cd) || cd < MIN_COOLDOWN_SECONDS || cd > MAX_COOLDOWN_SECONDS) {
      throw new InvalidConfigError(
        `notification.cooldown must be an integer between ${MIN_COOLDOWN_SECONDS} and ${MAX_COOLDOWN_SECONDS} seconds. Got: ${cd}`
      );
    }
  }

  // Validate schedule
  if (options.schedule !== undefined) {
    if (typeof options.schedule === 'number') {
      if (options.schedule < MIN_SCHEDULE_INTERVAL) {
        throw new InvalidConfigError(
          `schedule interval must be at least ${MIN_SCHEDULE_INTERVAL}ms. Got: ${options.schedule}`
        );
      }
    } else if (typeof options.schedule === 'string') {
      // Basic cron validation — must have 5 or 6 space-separated fields
      const fields = options.schedule.split(/\s+/).filter(Boolean);
      if (fields.length < 5 || fields.length > 6) {
        throw new InvalidConfigError(
          `schedule cron expression must have 5 or 6 fields. Got: "${options.schedule}"`
        );
      }
    }
  }

  // Validate disk threshold
  if (options.disk?.threshold !== undefined) {
    const t = options.disk.threshold;
    if (!Number.isFinite(t) || t < 1 || t > 100) {
      throw new InvalidConfigError(
        `disk.threshold must be a number between 1 and 100 (percent). Got: ${t}`
      );
    }
  }
}
